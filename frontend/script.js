// Expense Tracker dApp JavaScript
// Contract configuration - UPDATE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
const MODULE_ADDRESS = "0x412dde714b4208702b754ec0b7b5a247079b1245784cd379dd6752dc2626a577";
// Global variables
let walletConnected = false;
let currentAccount = null;
let expenses = [];

// Category mapping
const CATEGORIES = {
    1: { name: "🍔 Food & Dining", icon: "🍔" },
    2: { name: "🚗 Transportation", icon: "🚗" },
    3: { name: "🎬 Entertainment", icon: "🎬" },
    4: { name: "💡 Bills & Utilities", icon: "💡" },
    5: { name: "🛍️ Shopping", icon: "🛍️" },
    6: { name: "🏥 Healthcare", icon: "🏥" },
    7: { name: "📚 Education", icon: "📚" },
    8: { name: "📦 Other", icon: "📦" }
};

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet-btn');
const disconnectWalletBtn = document.getElementById('disconnect-wallet-btn');
const walletDisconnected = document.getElementById('wallet-disconnected');
const walletConnectedDiv = document.getElementById('wallet-connected');
const walletAddress = document.getElementById('wallet-address');
const mainContent = document.getElementById('main-content');
const expenseForm = document.getElementById('expense-form');
const addExpenseBtn = document.getElementById('add-expense-btn');
const refreshBtn = document.getElementById('refresh-btn');
const filterCategory = document.getElementById('filter-category');
const expensesList = document.getElementById('expenses-list');
const loading = document.getElementById('loading');
const emptyExpenses = document.getElementById('empty-expenses');
const alertsContainer = document.getElementById('alerts');

// Statistics elements
const totalSpentElement = document.getElementById('total-spent');
const totalExpensesElement = document.getElementById('total-expenses');
const thisMonthElement = document.getElementById('this-month');
const categoryBreakdown = document.getElementById('category-breakdown');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkWalletConnection();
    setDefaultDate();
});

function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
    expenseForm.addEventListener('submit', handleAddExpense);
    refreshBtn.addEventListener('click', loadExpenses);
    filterCategory.addEventListener('change', filterExpenses);
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Wallet connection functions
async function checkWalletConnection() {
    try {
        if (typeof window.aptos !== 'undefined') {
            const account = await window.aptos.account();
            if (account) {
                handleWalletConnected(account);
            }
        } else {
            setTimeout(() => {
                showAlert('Petra wallet not detected. Enabling demo mode...', 'info');
                enableDemoMode();
            }, 3000);
        }
    } catch (error) {
        console.log('No wallet connected');
        setTimeout(() => {
            enableDemoMode();
        }, 5000);
    }
}

