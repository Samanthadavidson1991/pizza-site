// Enhanced Checkout JavaScript
class CheckoutManager {
    constructor() {
        this.cart = [];
        this.currentStep = 1;
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateDisplay();
    }

    loadCart() {
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        console.log('Cart loaded:', this.cart);
    }

    setupEventListeners() {
        // Since delivery is the only option, no need for order type toggle
        // Order type toggle (kept for future extensibility)
        document.querySelectorAll('input[name="orderType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleOrderTypeChange(e));
        });

        // Form validation on input
        const inputs = document.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearError(e.target));
        });

        // Payment buttons
        document.getElementById('pay-with-cash').addEventListener('click', () => this.processCashOrder());
        document.getElementById('back-to-menu').addEventListener('click', () => this.backToMenu());

        // Form submission prevention
        document.getElementById('checkout-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processCashOrder();
        });
    }

    updateDisplay() {
        this.updateCartDisplay();
        this.updateProgress();
    }

    updateCartDisplay() {
        const cartItemsDiv = document.getElementById('cart-items');
        const subtotalElements = document.querySelectorAll('#cart-subtotal, #cart-total, #final-total');
        
        if (this.cart.length === 0) {
            cartItemsDiv.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            subtotalElements.forEach(el => el.textContent = '£0.00');
            return;
        }

        let total = 0;
        let cartHTML = '';

        this.cart.forEach(item => {
            const itemTotal = item.price * (item.quantity || 1);
            total += itemTotal;

            cartHTML += `
                <div class="cart-item">
                    <div class="item-info">
                        <div class="item-name">${item.name || 'Unknown Item'}</div>
                        <div class="item-details">Qty: ${item.quantity || 1}</div>
                    </div>
                    <div class="item-price">£${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });

        cartItemsDiv.innerHTML = cartHTML;
        subtotalElements.forEach(el => el.textContent = `£${total.toFixed(2)}`);
    }

    updateProgress() {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            if (index < this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    handleOrderTypeChange(event) {
        // Since delivery is the only option, delivery fields are always visible
        const deliveryFields = document.getElementById('delivery-fields');
        deliveryFields.style.display = 'block';
    }    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id;
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearError(field);

        // Check if field is required
        const isRequired = field.hasAttribute('required') || field.classList.contains('required');
        // Since delivery is the only option, it's always true
        const isDelivery = true;

        switch (fieldName) {
            case 'customer-name':
                if (isRequired && !value) {
                    errorMessage = 'Please enter your name';
                    isValid = false;
                } else if (value && value.length < 2) {
                    errorMessage = 'Name must be at least 2 characters';
                    isValid = false;
                }
                break;

            case 'customer-phone':
                if (isRequired && !value) {
                    errorMessage = 'Please enter your phone number';
                    isValid = false;
                } else if (value && !/^[\d\s\-\+\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
                    errorMessage = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'customer-email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'customer-address':
                if (!value) {
                    errorMessage = 'Please enter your delivery address';
                    isValid = false;
                }
                break;

            case 'customer-postcode':
                if (!value) {
                    errorMessage = 'Please enter your postcode';
                    isValid = false;
                }
                break;

            case 'order-time-slot':
                if (!value) {
                    errorMessage = 'Please select a time slot';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showError(field, errorMessage);
        }

        return isValid;
    }

    showError(field, message) {
        field.classList.add('error');
        const errorId = field.id + '-error';
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearError(field) {
        field.classList.remove('error');
        const errorId = field.id + '-error';
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    validateForm() {
        const requiredFields = [
            'customer-name',
            'customer-phone',
            'order-time-slot',
            'customer-address',
            'customer-postcode'
        ];

        let isFormValid = true;
        const firstErrorField = requiredFields.find(fieldId => {
            const field = document.getElementById(fieldId);
            const isValid = this.validateField(field);
            if (!isValid && isFormValid) {
                isFormValid = false;
                return true;
            }
            return false;
        });

        // Focus on first error field
        if (firstErrorField) {
            document.getElementById(firstErrorField).focus();
        }

        return isFormValid;
    }

    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    async processCashOrder() {
        // Validate cart
        if (this.cart.length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
            window.location.href = 'menu.html';
            return;
        }

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Gather form data
            const formData = this.gatherFormData();
            
            // Submit order
            const response = await fetch('https://thecrustatngb.co.uk/submit-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            // Success!
            this.handleOrderSuccess(result);

        } catch (error) {
            console.error('Order submission error:', error);
            this.handleOrderError(error);
        } finally {
            this.showLoading(false);
        }
    }

    gatherFormData() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        
        return {
            cart: this.cart,
            total: total,
            method: 'cash',
            orderType: document.querySelector('input[name="orderType"]:checked').value,
            customerName: document.getElementById('customer-name').value.trim(),
            customerPhone: document.getElementById('customer-phone').value.trim(),
            customerEmail: document.getElementById('customer-email').value.trim(),
            customerAddress: document.getElementById('customer-address').value.trim(),
            customerPostcode: document.getElementById('customer-postcode').value.trim(),
            orderTimeSlot: document.getElementById('order-time-slot').value,
            orderComments: document.getElementById('order-comments').value.trim(),
            placedAt: new Date().toISOString()
        };
    }

    handleOrderSuccess(result) {
        // Clear cart
        localStorage.removeItem('cart');
        
        // Show success message
        const customerName = document.getElementById('customer-name').value.trim();
        const timeSlot = document.getElementById('order-time-slot').value;

        const message = `Thank you ${customerName}!\n\n` +
                       `Your order has been placed successfully.\n` +
                       `Order ID: ${result.orderId || 'N/A'}\n` +
                       `Delivery: ${timeSlot}\n\n` +
                       `You will pay with cash when your order is delivered.\n\n` +
                       `We'll contact you if there are any issues.`;        alert(message);
        
        // Redirect to home page
        window.location.href = 'index.html';
    }

    handleOrderError(error) {
        let message = 'Sorry, there was a problem processing your order.\n\n';
        
        if (error.message.includes('Network')) {
            message += 'Please check your internet connection and try again.';
        } else {
            message += error.message || 'Please try again or contact us if the problem persists.';
        }
        
        alert(message);
    }

    backToMenu() {
        if (confirm('Are you sure you want to go back to the menu? Your information will be lost.')) {
            window.location.href = 'menu.html';
        }
    }
}

// Initialize checkout when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});