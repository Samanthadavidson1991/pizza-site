// Stock Management System - Admin Only
class StockManager {
    constructor() {
        this.menuItems = [];
        this.stockData = {};
        this.timeSlotSettings = {
            duration: 30,
            pizzasPerSlot: 8,
            startTime: '17:00',
            endTime: '22:00'
        };
        this.settings = {
            lowStockThreshold: 3,
            autoDisableLowStock: true,
            autoResetDaily: true,
            defaultStockAmount: 20,
            trackHistory: true
        };
        this.doughStock = {
            available: 50, // Total dough portions available
            used: 0,       // Dough portions used today
            lowThreshold: 10 // Alert when dough is running low
        };
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        if (!this.isAuthenticated) {
            this.showLoginForm();
            return;
        }
        
        await this.loadMenuItems();
        await this.loadStockData();
        await this.loadSettings();
        await this.loadDoughStock();
        this.setupEventListeners();
        this.renderStockItems();
        this.renderTimeSlots();
        this.updateStatusCards();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/admin/status');
            const status = await response.json();
            this.isAuthenticated = status.isAdmin;
            return this.isAuthenticated;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.isAuthenticated = false;
            return false;
        }
    }

    showLoginForm() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-box">
                    <h2>🔐 Admin Access Required</h2>
                    <p>Please log in to access stock management system</p>
                    <form id="admin-login-form">
                        <input type="text" id="admin-username" placeholder="Username" required>
                        <input type="password" id="admin-password" placeholder="Password" required>
                        <button type="submit">Login to Admin Panel</button>
                    </form>
                    <div id="login-error" class="error-message"></div>
                    <div class="login-help">
                        <small>Default: admin / admin123</small>
                    </div>
                </div>
            </div>
            <style>
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .login-box {
                    background: white;
                    padding: 2.5rem;
                    border-radius: 15px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }
                .login-box h2 {
                    margin-bottom: 0.5rem;
                    color: #333;
                    font-size: 1.5rem;
                }
                .login-box p {
                    color: #666;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                }
                .login-box input {
                    width: 100%;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }
                .login-box input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .login-box button {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .login-box button:hover {
                    transform: translateY(-2px);
                }
                .error-message {
                    color: #e53e3e;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }
                .login-help {
                    margin-top: 1.5rem;
                    color: #888;
                }
            </style>
        `;

        document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                window.location.reload(); // Reload to show admin interface
            } else {
                const error = await response.json();
                errorDiv.textContent = error.error || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Login failed. Please try again.';
        }
    }

    async loadMenuItems() {
        try {
            const response = await fetch('/menu');
            this.menuItems = await response.json();
            console.log('Menu items loaded:', this.menuItems.length);
        } catch (error) {
            console.error('Error loading menu:', error);
            this.showNotification('Error loading menu items', 'error');
        }
    }

    async loadStockData() {
        try {
            // Try to load existing stock data
            const response = await fetch('/stock-data.json');
            if (response.ok) {
                this.stockData = await response.json();
            } else {
                // Initialize stock data if it doesn't exist
                this.initializeStockData();
            }
        } catch (error) {
            console.log('Initializing new stock data');
            this.initializeStockData();
        }
    }

    initializeStockData() {
        this.stockData = {};
        this.menuItems.forEach(item => {
            if (item.sizes) {
                // For items with sizes (like pizzas)
                item.sizes.forEach(size => {
                    const key = `${item.name}-${size.size}`;
                    this.stockData[key] = {
                        name: item.name,
                        size: size.size,
                        category: item.category,
                        stock: this.settings.defaultStockAmount,
                        sold: 0,
                        enabled: true
                    };
                });
            } else if (item.types) {
                // For items with types (like drinks, sides)
                item.types.forEach(type => {
                    const key = `${item.name}-${type.name}`;
                    this.stockData[key] = {
                        name: item.name,
                        size: type.name,
                        category: item.category,
                        stock: this.settings.defaultStockAmount,
                        sold: 0,
                        enabled: true
                    };
                });
            } else {
                // For items without sizes or types (single items)
                this.stockData[item.name] = {
                    name: item.name,
                    category: item.category,
                    stock: this.settings.defaultStockAmount,
                    sold: 0,
                    enabled: true
                };
            }
        });
    }

    async loadSettings() {
        try {
            const response = await fetch('/timeslot-settings.json');
            if (response.ok) {
                const savedSettings = await response.json();
                this.settings = { ...this.settings, ...savedSettings };
                this.timeSlotSettings = { ...this.timeSlotSettings, ...savedSettings.timeSlots };
            }
        } catch (error) {
            console.log('Using default settings');
        }
        this.applySettingsToUI();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Save settings
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveAllSettings());

        // Reset stock
        document.getElementById('reset-stock-btn').addEventListener('click', () => this.resetDailyStock());

        // Bulk actions
        document.getElementById('set-all-stock-btn').addEventListener('click', () => this.setBulkStock());

        // Category filter
        document.getElementById('category-filter').addEventListener('change', (e) => this.filterByCategory(e.target.value));

        // Time slot settings
        document.getElementById('slot-duration').addEventListener('change', (e) => {
            this.timeSlotSettings.duration = parseInt(e.target.value);
            this.renderTimeSlots();
        });

        document.getElementById('pizzas-per-slot').addEventListener('change', (e) => {
            this.timeSlotSettings.pizzasPerSlot = parseInt(e.target.value);
            this.renderTimeSlots();
        });

        document.getElementById('start-time').addEventListener('change', (e) => {
            this.timeSlotSettings.startTime = e.target.value;
            this.renderTimeSlots();
        });

        document.getElementById('end-time').addEventListener('change', (e) => {
            this.timeSlotSettings.endTime = e.target.value;
            this.renderTimeSlots();
        });

        // Settings
        document.getElementById('low-stock-threshold').addEventListener('change', (e) => {
            this.settings.lowStockThreshold = parseInt(e.target.value);
        });

        document.getElementById('auto-disable-low-stock').addEventListener('change', (e) => {
            this.settings.autoDisableLowStock = e.target.checked;
        });

        document.getElementById('auto-reset-daily').addEventListener('change', (e) => {
            this.settings.autoResetDaily = e.target.checked;
        });

        document.getElementById('default-stock-amount').addEventListener('change', (e) => {
            this.settings.defaultStockAmount = parseInt(e.target.value);
        });

        document.getElementById('track-stock-history').addEventListener('change', (e) => {
            this.settings.trackHistory = e.target.checked;
        });

        // Dough management
        document.getElementById('dough-available').addEventListener('change', (e) => {
            this.doughStock.available = parseInt(e.target.value);
            this.updateStatusCards();
            this.saveDoughStock();
        });

        document.getElementById('dough-low-threshold').addEventListener('change', (e) => {
            this.doughStock.lowThreshold = parseInt(e.target.value);
            this.saveDoughStock();
        });

        document.getElementById('reset-dough-stock').addEventListener('click', () => this.resetDoughStock());
        document.getElementById('add-dough-portions').addEventListener('click', () => this.addDoughPortions());

        // Quick actions
        document.getElementById('emergency-disable-all').addEventListener('click', () => this.emergencyDisableAll());
        document.getElementById('restock-all').addEventListener('click', () => this.restockAll());
        document.getElementById('view-current-orders').addEventListener('click', () => this.viewCurrentOrders());
        document.getElementById('export-stock-report').addEventListener('click', () => this.exportStockReport());
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    renderStockItems() {
        const container = document.getElementById('stock-items-container');
        const filter = document.getElementById('category-filter').value;
        
        let html = '';
        Object.keys(this.stockData).forEach(key => {
            const item = this.stockData[key];
            
            // Apply category filter
            if (filter !== 'all' && item.category !== filter) return;
            
            const stockStatus = this.getStockStatus(item.stock);
            const statusClass = stockStatus.toLowerCase().replace(' ', '-');
            
            html += `
                <div class="stock-item ${statusClass}">
                    <div class="item-info">
                        <h3>${item.name}${item.size ? ` - ${item.size}` : ''}</h3>
                        <p>Category: ${item.category} | Sold today: ${item.sold}</p>
                    </div>
                    <div class="item-category">${item.category}</div>
                    <div class="stock-control">
                        <input type="number" class="stock-input" 
                               value="${item.stock}" 
                               min="0" max="100" 
                               data-item="${key}">
                    </div>
                    <div class="stock-status ${statusClass}">${stockStatus}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners to stock inputs
        container.querySelectorAll('.stock-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemKey = e.target.dataset.item;
                const newStock = parseInt(e.target.value);
                this.updateStock(itemKey, newStock);
            });
        });
    }

    renderTimeSlots() {
        const container = document.getElementById('timeslots-container');
        const slots = this.generateTimeSlots();
        
        let html = '';
        slots.forEach(slot => {
            const currentPizzas = this.getCurrentPizzasForSlot(slot.time);
            const capacity = this.timeSlotSettings.pizzasPerSlot;
            const available = capacity - currentPizzas;
            
            let statusClass = 'available';
            let statusText = 'Available';
            
            if (currentOrders >= capacity) {
                statusClass = 'full';
                statusText = 'Full';
            } else if (available <= 2) {
                statusClass = 'nearly-full';
                statusText = 'Nearly Full';
            }
            
            html += `
                <div class="timeslot-card ${statusClass}">
                    <div class="timeslot-time">${slot.display}</div>
                    <div class="timeslot-capacity">${currentOrders} / ${capacity} orders</div>
                    <div class="timeslot-status ${statusClass}">${statusText}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    generateTimeSlots() {
        const slots = [];
        const start = this.timeToMinutes(this.timeSlotSettings.startTime);
        const end = this.timeToMinutes(this.timeSlotSettings.endTime);
        const duration = this.timeSlotSettings.duration;
        
        for (let time = start; time < end; time += duration) {
            const startTime = this.minutesToTime(time);
            const endTime = this.minutesToTime(time + duration);
            
            slots.push({
                time: `${startTime}-${endTime}`,
                display: `${startTime} - ${endTime}`,
                start: startTime,
                end: endTime
            });
        }
        
        return slots;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    getCurrentPizzasForSlot(timeSlot) {
        // This would normally fetch from your orders database and count pizzas
        // For now, return a random number for demonstration
        return Math.floor(Math.random() * this.timeSlotSettings.pizzasPerSlot);
    }

    isDoughBasedItem(itemName, category) {
        // Check if an item uses dough
        const doughCategories = ['PIZZAS'];
        const doughItems = ['garlic bread', 'dough balls', 'doughballs', 'pizza bread'];
        
        return doughCategories.includes(category?.toUpperCase()) || 
               doughItems.some(doughItem => itemName?.toLowerCase().includes(doughItem));
    }

    updateDoughStock(doughPortionsUsed) {
        this.doughStock.used += doughPortionsUsed;
        
        // Check if we've run out of dough
        if (this.doughStock.used >= this.doughStock.available) {
            this.disableAllDoughItems();
            this.showNotification('⚠️ Out of dough! All dough-based items have been disabled.', 'warning');
        } else if ((this.doughStock.available - this.doughStock.used) <= this.doughStock.lowThreshold) {
            this.showNotification(`⚠️ Low dough warning! Only ${this.doughStock.available - this.doughStock.used} portions remaining.`, 'warning');
        }
        
        this.updateStatusCards();
        this.saveDoughStock();
    }

    disableAllDoughItems() {
        Object.keys(this.stockData).forEach(key => {
            const item = this.stockData[key];
            if (this.isDoughBasedItem(item.name, item.category)) {
                item.enabled = false;
            }
        });
        this.renderStockItems();
    }

    getDoughRemaining() {
        return Math.max(0, this.doughStock.available - this.doughStock.used);
    }

    getStockStatus(stock) {
        if (stock === 0) return 'Out of Stock';
        if (stock <= this.settings.lowStockThreshold) return 'Low Stock';
        return 'In Stock';
    }

    updateStock(itemKey, newStock) {
        this.stockData[itemKey].stock = newStock;
        
        // Auto-disable if needed
        if (this.settings.autoDisableLowStock && newStock === 0) {
            this.stockData[itemKey].enabled = false;
        } else if (newStock > 0) {
            this.stockData[itemKey].enabled = true;
        }
        
        this.renderStockItems();
        this.updateStatusCards();
        this.saveStockData();
    }

    setBulkStock() {
        const amount = parseInt(document.getElementById('bulk-stock-input').value);
        if (isNaN(amount) || amount < 0) {
            this.showNotification('Please enter a valid stock amount', 'error');
            return;
        }
        
        Object.keys(this.stockData).forEach(key => {
            this.stockData[key].stock = amount;
            this.stockData[key].enabled = amount > 0;
        });
        
        this.renderStockItems();
        this.updateStatusCards();
        this.showNotification(`Set all items to ${amount} stock`, 'success');
    }

    filterByCategory(category) {
        this.renderStockItems();
    }

    updateStatusCards() {
        const totalItems = Object.keys(this.stockData).length;
        const lowStockItems = Object.values(this.stockData).filter(
            item => item.stock <= this.settings.lowStockThreshold && item.stock > 0
        ).length;
        const availableSlots = this.generateTimeSlots().length;
        const totalCapacity = availableSlots * this.timeSlotSettings.pizzasPerSlot;
        const doughRemaining = this.getDoughRemaining();

        document.getElementById('total-items-count').textContent = totalItems;
        document.getElementById('low-stock-count').textContent = lowStockItems;
        document.getElementById('available-slots-count').textContent = availableSlots;
        document.getElementById('total-capacity-count').textContent = totalCapacity;
        document.getElementById('dough-remaining-count').textContent = doughRemaining;

        // Update dough status card styling
        const doughCard = document.querySelector('.status-card.dough-stock');
        if (doughCard) {
            doughCard.classList.remove('low-stock', 'out-of-stock');
            if (doughRemaining === 0) {
                doughCard.classList.add('out-of-stock');
            } else if (doughRemaining <= this.doughStock.lowThreshold) {
                doughCard.classList.add('low-stock');
            }
        }
    }    applySettingsToUI() {
        document.getElementById('slot-duration').value = this.timeSlotSettings.duration;
        document.getElementById('pizzas-per-slot').value = this.timeSlotSettings.pizzasPerSlot;
        document.getElementById('start-time').value = this.timeSlotSettings.startTime;
        document.getElementById('end-time').value = this.timeSlotSettings.endTime;
        document.getElementById('low-stock-threshold').value = this.settings.lowStockThreshold;
        document.getElementById('auto-disable-low-stock').checked = this.settings.autoDisableLowStock;
        document.getElementById('auto-reset-daily').checked = this.settings.autoResetDaily;
        document.getElementById('default-stock-amount').value = this.settings.defaultStockAmount;
        document.getElementById('track-stock-history').checked = this.settings.trackHistory;
        
        // Apply dough settings
        document.getElementById('dough-available').value = this.doughStock.available;
        document.getElementById('dough-used').value = this.doughStock.used;
        document.getElementById('dough-low-threshold').value = this.doughStock.lowThreshold;
    }

    async saveAllSettings() {
        this.showLoading(true);
        try {
            await this.saveStockData();
            await this.saveSettings();
            this.showNotification('All settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async saveStockData() {
        // In a real implementation, this would save to your backend
        localStorage.setItem('stockData', JSON.stringify(this.stockData));
    }

    async saveSettings() {
        const settingsData = {
            ...this.settings,
            timeSlots: this.timeSlotSettings
        };
        localStorage.setItem('stockSettings', JSON.stringify(settingsData));
    }

    resetDailyStock() {
        if (confirm('Are you sure you want to reset all stock to default amounts? This will also reset all sales counters.')) {
            Object.keys(this.stockData).forEach(key => {
                this.stockData[key].stock = this.settings.defaultStockAmount;
                this.stockData[key].sold = 0;
                this.stockData[key].enabled = true;
            });
            
            this.renderStockItems();
            this.updateStatusCards();
            this.showNotification('Daily stock reset successfully!', 'success');
        }
    }

    emergencyDisableAll() {
        if (confirm('EMERGENCY: This will disable ALL menu items. Are you sure?')) {
            Object.keys(this.stockData).forEach(key => {
                this.stockData[key].enabled = false;
            });
            this.showNotification('All items disabled for emergency', 'warning');
        }
    }

    restockAll() {
        Object.keys(this.stockData).forEach(key => {
            this.stockData[key].stock = this.settings.defaultStockAmount;
            this.stockData[key].enabled = true;
        });
        
        this.renderStockItems();
        this.updateStatusCards();
        this.showNotification('All items restocked!', 'success');
    }

    viewCurrentOrders() {
        window.open('admin-running-orders.html', '_blank');
    }

    exportStockReport() {
        const reportData = {
            date: new Date().toISOString().split('T')[0],
            stockData: this.stockData,
            settings: this.settings,
            doughStock: this.doughStock,
            summary: {
                totalItems: Object.keys(this.stockData).length,
                lowStockItems: Object.values(this.stockData).filter(
                    item => item.stock <= this.settings.lowStockThreshold
                ).length,
                totalSold: Object.values(this.stockData).reduce((sum, item) => sum + item.sold, 0),
                doughRemaining: this.getDoughRemaining()
            }
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-report-${reportData.date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Stock report exported!', 'success');
    }

    showLoading(show) {
        document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
    }

    resetDoughStock() {
        if (confirm('Reset dough count? This will set used dough to 0 and re-enable all dough items.')) {
            this.doughStock.used = 0;
            this.enableAllDoughItems();
            this.updateStatusCards();
            this.saveDoughStock();
            this.showNotification('Dough stock reset successfully!', 'success');
        }
    }

    addDoughPortions() {
        const portions = prompt('How many dough portions to add?', '20');
        if (portions && !isNaN(portions)) {
            const addedPortions = parseInt(portions);
            this.doughStock.available += addedPortions;
            this.enableAllDoughItems();
            this.updateStatusCards();
            this.saveDoughStock();
            this.showNotification(`Added ${addedPortions} dough portions!`, 'success');
        }
    }

    enableAllDoughItems() {
        // Only re-enable dough items if we have dough available
        if (this.getDoughRemaining() > 0) {
            Object.keys(this.stockData).forEach(key => {
                const item = this.stockData[key];
                if (this.isDoughBasedItem(item.name, item.category)) {
                    item.enabled = true;
                }
            });
            this.renderStockItems();
        }
    }

    async saveDoughStock() {
        // Save dough stock to localStorage (in production, this would go to your server)
        localStorage.setItem('doughStock', JSON.stringify(this.doughStock));
    }

    async loadDoughStock() {
        try {
            const saved = localStorage.getItem('doughStock');
            if (saved) {
                this.doughStock = { ...this.doughStock, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.log('Using default dough stock settings');
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            case 'warning':
                notification.style.background = '#ffc107';
                notification.style.color = '#333';
                break;
            default:
                notification.style.background = '#007bff';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the stock manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.stockManager = new StockManager();
});