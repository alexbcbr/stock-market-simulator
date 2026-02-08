#!/usr/bin/env python3
"""
Import market symbol data from NASDAQ CSV to DynamoDB table.
This script reads data from nasdaq.csv and imports it to a DynamoDB table called 'market_symbol'.
"""

import csv
import sys
from typing import Dict, List, Any
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


def read_csv_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Read CSV file and return list of dictionaries.
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        List of dictionaries containing the CSV data
    """
    data = []
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
        print(f"✓ Read {len(data)} rows from {file_path}")
        return data
    except FileNotFoundError:
        print(f"✗ Error: File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error reading CSV file: {e}")
        sys.exit(1)


def map_csv_to_dynamodb(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Map CSV row to DynamoDB item format.
    
    CSV columns: Symbol, Name, LastSale, MarketCap, IPOyear, Sector, industry, Summary Quote
    DynamoDB fields: symbol (partition key), name, lastSale, marketCap, ipoYear, sector, industry, summaryQuote
    
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


def import_to_dynamodb(data: List[Dict[str, Any]], table_name: str = 'market_symbol', region: str = 'us-east-2') -> None:
    """
    Import data to DynamoDB table.
    
    Args:
        data: List of dictionaries to import
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
        
        # Import records
        successful = 0
        failed = 0
        errors = []
        
        for idx, row in enumerate(data, 1):
            try:
                item = map_csv_to_dynamodb(row)
                table.put_item(Item=item)
                successful += 1
                
                # Print progress every 500 records
                if idx % 500 == 0:
                    print(f"  Imported {idx}/{len(data)} records...")
                    
            except Exception as e:
                failed += 1
                errors.append((idx, row.get('Symbol', 'Unknown'), str(e)))
                print(f"  ✗ Failed to import row {idx} ({row.get('Symbol', 'Unknown')}): {e}")
        
        # Print summary
        print("\n" + "="*60)
        print(f"Import Summary:")
        print(f"  Total records: {len(data)}")
        print(f"  Successfully imported: {successful}")
        print(f"  Failed: {failed}")
        print("="*60)
        
        if failed > 0:
            print("\nFailed imports:")
            for idx, symbol, error in errors[:10]:  # Show first 10 errors
                print(f"  Row {idx} ({symbol}): {error}")
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
        print("Usage: python import_market_symbols_to_dynamodb.py <csv_file>")
        print("\nExample:")
        print("  python import_market_symbols_to_dynamodb.py nasdaq.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    table_name = 'market_symbol'
    region = 'us-east-2'
    
    print(f"Starting import process...")
    print(f"  CSV File: {csv_file}")
    print(f"  Table: {table_name}")
    print(f"  Region: {region}\n")
    
    # Read CSV
    data = read_csv_file(csv_file)
    
    # Import to DynamoDB
    import_to_dynamodb(data, table_name, region)


if __name__ == '__main__':
    main()
