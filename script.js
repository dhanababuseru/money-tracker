// Transaction Management Class
class TransactionManager {
    constructor() {
        this.transactions = [];
        this.currentTransactionId = null;
        this.monthlyBudget = 0;
        this.selectedCategory = '';
        this.chart = null;
        this.currentChartView = 'monthly';
        this.currentSection = 'dashboard';
        this.loadTransactions();
        this.loadBudget();
        this.initializeEventListeners();
        this.initializeNavigation();
        this.updateUI();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Save transaction button click
        document.getElementById('saveTransaction').addEventListener('click', () => this.saveTransaction());

        // Transaction type change handlers
        document.getElementById('transactionType').addEventListener('change', (e) => this.updateCategoryOptions(e.target.value));
        document.getElementById('editTransactionType').addEventListener('change', (e) => this.updateCategoryOptions(e.target.value, true));

        // Update transaction button click
        document.getElementById('updateTransaction').addEventListener('click', () => this.updateTransaction());

        // Confirm delete button click
        document.getElementById('confirmDelete').addEventListener('click', () => this.deleteTransaction());

        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();

        // New event listeners for category filter and budget
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.updateUI();
        });

        document.getElementById('saveBudget').addEventListener('click', () => this.saveBudget());

        // Pre-fill budget amount when modal opens
        document.getElementById('setBudgetModal').addEventListener('show.bs.modal', () => {
            document.getElementById('monthlyBudgetAmount').value = this.monthlyBudget;
        });

        // Chart view toggle buttons
        document.getElementById('monthlyView').addEventListener('click', () => {
            this.currentChartView = 'monthly';
            document.getElementById('monthlyView').classList.add('active');
            document.getElementById('categoryView').classList.remove('active');
            this.updateChart();
        });

        document.getElementById('categoryView').addEventListener('click', () => {
            this.currentChartView = 'category';
            document.getElementById('categoryView').classList.add('active');
            document.getElementById('monthlyView').classList.remove('active');
            this.updateChart();
        });

        // Export transactions button click
        document.getElementById('exportTransactions').addEventListener('click', () => this.exportToCSV());
    }

    // Load transactions from localStorage
    loadTransactions() {
        const savedTransactions = localStorage.getItem('transactions');
        this.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
    }

    // Load budget from localStorage
    loadBudget() {
        const savedBudget = localStorage.getItem('monthlyBudget');
        this.monthlyBudget = savedBudget ? parseFloat(savedBudget) : 0;
    }

    // Save transactions to localStorage
    saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    // Create a new transaction
    saveTransaction() {
        const form = document.getElementById('transactionForm');
        
        // Get form values
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        // Validate form
        if (!this.validateForm(type, amount, category, description, date)) {
            return;
        }

        // Create transaction object
        const transaction = {
            id: Date.now(), // Use timestamp as unique ID
            type,
            amount,
            category,
            description,
            date,
            timestamp: new Date().toISOString()
        };

        // Add to transactions array
        this.transactions.push(transaction);
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Update UI
        this.updateUI();
        
        // Reset form and close modal
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
        bootstrap.Modal.getInstance(document.getElementById('addTransactionModal')).hide();
    }

    // Edit transaction
    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.currentTransactionId = id;

        // Populate edit form
        document.getElementById('editTransactionId').value = id;
        document.getElementById('editTransactionType').value = transaction.type;
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editCategory').value = transaction.category;
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editDate').value = transaction.date;

        // Update category options
        this.updateCategoryOptions(transaction.type, true);

        // Show edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
        editModal.show();
    }

    // Update transaction
    updateTransaction() {
        const id = parseInt(document.getElementById('editTransactionId').value);
        const type = document.getElementById('editTransactionType').value;
        const amount = parseFloat(document.getElementById('editAmount').value);
        const category = document.getElementById('editCategory').value;
        const description = document.getElementById('editDescription').value;
        const date = document.getElementById('editDate').value;

        // Validate form
        if (!this.validateForm(type, amount, category, description, date)) {
            return;
        }

        // Find and update transaction
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions[index] = {
                ...this.transactions[index],
                type,
                amount,
                category,
                description,
                date,
                timestamp: new Date().toISOString()
            };

            // Save to localStorage
            this.saveToLocalStorage();
            
            // Update UI
            this.updateUI();
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('editTransactionModal')).hide();
        }
    }

    // Show delete confirmation
    showDeleteConfirmation(id) {
        this.currentTransactionId = id;
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        deleteModal.show();
    }

    // Delete transaction
    deleteTransaction() {
        if (!this.currentTransactionId) return;

        // Remove transaction
        this.transactions = this.transactions.filter(t => t.id !== this.currentTransactionId);
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Update UI
        this.updateUI();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        this.currentTransactionId = null;
    }

    // Validate form inputs
    validateForm(type, amount, category, description, date) {
        if (!type || !amount || !category || !description || !date) {
            alert('Please fill in all fields');
            return false;
        }
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return false;
        }
        return true;
    }

    // Update category options based on transaction type
    updateCategoryOptions(transactionType, isEdit = false) {
        const prefix = isEdit ? 'edit' : '';
        const categorySelect = document.getElementById(`${prefix}Category`);
        const expenseOptions = categorySelect.querySelector('optgroup[label="Expenses"]');
        const incomeOptions = categorySelect.querySelector('optgroup[label="Income"]');

        if (transactionType === 'expense') {
            expenseOptions.style.display = '';
            incomeOptions.style.display = 'none';
        } else {
            expenseOptions.style.display = 'none';
            incomeOptions.style.display = '';
        }

        categorySelect.value = ''; // Reset selection
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Save budget
    saveBudget() {
        const budgetAmount = parseFloat(document.getElementById('monthlyBudgetAmount').value);
        
        if (isNaN(budgetAmount) || budgetAmount < 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        this.monthlyBudget = budgetAmount;
        localStorage.setItem('monthlyBudget', budgetAmount.toString());
        
        // Update UI
        this.updateUI();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('setBudgetModal')).hide();
    }

    // Get current month's expenses
    getCurrentMonthExpenses() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' &&
                       transactionDate.getMonth() === currentMonth &&
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Update budget progress
    updateBudgetProgress() {
        const monthlySpent = this.getCurrentMonthExpenses();
        const remaining = Math.max(this.monthlyBudget - monthlySpent, 0);
        const progress = this.monthlyBudget > 0 ? (monthlySpent / this.monthlyBudget) * 100 : 0;

        // Update budget display
        document.getElementById('monthlyBudget').textContent = this.formatCurrency(this.monthlyBudget);
        document.getElementById('monthlySpent').textContent = this.formatCurrency(monthlySpent);
        document.getElementById('monthlyRemaining').textContent = this.formatCurrency(remaining);

        // Update progress bar
        const progressBar = document.getElementById('budgetProgress');
        progressBar.style.width = `${Math.min(progress, 100)}%`;
        progressBar.textContent = `${Math.round(Math.min(progress, 100))}%`;

        // Update progress bar color based on spending
        if (progress >= 100) {
            progressBar.classList.remove('bg-success', 'bg-warning');
            progressBar.classList.add('bg-danger');
        } else if (progress >= 80) {
            progressBar.classList.remove('bg-success', 'bg-danger');
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.remove('bg-warning', 'bg-danger');
            progressBar.classList.add('bg-success');
        }
    }

    // Filter transactions by category
    getFilteredTransactions() {
        if (!this.selectedCategory) {
            return this.transactions;
        }

        return this.transactions.filter(t => t.category === this.selectedCategory);
    }

    // Update UI
    updateUI() {
        this.updateTransactionsList();
        this.updateSummary();
        this.updateBudgetProgress();
        
        // Initialize chart if we're on the analytics section
        if (this.currentSection === 'analytics') {
            if (!this.chart) {
                this.updateChart();
            } else {
                this.updateChart();
            }
            this.updateInsights();
        }
    }

    // Update transactions list
    updateTransactionsList() {
        const transactionsTable = document.getElementById('transactionsTable');
        const noTransactions = document.getElementById('noTransactions');
        
        // Get filtered and sorted transactions
        const filteredTransactions = this.getFilteredTransactions();
        const sortedTransactions = [...filteredTransactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        if (sortedTransactions.length === 0) {
            transactionsTable.innerHTML = '';
            noTransactions.style.display = 'block';
            noTransactions.innerHTML = `
                <i class="bi bi-receipt h1"></i>
                <p>${this.selectedCategory ? 'No transactions found in this category.' : 'No transactions yet. Add your first transaction to get started!'}</p>
            `;
            return;
        }

        noTransactions.style.display = 'none';
        transactionsTable.innerHTML = sortedTransactions.map(transaction => `
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="text-${transaction.type === 'income' ? 'success' : 'danger'}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="transactionManager.editTransaction(${transaction.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="transactionManager.showDeleteConfirmation(${transaction.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Update summary (total income and expenses)
    updateSummary() {
        const filteredTransactions = this.getFilteredTransactions();
        
        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);
    }

    // Get monthly spending data
    getMonthlyData() {
        const months = [];
        const expenses = [];
        const income = [];

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const monthYear = `${month} ${year}`;

            const monthlyExpenses = this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return t.type === 'expense' &&
                           transactionDate.getMonth() === date.getMonth() &&
                           transactionDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyIncome = this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return t.type === 'income' &&
                           transactionDate.getMonth() === date.getMonth() &&
                           transactionDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, t) => sum + t.amount, 0);

            months.push(monthYear);
            expenses.push(monthlyExpenses);
            income.push(monthlyIncome);
        }

        return { months, expenses, income };
    }

    // Get category spending data
    getCategoryData() {
        const categoryTotals = {};
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Get current month's expenses by category
        this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' &&
                       transactionDate.getMonth() === currentMonth &&
                       transactionDate.getFullYear() === currentYear;
            })
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        return {
            categories: Object.keys(categoryTotals),
            amounts: Object.values(categoryTotals)
        };
    }

    // Update chart
    updateChart() {
        const ctx = document.getElementById('spendingChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        if (this.currentChartView === 'monthly') {
            const { months, expenses, income } = this.getMonthlyData();
            
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Income',
                            data: income,
                            backgroundColor: 'rgba(46, 204, 113, 0.5)',
                            borderColor: 'rgba(46, 204, 113, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Expenses',
                            data: expenses,
                            backgroundColor: 'rgba(231, 76, 60, 0.5)',
                            borderColor: 'rgba(231, 76, 60, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => this.formatCurrency(value)
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Income vs Expenses'
                        },
                        tooltip: {
                            callbacks: {
                                label: context => {
                                    const label = context.dataset.label;
                                    const value = this.formatCurrency(context.parsed.y);
                                    return `${label}: ${value}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            const { categories, amounts } = this.getCategoryData();
            
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: amounts,
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.8)',
                            'rgba(155, 89, 182, 0.8)',
                            'rgba(52, 73, 94, 0.8)',
                            'rgba(230, 126, 34, 0.8)',
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(231, 76, 60, 0.8)',
                            'rgba(241, 196, 15, 0.8)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Current Month Expenses by Category'
                        },
                        tooltip: {
                            callbacks: {
                                label: context => {
                                    const label = context.label;
                                    const value = this.formatCurrency(context.parsed);
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((context.parsed / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Export transactions to CSV
    exportToCSV() {
        // Get filtered transactions
        const transactions = this.getFilteredTransactions();
        
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        // Sort transactions by date
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        // Define CSV headers
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];

        // Convert transactions to CSV format
        const csvContent = [
            headers.join(','), // Add headers
            ...sortedTransactions.map(t => [
                t.date,
                t.type,
                t.category,
                `"${t.description.replace(/"/g, '""')}"`, // Escape quotes in description
                t.amount.toFixed(2)
            ].join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Create file name with current date
        const fileName = `money_tracker_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        // Check if browser supports download attribute
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, fileName);
            return;
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        // Add link to document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showExportSuccess();
    }

    // Show export success message
    showExportSuccess() {
        // Create toast element
        const toastContainer = document.createElement('div');
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1050';
        
        toastContainer.innerHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Transactions exported successfully!
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        // Initialize Bootstrap toast
        const toastElement = toastContainer.querySelector('.toast');
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 3000
        });
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
        
        toast.show();
    }

    // Initialize navigation
    initializeNavigation() {
        // Get all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Add click event listeners
        navLinks.forEach(link => {
            if (!link.hasAttribute('data-bs-toggle')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = link.getAttribute('href').replace('#', '') || 'dashboard';
                    this.navigateToSection(section);
                });
            }
        });

        // Set initial section
        this.navigateToSection(this.currentSection);
    }

    // Navigate to section
    navigateToSection(section) {
        // Update current section
        this.currentSection = section;

        // Hide all sections
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('analytics-section').style.display = 'none';

        // Show selected section
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }

        // Update active state in navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (!link.hasAttribute('data-bs-toggle')) {
                const linkSection = link.getAttribute('href').replace('#', '') || 'dashboard';
                if (linkSection === section) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });

        // Update UI elements specific to the section
        if (section === 'analytics') {
            this.updateAnalytics();
        }
    }

    // Update analytics
    updateAnalytics() {
        // Update chart if it exists
        if (this.chart) {
            this.updateChart();
        }

        // Update insights
        this.updateInsights();
    }

    // Update insights
    updateInsights() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Get current month's transactions
        const currentMonthTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
        });

        // Calculate top income source
        const incomeBySource = {};
        currentMonthTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                incomeBySource[t.category] = (incomeBySource[t.category] || 0) + t.amount;
            });

        const topIncome = Object.entries(incomeBySource)
            .sort(([,a], [,b]) => b - a)[0];

        // Calculate top expense category
        const expensesByCategory = {};
        currentMonthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const topExpense = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)[0];

        // Update the UI
        const topIncomeElement = document.getElementById('topIncomeSource');
        const topExpenseElement = document.getElementById('topExpenseCategory');

        if (topIncome) {
            const [category, amount] = topIncome;
            const formattedCategory = category.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            topIncomeElement.textContent = `${formattedCategory}: ${this.formatCurrency(amount)}`;
        } else {
            topIncomeElement.textContent = 'No income recorded this month';
        }

        if (topExpense) {
            const [category, amount] = topExpense;
            const formattedCategory = category.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            topExpenseElement.textContent = `${formattedCategory}: ${this.formatCurrency(amount)}`;
        } else {
            topExpenseElement.textContent = 'No expenses recorded this month';
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize TransactionManager
    window.transactionManager = new TransactionManager();

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Utility functions will be added in subsequent steps
const MoneyTracker = {
    // Will contain all the application logic
    version: '1.0.0',
    
    // Initialize the application
    init: function() {
        // Will be implemented in future steps
    }
}; 