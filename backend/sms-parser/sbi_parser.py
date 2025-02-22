
import re
from datetime import datetime
from typing import Dict, Optional, List
import json
import sqlite3
from pathlib import Path

class SBIUPIParser:
    """Parser for SBI UPI transaction SMS notifications with database integration"""
    
    def __init__(self, db_path: str = '../database.sqlite'):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize SQLite database with required table"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    amount REAL NOT NULL,
                    transaction_type TEXT NOT NULL,
                    party_name TEXT NOT NULL,
                    reference_no TEXT,
                    account_last_4 TEXT,
                    transaction_date TIMESTAMP,
                    source TEXT,
                    raw_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
    
    def parse_sms(self, message: str) -> Optional[Dict]:
        """
        Parse SBI UPI SMS notification
        Format: "Dear UPI user A/C X8618 debited by 310.0 on date 21Feb25 trf to ALEX MAN SHRESTH Refno 505229211212"
        """
        try:
            # Extract account number
            acc_match = re.search(r'A/C X(\d+)', message)
            account = acc_match.group(1) if acc_match else None
            
            # Extract amount
            amount_match = re.search(r'debited by (\d+(?:\.\d{1,2})?)', message)
            if not amount_match:
                return None
            amount = float(amount_match.group(1))
            
            # Extract date
            date_match = re.search(r'on date (\d{2}[A-Za-z]{3}\d{2})', message)
            transaction_date = None
            if date_match:
                date_str = date_match.group(1)
                transaction_date = datetime.strptime(date_str, '%d%b%y')
            
            # Extract recipient name
            recipient_match = re.search(r'trf to ([^R]*)', message)
            recipient = recipient_match.group(1).strip() if recipient_match else "Unknown"
            
            # Extract reference number
            ref_match = re.search(r'Refno (\d+)', message)
            ref_no = ref_match.group(1) if ref_match else None
            
            transaction = {
                'amount': amount,
                'transaction_type': 'debit',
                'party_name': recipient,
                'reference_no': ref_no,
                'account_last_4': account,
                'transaction_date': transaction_date,
                'source': 'SBI UPI',
                'raw_message': message
            }
            
            return transaction
            
        except Exception as e:
            print(f"Error parsing SMS: {e}")
            return None
    
    def save_transaction(self, transaction: Dict) -> bool:
        """Save transaction to SQLite database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO transactions (
                        amount, transaction_type, party_name, reference_no,
                        account_last_4, transaction_date, source, raw_message
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    transaction['amount'],
                    transaction['transaction_type'],
                    transaction['party_name'],
                    transaction['reference_no'],
                    transaction['account_last_4'],
                    transaction['transaction_date'],
                    transaction['source'],
                    transaction['raw_message']
                ))
                return True
        except Exception as e:
            print(f"Error saving transaction: {e}")
            return False
    
    def get_transactions(self, limit: int = 10) -> List[Dict]:
        """Retrieve recent transactions from database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM transactions 
                    ORDER BY transaction_date DESC 
                    LIMIT ?
                ''', (limit,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error retrieving transactions: {e}")
            return []
    
    def format_transaction(self, transaction: Dict) -> str:
        """Format transaction details into a readable string"""
        if not transaction:
            return "Invalid transaction"
            
        return (
            f"Transaction Details:\n"
            f"Type: Paid\n"
            f"Amount: ₹{transaction['amount']:.2f}\n"
            f"Paid to: {transaction['party_name']}\n"
            f"Date: {transaction['transaction_date'].strftime('%d %B %Y')}\n"
            f"Ref No: {transaction['reference_no']}\n"
            f"Account: XXXX{transaction['account_last_4']}"
        )

