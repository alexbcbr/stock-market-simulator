# DynamoDB Market Price Importer

This Python application reads market price data from a CSV file and imports it into an AWS DynamoDB table.

## Prerequisites

- Python 3.8 or higher
- AWS credentials configured (via AWS CLI, environment variables, or IAM role)
- An existing DynamoDB table named `market_price` with the following schema:
  - **Primary Key**: `symbol` (String)
  - **Attributes**: `close_price`, `highest_price`, `lowest_price`, `open_price`, `volume` (Number)

## Installation

1. Install required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the import script with the CSV file path:

```bash
# Using default table name and region
python import_to_dynamodb.py 2026-01-21.csv

# With custom table name
python import_to_dynamodb.py 2026-01-21.csv my_market_price_table

# With custom table name and region
python import_to_dynamodb.py 2026-01-21.csv my_market_price_table us-west-2
```

## CSV Format

The CSV file should have the following columns:
- `Close` → imported as `close_price`
- `High` → imported as `highest_price`
- `Low` → imported as `lowest_price`
- `Open` → imported as `open_price`
- `Volume` → imported as `volume`
- `Ticker` → imported as `symbol`

Example:
```
Close,High,Low,Open,Volume,Ticker
1.0700000524520874,1.07,1.01,1.02,11100.0,AACG
95.63999938964844,96.31,91.5,93.28,721400.0,AAON
```

## AWS Credentials

Make sure your AWS credentials are properly configured. You can do this in several ways:

### Option 1: AWS CLI Configuration (Recommended)
```bash
aws configure
```

### Option 2: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### Option 3: IAM Role (for EC2 instances)
Attach an IAM role with DynamoDB permissions to your EC2 instance.

## Output

The script will display progress and a summary:
- Total records processed
- Successfully imported count
- Failed imports (if any)
- Detailed error messages for troubleshooting

## Error Handling

The script includes robust error handling for:
- Missing CSV files
- AWS credentials not found
- DynamoDB table not found
- Invalid data format
- Network/permission errors

## Example Run

```bash
$ python import_to_dynamodb.py 2026-01-21.csv

Starting import process...
  CSV File: 2026-01-21.csv
  Table: market_price
  Region: us-east-1

✓ Read 926 rows from 2026-01-21.csv
✓ Connected to DynamoDB table: market_price
  Imported 100/926 records...
  Imported 200/926 records...
  ...
  Imported 900/926 records...

============================================================
Import Summary:
  Total records: 926
  Successfully imported: 926
  Failed: 0
============================================================
✓ All records imported successfully!
```

## Troubleshooting

### "DynamoDB table 'market_price' not found"
- Verify the table exists in your AWS DynamoDB console
- Check that you're using the correct region
- Ensure you have permission to access the table

### "AWS credentials not found"
- Run `aws configure` to set up credentials
- Or set environment variables (see AWS Credentials section above)

### "Permission denied" errors
- Ensure your AWS user/role has `dynamodb:PutItem` permission
- Check the IAM policy attached to your credentials

## DynamoDB Table Schema

If you need to create the DynamoDB table, use this AWS CLI command:

```bash
aws dynamodb create-table \
  --table-name market_price \
  --attribute-definitions AttributeName=symbol,AttributeType=S \
  --key-schema AttributeName=symbol,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Or this Terraform configuration:

```hcl
resource "aws_dynamodb_table" "market_price" {
  name           = "market_price"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "symbol"

  attribute {
    name = "symbol"
    type = "S"
  }
}
```
