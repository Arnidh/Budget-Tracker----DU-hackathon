# sms_parser/parse_sms.py
import sys
import json
from sbi_parser import SBIUPIParser

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No SMS text provided"}))
        sys.exit(1)

    sms_text = sys.argv[1]
    parser = SBIUPIParser()
    
    try:
        transaction = parser.parse_sms(sms_text)
        if transaction:
            # Convert datetime to string for JSON serialization
            if transaction['transaction_date']:
                transaction['transaction_date'] = transaction['transaction_date'].isoformat()
            print(json.dumps(transaction))
        else:
            print(json.dumps({"error": "Failed to parse SMS"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()