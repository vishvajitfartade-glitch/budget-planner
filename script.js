// ========================================
// BUDGET PLANNER WITH CHARTS
// ========================================

// Categories
const categories = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Health",
    "Other"
];

// Load data from LocalStorage
let budgets = JSON.parse(localStorage.getItem("budgets")) || {};
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Chart variable
let budgetChart;

// DOM Elements
const budgetForm = document.getElementById("budgetForm");
const expenseForm = document.getElementById("expenseForm");

const budgetCategory = document.getElementById("budgetCategory");
const budgetAmount = document.getElementById("budgetAmount");

const expenseCategory = document.getElementById("expenseCategory");
const expenseAmount = document.getElementById("expenseAmount");
const expenseDescription = document.getElementById("expenseDescription");

const budgetList = document.getElementById("budgetList");
const expenseList = document.getElementById("expenseList");

const totalBudgetElement = document.getElementById("totalBudget");
const totalSpentElement = document.getElementById("totalSpent");
const remainingElement = document.getElementById("remaining");

const resetBtn = document.getElementById("resetBtn");

// ========================================
// Save Data
// ========================================

function saveData() {
    localStorage.setItem("budgets", JSON.stringify(budgets));
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// ========================================
// Calculate Spending By Category
// ========================================

function getCategorySpending(category) {

    return expenses
        .filter(expense => expense.category === category)
        .reduce((total, expense) => {
            return total + Number(expense.amount);
        }, 0);
}

// ========================================
// Format Currency
// ========================================

function formatCurrency(amount) {

    return "₹" + Number(amount).toLocaleString("en-IN");
}

// ========================================
// Set Budget
// ========================================

budgetForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const category = budgetCategory.value;
    const amount = Number(budgetAmount.value);

    if (!category || amount <= 0) {
        alert("Please enter a valid budget.");
        return;
    }

    budgets[category] = amount;

    saveData();

    budgetForm.reset();

    updateDashboard();
});

// ========================================
// Add Expense
// ========================================

expenseForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const category = expenseCategory.value;
    const amount = Number(expenseAmount.value);
    const description = expenseDescription.value.trim();

    if (!category || amount <= 0 || !description) {
        alert("Please enter valid expense details.");
        return;
    }

    const expense = {
        id: Date.now(),
        category: category,
        amount: amount,
        description: description,
        date: new Date().toLocaleDateString("en-IN")
    };

    expenses.push(expense);

    saveData();

    expenseForm.reset();

    updateDashboard();
});

// ========================================
// Update Dashboard
// ========================================

function updateDashboard() {

    updateSummary();

    renderBudgets();

    renderExpenses();

    updateChart();
}

// ========================================
// Update Summary
// ========================================

function updateSummary() {

    const totalBudget = Object.values(budgets)
        .reduce((total, amount) => total + Number(amount), 0);

    const totalSpent = expenses
        .reduce((total, expense) => total + Number(expense.amount), 0);

    const remaining = totalBudget - totalSpent;

    totalBudgetElement.textContent = formatCurrency(totalBudget);

    totalSpentElement.textContent = formatCurrency(totalSpent);

    remainingElement.textContent = formatCurrency(remaining);

    // Change remaining color
    if (remaining < 0) {
        remainingElement.style.color = "#dc2626";
    } else {
        remainingElement.style.color = "#16a34a";
    }
}

// ========================================
// Render Budget List
// ========================================

