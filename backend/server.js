const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const admin = require("firebase-admin");
const path = require("path");
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

    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            amount REAL,
            category TEXT,
            date TEXT
        )
    `);
});

// Add Expense
app.post("/add-expense", (req, res) => {
    const { userId, amount, category, date } = req.body;
    db.run("INSERT INTO expenses (userId, amount, category, date) VALUES (?, ?, ?, ?)", 
        [userId, amount, category, date], function(err) {
        if (err) res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Get Expenses
app.get("/expenses/:userId", (req, res) => {
    db.all("SELECT * FROM expenses WHERE userId = ?", [req.params.userId], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
