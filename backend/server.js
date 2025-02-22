const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const admin = require("firebase-admin");
const path = require("path");
const { spawn } = require('child_process');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase-adminsdk.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database");

    // Create expenses table
    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            amount REAL,
            category TEXT,
            date TEXT
        )
    `);

    // Create transactions table for SMS data
    db.run(`
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
            userId TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Function to run Python SMS parser
function parseSMS(smsText) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
            path.join(__dirname, 'sms_parser/parse_sms.py'),
            smsText
        ]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process failed: ${error}`));
            } else {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject(new Error('Failed to parse Python output'));
                }
            }
        });
    });
}

// Existing endpoints
app.post("/add-expense", (req, res) => {
    const { userId, amount, category, date } = req.body;
    db.run("INSERT INTO expenses (userId, amount, category, date) VALUES (?, ?, ?, ?)", 
        [userId, amount, category, date], function(err) {
        if (err) res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.get("/expenses/:userId", (req, res) => {
    db.all("SELECT * FROM expenses WHERE userId = ?", [req.params.userId], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// New SMS-related endpoints
app.post("/process-sms", async (req, res) => {
    const { smsText, userId } = req.body;

    try {
        // Parse SMS using Python script
        const transaction = await parseSMS(smsText);

        // Save to database
        db.run(`
            INSERT INTO transactions (
                amount, transaction_type, party_name, reference_no,
                account_last_4, transaction_date, source, raw_message,
                userId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            transaction.amount,
            transaction.transaction_type,
            transaction.party_name,
            transaction.reference_no,
            transaction.account_last_4,
            transaction.transaction_date,
            transaction.source,
            transaction.raw_message,
            userId
        ], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }

            // Also add as an expense
            db.run(
                "INSERT INTO expenses (userId, amount, category, date) VALUES (?, ?, ?, ?)",
                [userId, transaction.amount, transaction.party_name, transaction.transaction_date],
                function(err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ 
                        transactionId: this.lastID,
                        transaction: transaction
                    });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/transactions/:userId", (req, res) => {
    db.all(
        "SELECT * FROM transactions WHERE userId = ? ORDER BY transaction_date DESC",
        [req.params.userId],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));