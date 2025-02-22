const ctx = document.getElementById("expense-chart").getContext("2d");

function loadExpenseChart() {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("expenses").where("userId", "==", user.uid).get()
                .then(snapshot => {
                    const categories = {};
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        categories[data.category] = (categories[data.category] || 0) + data.amount;
                    });

                    new Chart(ctx, {
                        type: "pie",
                        data: {
                            labels: Object.keys(categories),
                            datasets: [{
                                data: Object.values(categories),
                                backgroundColor: ["#007bff", "#28a745", "#dc3545", "#ffc107"],
                            }]
                        }
                    });
                });
        }
    });
}

// Load chart on page load
window.onload = loadExpenseChart;
