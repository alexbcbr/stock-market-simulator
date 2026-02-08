#!/usr/bin/env python3
"""
Import market data from CSV to DynamoDB table.
This script reads data from a CSV file and automatically detects whether to import to 'market_price' or 'market_symbol'.
Supports both formats:
  - market_price: Close, High, Low, Open, Volume, Ticker
  - market_symbol: Symbol, Name, LastSale, MarketCap, IPOyear, Sector, industry, Summary Quote
"""

import csv
import sys
from typing import Dict, List, Any, Tuple
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError, NoCredentialsError


def read_csv_file(file_path: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Read CSV file and return list of dictionaries and column names.
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        Tuple of (list of dictionaries containing the CSV data, list of column names)
    """
    data = []
    column_names = []
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            column_names = reader.fieldnames or []
            for row in reader:
                data.append(row)
        print(f"✓ Read {len(data)} rows from {file_path}")
        print(f"✓ CSV Columns detected: {', '.join(column_names)}\n")
        return data, column_names
    except FileNotFoundError:
        print(f"✗ Error: File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error reading CSV file: {e}")
        sys.exit(1)


def detect_import_type(column_names: List[str]) -> Tuple[str, str]:
    """
    Detect the import type based on CSV column names.
    
    Args:
        column_names: List of column names from the CSV file
        
    Returns:
        Tuple of (import_type, table_name) - either ('price', 'market_price') or ('symbol', 'market_symbol')
    """
    column_names_lower = [col.lower().strip() for col in column_names]
    
    # Check for market_symbol columns
    symbol_indicators = {'symbol', 'name', 'lastsale', 'marketcap', 'ipoyear', 'sector', 'industry', 'summary quote'}
    if symbol_indicators.issubset(set(column_names_lower)):
        return 'symbol', 'market_symbol'
    
    # Check for market_price columns
    price_indicators = {'close', 'high', 'low', 'open', 'volume', 'ticker'}
    if price_indicators.issubset(set(column_names_lower)):
        return 'price', 'market_price'
    
    print("✗ Error: Unable to detect CSV format.")
    print(f"  Expected columns for market_price: Close, High, Low, Open, Volume, Ticker")
    print(f"  Expected columns for market_symbol: Symbol, Name, LastSale, MarketCap, IPOyear, Sector, industry, Summary Quote")
    print(f"  Found columns: {', '.join(column_names)}")
    sys.exit(1)


def map_price_row(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Map market price CSV row to DynamoDB item format.
    
    CSV columns: Close, High, Low, Open, Volume, Ticker
    DynamoDB fields: symbol, close_price, highest_price, lowest_price, open_price, volume
    
    Args:
        row: Dictionary from CSV row
        
    Returns:
        Dictionary formatted for DynamoDB
    """
    return {
        'symbol': row['Ticker'].strip(),
        'close_price': Decimal(str(float(row['Close']))),
        'highest_price': Decimal(str(float(row['High']))),
        'lowest_price': Decimal(str(float(row['Low']))),
        'open_price': Decimal(str(float(row['Open']))),
        'volume': Decimal(str(int(float(row['Volume']))))
    }


def map_symbol_row(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Map market symbol CSV row to DynamoDB item format.
    
    CSV columns: Symbol, Name, LastSale, MarketCap, IPOyear, Sector, industry, Summary Quote
    DynamoDB fields: symbol, name, lastSale, marketCap, ipoYear, sector, industry, summaryQuote
    
    Args:
        row: Dictionary from CSV row
        
    Returns:
        Dictionary formatted for DynamoDB
    """
    return {
        'symbol': row['Symbol'].strip().upper(),
        'name': row['Name'].strip(),
        'lastSale': row['LastSale'].strip(),
        'marketCap': row['MarketCap'].strip(),
        'ipoYear': row['IPOyear'].strip(),
        'sector': row['Sector'].strip(),
        'industry': row['industry'].strip(),
        'summaryQuote': row['Summary Quote'].strip(),
    }


def import_to_dynamodb(data: List[Dict[str, Any]], 
                      import_type: str, 
                      mapping_function,
                      table_name: str, 
                      region: str = 'us-east-2') -> None:
    """
    Import data to DynamoDB table.
    
    Args:
        data: List of dictionaries to import
        import_type: Type of import ('price' or 'symbol') for logging
        mapping_function: Function to map CSV row to DynamoDB item
        table_name: Name of the DynamoDB table
        region: AWS region (default: us-east-2)
    """
    try:
        # Initialize DynamoDB resource
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        # Verify table exists by getting its description
        try:
            table.table_status
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"✗ Error: DynamoDB table '{table_name}' not found in region '{region}'")
                sys.exit(1)
            raise
        
        print(f"✓ Connected to DynamoDB table: {table_name}")
        print(f"✓ Import type: {import_type.upper()}\n")
        
        # Import records
        successful = 0
        failed = 0
        errors = []
        
        for idx, row in enumerate(data, 1):
            try:
                item = mapping_function(row)
                table.put_item(Item=item)
                successful += 1
                
                # Print progress every 500 records for symbols, 100 for prices
                progress_interval = 500 if import_type == 'symbol' else 100
                if idx % progress_interval == 0:
                    print(f"  Imported {idx}/{len(data)} records...")
                    
            except Exception as e:
                failed += 1
                identifier = row.get('Symbol') or row.get('Ticker', 'Unknown')
                errors.append((idx, identifier, str(e)))
                if failed <= 5:  # Only print first 5 errors during import
                    print(f"  ✗ Failed to import row {idx} ({identifier}): {e}")
        
        # Print summary
        print("\n" + "="*60)
        print(f"Import Summary:")
        print(f"  Import Type: {import_type.upper()}")
        print(f"  DynamoDB Table: {table_name}")
        print(f"  Total records: {len(data)}")
        print(f"  Successfully imported: {successful}")
        print(f"  Failed: {failed}")
        print("="*60)
        
        if failed > 0:
            print("\nFailed imports (showing first 10):")
            for idx, identifier, error in errors[:10]:
                print(f"  Row {idx} ({identifier}): {error}")
            if len(errors) > 10:
                print(f"  ... and {len(errors) - 10} more errors")
            sys.exit(1)
        else:
            print("✓ All records imported successfully!")
            
    except NoCredentialsError:
        print("✗ Error: AWS credentials not found. Please configure your AWS credentials.")
        print("  See: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error connecting to DynamoDB: {e}")
        sys.exit(1)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python import_to_dynamodb.py <csv_file>")
        print("\nSupported CSV formats:")
        print("  - market_price: Close, High, Low, Open, Volume, Ticker")
        print("  - market_symbol: Symbol, Name, LastSale, MarketCap, IPOyear, Sector, industry, Summary Quote")
        print("\nExamples:")
        print("  python import_to_dynamodb.py 2026-01-21.csv")
        print("  python import_to_dynamodb.py nasdaq.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    region = 'us-east-2'
    
    print("Starting import process...")
    print(f"  CSV File: {csv_file}")
    print(f"  Region: {region}\n")
    
    # Read CSV
    data, column_names = read_csv_file(csv_file)
    
    if not data:
        print("✗ Error: CSV file is empty")
        sys.exit(1)
    
    # Detect import type
    import_type, table_name = detect_import_type(column_names)
    if import_type == 'price':
        mapping_fn = map_price_row
    else:  # symbol
        mapping_fn = map_symbol_row
    print(f"✓ Detected import type: {import_type.upper()}")
    print(f"✓ Target table: {table_name}\n")
    
    # Import to DynamoDB
    import_to_dynamodb(data, import_type, mapping_fn, table_name, region)


if __name__ == '__main__':
    main()
