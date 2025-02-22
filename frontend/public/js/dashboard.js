import { db } from '../firebase.js';
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();
document.getElementById('logout').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    });
});

// Add Expense Functionality
document.getElementById('add-expense').addEventListener('click', async () => {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    await db.collection('expenses').add({
        amount: parseFloat(amount),
        category,
        date: new Date(date)
    });

    loadExpenses();
});

// Load Expenses Functionality
async function loadExpenses() {
    const expensesList = document.getElementById('expenses');
    expensesList.innerHTML = '';
    
    const snapshot = await db.collection('expenses').get();
    snapshot.forEach(doc => {
        const expense = doc.data();
        expensesList.innerHTML += `<li>${expense.category}: $${expense.amount} on ${expense.date.toDateString()}</li>`;
    });
}

loadExpenses();
