// Add Expense to Firestore
function addExpense() {
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;

    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("expenses").add({
                userId: user.uid,
                amount,
                category,
                date: new Date().toISOString()
            }).then(() => {
                alert("Expense added!");
                loadExpenses();
            }).catch(error => alert("Error: " + error.message));
        }
    });
}

// Load Expenses
function loadExpenses() {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("expenses").where("userId", "==", user.uid).get()
                .then(snapshot => {
                    const expenseList = document.getElementById("expense-list");
                    expenseList.innerHTML = "";
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const li = document.createElement("li");
                        li.textContent = `${data.category}: $${data.amount}`;
                        expenseList.appendChild(li);
                    });
                })
                .catch(error => alert("Error loading expenses: " + error.message));
        }
    });
}

// Load expenses when the page loads
window.onload = loadExpenses;
