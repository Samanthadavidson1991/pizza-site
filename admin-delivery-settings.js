// Admin Delivery Settings Management
class DeliverySettingsAdmin {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.settings = {
            basePostcode: 'LS18 5HZ',
            deliveryRadius: 4,
            deliveryEnabled: true,
            deliveryMessage: '',
            minimumOrder: 15.00,
            deliveryFee: 3.50
        };
        
        this.init();
    }

    getBaseURL() {
        // Detect if we're running locally or on the deployed site
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:4242';
        } else {
            return ''; // Use relative URLs for deployed site
        }
    }

    async init() {
        console.log('Initializing delivery settings admin...');
        
        await this.loadCurrentSettings();
        this.updateUI();
        this.setupEventListeners();
        
        console.log('Delivery settings admin initialized');
    }

    async loadCurrentSettings() {
        try {
            // Try to load settings from server
            const response = await fetch(`${this.baseURL}/admin/delivery-settings`, {
                headers: {
                    'Authorization': this.getAuthHeader()
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.settings = { ...this.settings, ...data };
                console.log('Loaded delivery settings:', this.settings);
            } else {
                console.log('Using default delivery settings');
            }
        } catch (error) {
            console.log('Failed to load settings, using defaults:', error);
            // Use localStorage as fallback
            const stored = localStorage.getItem('deliverySettings');
            if (stored) {
                try {
                    this.settings = { ...this.settings, ...JSON.parse(stored) };
                } catch (e) {
                    console.error('Failed to parse stored settings:', e);
                }
            }
        }
    }

    updateUI() {
        // Update current settings display
        document.getElementById('current-base').textContent = this.settings.basePostcode;
        document.getElementById('current-radius').textContent = `${this.settings.deliveryRadius} miles`;
        document.getElementById('current-status').textContent = this.settings.deliveryEnabled ? 'Active' : 'Disabled';
        
        const lastUpdated = localStorage.getItem('deliverySettingsLastUpdated');
        if (lastUpdated) {
            const date = new Date(lastUpdated);
            document.getElementById('last-updated').textContent = date.toLocaleString();
        }

        // Update form fields
        document.getElementById('base-postcode').value = this.settings.basePostcode;
        document.getElementById('delivery-radius').value = this.settings.deliveryRadius;
        document.getElementById('delivery-enabled').checked = this.settings.deliveryEnabled;
        document.getElementById('delivery-message').value = this.settings.deliveryMessage || '';
        document.getElementById('minimum-order').value = this.settings.minimumOrder;
        document.getElementById('delivery-fee').value = this.settings.deliveryFee;

        this.updateDeliveryStatusText();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('delivery-settings-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Delivery toggle
        const deliveryToggle = document.getElementById('delivery-enabled');
        deliveryToggle.addEventListener('change', () => {
            this.updateDeliveryStatusText();
        });

        // Test postcode
        const testBtn = document.getElementById('test-distance-btn');
        testBtn.addEventListener('click', () => {
            this.testPostcode();
        });

        // Auto-format postcodes
        const postcodeInputs = ['base-postcode', 'test-postcode'];
        postcodeInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    e.target.value = this.formatPostcode(e.target.value);
                });
            }
        });
    }

    updateDeliveryStatusText() {
        const enabled = document.getElementById('delivery-enabled').checked;
        const statusText = document.getElementById('delivery-status-text');
        statusText.textContent = enabled ? 'Delivery Enabled' : 'Delivery Disabled';
        statusText.style.color = enabled ? '#28a745' : '#dc3545';
    }

    formatPostcode(value) {
        let clean = value.replace(/\s+/g, '').toUpperCase();
        if (clean.length > 3) {
            clean = clean.slice(0, -3) + ' ' + clean.slice(-3);
        }
        return clean;
    }

    async testPostcode() {
        const testInput = document.getElementById('test-postcode');
        const testResult = document.getElementById('test-result');
        const testBtn = document.getElementById('test-distance-btn');
        
        const postcode = testInput.value.trim();
        if (!postcode) {
            this.showTestResult('Please enter a postcode to test', 'error');
            return;
        }

        // Show loading state
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        testResult.style.display = 'none';

        try {
            // Create a temporary validator with current settings
            const basePostcode = document.getElementById('base-postcode').value.trim();
            const maxDistance = parseFloat(document.getElementById('delivery-radius').value);

            // Use the delivery validator if available
            if (window.deliveryValidator) {
                // Temporarily update validator settings
                const originalBase = window.deliveryValidator.basePostcode;
                const originalMax = window.deliveryValidator.maxDeliveryDistance;
                
                window.deliveryValidator.basePostcode = basePostcode;
                window.deliveryValidator.maxDeliveryDistance = maxDistance;
                
                // Re-initialize with new base
                await window.deliveryValidator.init();
                
                const result = await window.deliveryValidator.validateDeliveryPostcode(postcode);
                
                if (result.distance !== null) {
                    const status = result.valid ? 'success' : 'error';
                    const icon = result.valid ? '✅' : '❌';
                    this.showTestResult(
                        `${icon} ${postcode}: ${result.distance} miles from ${basePostcode} - ${result.message}`, 
                        status
                    );
                } else {
                    this.showTestResult(`❌ Invalid postcode: ${postcode}`, 'error');
                }

                // Restore original settings
                window.deliveryValidator.basePostcode = originalBase;
                window.deliveryValidator.maxDeliveryDistance = originalMax;
                await window.deliveryValidator.init();
                
            } else {
                this.showTestResult('⚠️ Delivery validator not available for testing', 'error');
            }

        } catch (error) {
            console.error('Test error:', error);
            this.showTestResult('❌ Error testing postcode. Please try again.', 'error');
        } finally {
            // Reset button
            testBtn.disabled = false;
            testBtn.textContent = 'Test';
        }
    }

    showTestResult(message, type) {
        const testResult = document.getElementById('test-result');
        testResult.textContent = message;
        testResult.className = `status-message ${type}`;
        testResult.style.display = 'block';
    }

    async saveSettings() {
        const saveBtn = document.querySelector('.save-btn');
        const statusDiv = document.getElementById('save-status');
        
        // Show saving state
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 Saving...';

        try {
            // Collect form data
            const formData = {
                basePostcode: document.getElementById('base-postcode').value.trim(),
                deliveryRadius: parseFloat(document.getElementById('delivery-radius').value),
                deliveryEnabled: document.getElementById('delivery-enabled').checked,
                deliveryMessage: document.getElementById('delivery-message').value.trim(),
                minimumOrder: parseFloat(document.getElementById('minimum-order').value),
                deliveryFee: parseFloat(document.getElementById('delivery-fee').value)
            };

            // Validate data
            if (!formData.basePostcode) {
                throw new Error('Base postcode is required');
            }
            if (formData.deliveryRadius < 1 || formData.deliveryRadius > 20) {
                throw new Error('Delivery radius must be between 1 and 20 miles');
            }

            // Save to server
            await this.saveToServer(formData);
            
            // Update local settings
            this.settings = formData;
            
            // Save to localStorage as backup
            localStorage.setItem('deliverySettings', JSON.stringify(formData));
            localStorage.setItem('deliverySettingsLastUpdated', new Date().toISOString());
            
            // Update UI
            this.updateUI();
            
            // Show success message
            this.showSaveStatus('✅ Delivery settings saved successfully!', 'success');
            
            // Update the live delivery validator if it exists
            if (window.deliveryValidator) {
                window.deliveryValidator.basePostcode = formData.basePostcode;
                window.deliveryValidator.maxDeliveryDistance = formData.deliveryRadius;
                await window.deliveryValidator.init();
                console.log('Updated live delivery validator');
            }

        } catch (error) {
            console.error('Save error:', error);
            this.showSaveStatus(`❌ Error saving settings: ${error.message}`, 'error');
        } finally {
            // Reset button
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Delivery Settings';
        }
    }

    async saveToServer(settings) {
        try {
            const response = await fetch(`${this.baseURL}/admin/delivery-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            console.log('Settings saved to server');
        } catch (error) {
            console.log('Server save failed, using localStorage only:', error);
            // Don't throw - localStorage backup is sufficient
        }
    }

    showSaveStatus(message, type) {
        const statusDiv = document.getElementById('save-status');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }

    getAuthHeader() {
        // Basic auth for admin endpoints
        return 'Basic ' + btoa('admin:password');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing delivery settings admin...');
    new DeliverySettingsAdmin();
});

// Load delivery validator for testing
const script = document.createElement('script');
script.src = '../customer-site/delivery-validator.js';
document.head.appendChild(script);