async function connectWallet() {
    try {
        if (typeof window.aptos === 'undefined') {
            showAlert('Please install Petra wallet extension', 'error');
            window.open('https://petra.app/', '_blank');
            return;
        }

        const account = await window.aptos.connect();
        if (account) {
            handleWalletConnected(account);
            showAlert('Wallet connected successfully!', 'success');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showAlert('Failed to connect wallet. Enabling demo mode...', 'info');
        enableDemoMode();
    }
}

async function disconnectWallet() {
    try {
        if (window.aptos) {
            await window.aptos.disconnect();
        }
        handleWalletDisconnected();
        showAlert('Wallet disconnected', 'info');
    } catch (error) {
        console.error('Disconnect error:', error);
    }
}

function handleWalletConnected(account) {
    walletConnected = true;
    currentAccount = account;
    
    walletDisconnected.classList.add('hidden');
    walletConnectedDiv.classList.remove('hidden');
    mainContent.classList.remove('hidden');
    
    walletAddress.textContent = `${account.address.substring(0, 12)}...${account.address.substring(account.address.length - 8)}`;
    
    // Initialize tracker and load expenses
    initializeTracker();
    loadExpenses();
}

function handleWalletDisconnected() {
    walletConnected = false;
    currentAccount = null;
    expenses = [];
    
    walletDisconnected.classList.remove('hidden');
    walletConnectedDiv.classList.add('hidden');
    mainContent.classList.add('hidden');
}

// Demo mode for testing without wallet
function enableDemoMode() {
    const demoAccount = { address: "0xdemo123456789abcdef..." };
    currentAccount = demoAccount;
    walletConnected = true;
    
    walletDisconnected.classList.add('hidden');
    walletConnectedDiv.classList.remove('hidden');
    mainContent.classList.remove('hidden');
    
    walletAddress.textContent = "Demo Mode - Try the features!";
    
    // Load demo expenses
    expenses = getDemoExpenses();
    displayExpenses();
    updateStatistics();
    updateCategoryBreakdown();
    
    showAlert('Demo mode enabled - Try adding expenses!', 'success');
}

// Smart contract functions
async function initializeTracker() {
    try {
        const payload = {
            type: "entry_function_payload",
            function: `${MODULE_ADDRESS}::expense_tracker::initialize_tracker`,
            type_arguments: [],
            arguments: []
        };

        await window.aptos.signAndSubmitTransaction(payload);
        console.log('Expense tracker initialized');
    } catch (error) {
        console.log('Tracker might already be initialized or error:', error);
    }
}

async function handleAddExpense(event) {
    event.preventDefault();
    
    if (!currentAccount) {
        showAlert('Please connect your wallet first', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description').trim();
    const category = parseInt(formData.get('category'));
    const date = formData.get('date');

    if (!amount || !description || !category || !date) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    try {
        addExpenseBtn.disabled = true;
        addExpenseBtn.textContent = '⏳ Adding to Blockchain...';
        
        // If in demo mode, add to local storage
        if (currentAccount.address.includes('demo')) {
            addDemoExpense(amount, description, category, date);
            return;
        }
        
        // Convert amount to smallest unit (multiply by 100 for cents)
        const amountInCents = Math.round(amount * 100);
        
        // Convert date to timestamp
        const dateTimestamp = Math.floor(new Date(date).getTime() / 1000);
        
        const payload = {
            type: "entry_function_payload",
            function: `${MODULE_ADDRESS}::expense_tracker::add_expense`,
            type_arguments: [],
            arguments: [
                amountInCents.toString(),
                description,
                category.toString(),
                dateTimestamp.toString()
            ]
        };

        const response = await window.aptos.signAndSubmitTransaction(payload);
        
        // Reset form
        expenseForm.reset();
        setDefaultDate();
        
        showAlert('Expense added successfully to blockchain!', 'success');
        
        // Reload expenses after a short delay
        setTimeout(() => {
            loadExpenses();
        }, 3000);
        
    } catch (error) {
        console.error('Add expense error:', error);
        showAlert('Failed to add expense. Please try again.', 'error');
    } finally {
        addExpenseBtn.disabled = false;
        addExpenseBtn.textContent = '🚀 Add to Blockchain';
    }
}

function addDemoExpense(amount, description, category, date) {
    const newExpense = {
        id: expenses.length + 1,
        amount: Math.round(amount * 100), // Convert to cents
        description: description,
        category: category,
        date: Math.floor(new Date(date).getTime() / 1000),
        created_at: Math.floor(Date.now() / 1000)
    };

    expenses.push(newExpense);
    
    // Save to localStorage for demo persistence
    localStorage.setItem('demoExpenses', JSON.stringify(expenses));
    
    // Reset form
    expenseForm.reset();
    setDefaultDate();
    
    displayExpenses();
    updateStatistics();
    updateCategoryBreakdown();
    
    showAlert('Expense added successfully! (Demo Mode)', 'success');
}

async function loadExpenses() {
    if (!currentAccount) return;

    try {
        showLoading(true);
        
        // If in demo mode, load from localStorage
        if (currentAccount.address.includes('demo')) {
            const saved = localStorage.getItem('demoExpenses');
            expenses = saved ? JSON.parse(saved) : getDemoExpenses();
            displayExpenses();
            updateStatistics();
            updateCategoryBreakdown();
            return;
        }
        
        // Try to get expenses from blockchain
        try {
            const response = await window.aptos.view({
                function: `${MODULE_ADDRESS}::expense_tracker::get_expenses`,
                type_arguments: [],
                arguments: [currentAccount.address],
            });
            
            const expensesData = response[0] || [];
            expenses = expensesData.map(expense => ({
                id: parseInt(expense.id),
                amount: parseInt(expense.amount),
                description: expense.description,
                category: parseInt(expense.category),
                date: parseInt(expense.date),
                created_at: parseInt(expense.created_at)
            }));
            
        } catch (error) {
            console.log('Error loading from blockchain, using demo data:', error);
            expenses = getDemoExpenses();
            showAlert('Demo mode: Using sample data for presentation', 'info');
        }
        
        displayExpenses();
        updateStatistics();
        updateCategoryBreakdown();
        
    } catch (error) {
        console.error('Load expenses error:', error);
        showAlert('Failed to load expenses', 'error');
        expenses = [];
        displayExpenses();
    } finally {
        showLoading(false);
    }
}

function getDemoExpenses() {
    return [
        {
            id: 1,
            amount: 2500, // $25.00
            description: "Lunch at restaurant",
            category: 1,
            date: Math.floor(Date.now() / 1000) - 86400,
            created_at: Math.floor(Date.now() / 1000) - 86400
        },
        {
            id: 2,
            amount: 5000, // $50.00
            description: "Gas for car",
            category: 2,
            date: Math.floor(Date.now() / 1000) - 172800,
            created_at: Math.floor(Date.now() / 1000) - 172800
        },
        {
            id: 3,
            amount: 1200, // $12.00
            description: "Movie ticket",
            category: 3,
            date: Math.floor(Date.now() / 1000) - 259200,
            created_at: Math.floor(Date.now() / 1000) - 259200
        }
    ];
}

async function deleteExpense(expenseId) {
    if (!currentAccount) return;

    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        // If in demo mode, delete from local array
        if (currentAccount.address.includes('demo')) {
            expenses = expenses.filter(expense => expense.id !== expenseId);
            localStorage.setItem('demoExpenses', JSON.stringify(expenses));
            displayExpenses();
            updateStatistics();
            updateCategoryBreakdown();
            showAlert('Expense deleted! (Demo Mode)', 'success');
            return;
        }

        const payload = {
            type: "entry_function_payload",
            function: `${MODULE_ADDRESS}::expense_tracker::delete_expense`,
            type_arguments: [],
            arguments: [expenseId.toString()]
        };

        await window.aptos.signAndSubmitTransaction(payload);
        showAlert('Expense deleted successfully!', 'success');
        
        setTimeout(() => {
            loadExpenses();
        }, 2000);
        
    } catch (error) {
        console.error('Delete expense error:', error);
        showAlert('Failed to delete expense', 'error');
    }
}

// Display functions
function displayExpenses() {
    if (expenses.length === 0) {
        expensesList.innerHTML = '';
        emptyExpenses.classList.remove('hidden');
        return;
    }

    emptyExpenses.classList.add('hidden');
    
    // Apply category filter
    const selectedCategory = filterCategory.value;
    const filteredExpenses = selectedCategory 
        ? expenses.filter(expense => expense.category === parseInt(selectedCategory))
        : expenses;
    
    // Sort by date (newest first)
    const sortedExpenses = filteredExpenses.sort((a, b) => b.date - a.date);
    
    expensesList.innerHTML = sortedExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-header">
                <div class="expense-amount">-$${(expense.amount / 100).toFixed(2)}</div>
                <div class="expense-category">${CATEGORIES[expense.category]?.name || 'Other'}</div>
            </div>
            <div class="expense-description">${escapeHtml(expense.description)}</div>
            <div class="expense-meta">
                <span class="expense-date">${formatDate(expense.date)}</span>
                <span class="expense-id">ID: #${expense.id}</span>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function updateStatistics() {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = expenses.length;
    
    // Calculate this month's expenses
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthExpenses = expenses.filter(expense => 
        new Date(expense.date * 1000) >= thisMonth
    );
    const thisMonthAmount = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    totalSpentElement.textContent = `$${(totalAmount / 100).toFixed(2)}`;
    totalExpensesElement.textContent = totalCount.toString();
    thisMonthElement.textContent = `$${(thisMonthAmount / 100).toFixed(2)}`;
}

function updateCategoryBreakdown() {
    const categoryTotals = {};
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate totals by category
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });
    
    // Sort categories by amount (highest first)
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a);
    
    if (sortedCategories.length === 0) {
        categoryBreakdown.innerHTML = '<p style="text-align: center; color: #666;">No expenses to show</p>';
        return;
    }
    
    categoryBreakdown.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        return `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-name">${CATEGORIES[category]?.name || 'Other'}</div>
                    <div class="category-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="category-amount">$${(amount / 100).toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

function filterExpenses() {
    displayExpenses();
}

// Utility functions
function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('Expense Tracker dApp loaded successfully!');