function renderBudgets() {

    budgetList.innerHTML = "";

    if (Object.keys(budgets).length === 0) {

        budgetList.innerHTML = `
            <div class="empty">
                No budgets added yet.
            </div>
        `;

        return;
    }

    Object.entries(budgets).forEach(([category, budget]) => {

        const spent = getCategorySpending(category);

        const percentage = budget > 0
            ? (spent / budget) * 100
            : 0;

        const displayPercentage = Math.min(percentage, 100);

        let progressClass = "normal";

        if (percentage >= 100) {
            progressClass = "danger";
        } else if (percentage >= 75) {
            progressClass = "warning";
        }

        const isOverBudget = spent > budget;

        const budgetItem = document.createElement("div");

        budgetItem.className = "budget-item";

        budgetItem.innerHTML = `

            <div class="budget-top">

                <div>
                    <div class="budget-name">
                        ${getCategoryEmoji(category)} ${category}
                    </div>

                    <div class="budget-values">
                        Budget: ${formatCurrency(budget)}
                        &nbsp; | &nbsp;
                        Spent: ${formatCurrency(spent)}
                    </div>
                </div>

                <strong>
                    ${Math.round(percentage)}%
                </strong>

            </div>

            <div class="progress">

                <div
                    class="progress-bar ${progressClass}"
                    style="width: ${displayPercentage}%"
                ></div>

            </div>

            <span class="status ${isOverBudget ? "status-over" : "status-ok"}">

                ${isOverBudget
                    ? "⚠️ Over Budget"
                    : "✓ Within Budget"
                }

            </span>
        `;

        budgetList.appendChild(budgetItem);
    });
}

// ========================================
// Category Emoji
// ========================================

function getCategoryEmoji(category) {

    const emojis = {
        Food: "🍔",
        Travel: "🚗",
        Shopping: "🛍️",
        Bills: "💡",
        Education: "📚",
        Entertainment: "🎮",
        Health: "🏥",
        Other: "📦"
    };

    return emojis[category] || "📦";
}

// ========================================
// Render Expenses
// ========================================

function renderExpenses() {

    expenseList.innerHTML = "";

    if (expenses.length === 0) {

        expenseList.innerHTML = `
            <div class="empty">
                No expenses added yet.
            </div>
        `;

        return;
    }

    // Latest expenses first
    const sortedExpenses = [...expenses].reverse();

    sortedExpenses.forEach(expense => {

        const expenseItem = document.createElement("div");

        expenseItem.className = "expense-item";

        expenseItem.innerHTML = `

            <div class="expense-info">

                <h3>
                    ${getCategoryEmoji(expense.category)}
                    ${escapeHTML(expense.description)}
                </h3>

                <p>
                    ${expense.category} • ${expense.date}
                </p>

            </div>

            <div>

                <span class="expense-amount">
                    -${formatCurrency(expense.amount)}
                </span>

                <button
                    class="delete-btn"
                    onclick="deleteExpense(${expense.id})"
                >
                    Delete
                </button>

            </div>
        `;

        expenseList.appendChild(expenseItem);
    });
}

// ========================================
// Delete Expense
// ========================================

function deleteExpense(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) {
        return;
    }

    expenses = expenses.filter(expense => expense.id !== id);

    saveData();

    updateDashboard();
}

// ========================================
// Escape HTML
// ========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ========================================
// Chart
// ========================================

function updateChart() {

    const labels = categories;

    const budgetData = categories.map(category => {
        return budgets[category] || 0;
    });

    const actualData = categories.map(category => {
        return getCategorySpending(category);
    });

    const ctx = document.getElementById("budgetChart");

    if (budgetChart) {
        budgetChart.destroy();
    }

    budgetChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Budget",
                    data: budgetData,
                    backgroundColor: "rgba(37, 99, 235, 0.75)",
                    borderColor: "#2563eb",
                    borderWidth: 1
                },

                {
                    label: "Actual Spending",
                    data: actualData,
                    backgroundColor: "rgba(239, 68, 68, 0.75)",
                    borderColor: "#ef4444",
                    borderWidth: 1
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "top"
                },

                tooltip: {

                    callbacks: {

                        label: function (context) {

                            return context.dataset.label +
                                ": " +
                                formatCurrency(context.raw);
                        }

                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        callback: function (value) {
                            return "₹" + value;
                        }

                    }

                }

            }

        }

    });
}

// ========================================
// Reset All Data
// ========================================

resetBtn.addEventListener("click", function () {

    const confirmReset = confirm(
        "This will delete all budgets and expenses. Continue?"
    );

    if (!confirmReset) {
        return;
    }

    budgets = {};
    expenses = [];

    localStorage.removeItem("budgets");
    localStorage.removeItem("expenses");

    updateDashboard();
});

// ========================================
// Initial Load
// ========================================

updateDashboard();