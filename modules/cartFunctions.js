import { getProducts } from './products.js';
import { getProductImagePath } from './constants.js';

// Cart functions module

/**
 * Stores cart data in local storage
 * @param {Object[]} cartItems - Array of cart items
 */
const saveCart = (cartItems) => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
};

/**
 * Retrieves cart data from local storage
 * @returns {Object[]} Array of cart items
 */
const loadCart = () => {
    const cartItems = localStorage.getItem('cartItems');
    return cartItems ? JSON.parse(cartItems) : [];
};

/**
 * Adds an item to the cart
 * @param {string|number} productId - ID of product to add
 * @param {Event} [event] - Optional event to stop propagation
 * @returns {Object[]} Updated cart items
 */
const addToCart = (productId, event) => {
    if (event) {
        event.stopPropagation(); // Prevent event bubbling
    }
    
    const cartItems = loadCart();
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        console.error('Product not found:', productId);
        return cartItems;
    }

    const existingItem = cartItems.find(i => i.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1; // Default quantity
    } else {
        cartItems.push({ ...product, quantity: 1 });
    }
    
    saveCart(cartItems);
    
    // Update UI immediately
    updateCartUI(cartItems);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartItems }));
    
    return cartItems;
};

/**
 * Removes an item from the cart
 * @param {string|number} itemId - ID of item to remove
 * @returns {Object[]} Updated cart items
 */
const removeFromCart = (itemId) => {
    const cartItems = loadCart();
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    saveCart(updatedCart);
    updateCartUI(updatedCart);
    
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }));
    return updatedCart;
};

/**
 * Updates quantity of an item in cart
 * @param {string|number} itemId - ID of item to update
 * @param {number} quantity - New quantity
 * @returns {Object[]} Updated cart items
 */
const updateQuantity = (itemId, quantity) => {
    const cartItems = loadCart();
    const item = cartItems.find(i => i.id === itemId);
    
    if (!item) return cartItems;

    const newQuantity = item.quantity + quantity;
    
    // Check if quantity would become 0 or negative
    if (newQuantity <= 0) {
        return removeFromCart(itemId);
    }
    
    // Check stock limit from products data
    const products = getProducts();
    const product = products.find(p => p.id === itemId);
    if (product && newQuantity > product.stock) {
        return cartItems;
    }

    item.quantity = newQuantity;
    saveCart(cartItems);
    updateCartUI(cartItems);
    
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartItems }));
    return cartItems;
};

/**
 * Calculates total price of items in cart
 * @returns {number} Total price
 */
const calculateTotal = () => {
    const cartItems = loadCart();
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

function updateCartUI(cartItems) {
    // Get all required elements
    const elements = {
        cartCount: document.querySelector('.cart-count'),
        cartItems: document.getElementById('cartItems'),
        cartTotal: document.getElementById('cartTotal'),
        checkoutBtn: document.getElementById('checkoutBtn')
    };

    // Log which elements are missing
    const missingElements = Object.entries(elements)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Missing cart UI elements:', missingElements);
        return;
    }

    // Update cart count
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    elements.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Update cart items with correct image paths
    elements.cartItems.innerHTML = cartItems.length ? cartItems.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image">
                <img src="${getProductImagePath(item.image)}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="quantity-controls">
                    <button class="quantity-btn minus" onclick="window.cart.updateQuantity(${item.id}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" onclick="window.cart.updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-price">
                    <span class="price">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-btn" onclick="window.cart.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('') : '<div class="empty-cart">Your cart is empty</div>';
    
    // Update total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    elements.cartTotal.textContent = `$${total.toFixed(2)}`;
    
    // Enable/disable checkout button
    elements.checkoutBtn.disabled = cartItems.length === 0;
}

// Update preview cart items to use correct image paths
function updatePreviewCart(cartItems) {
    const cartPreview = document.querySelector('.cart-preview');
    if (!cartPreview) return;

    cartPreview.innerHTML = cartItems.map(item => `
        <div class="preview-item">
            <img src="${getProductImagePath(item.image)}" alt="${item.name}">
            <div class="preview-details">
                <h4>${item.name}</h4>
                <span class="preview-quantity">×${item.quantity}</span>
            </div>
        </div>
    `).join('');
}

function populateCheckoutSummary() {
    const cartItems = loadCart();
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    checkoutItems.innerHTML = cartItems.map(item => `
        <div class="checkout-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `Total: $${total.toFixed(2)}`;
}

function clearCart() {
    // Clear localStorage
    localStorage.removeItem('cartItems');
    
    // Update UI elements
    const elements = {
        cartCount: document.querySelector('.cart-count'),
        cartItems: document.getElementById('cartItems'),
        cartTotal: document.getElementById('cartTotal'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        cartPreview: document.querySelector('.cart-preview')
    };

    // Update cart display
    if (elements.cartItems) {
        elements.cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    }
    
    // Update cart count
    if (elements.cartCount) {
        elements.cartCount.textContent = '0';
        elements.cartCount.style.display = 'none';
    }
    
    // Update total
    if (elements.cartTotal) {
        elements.cartTotal.textContent = '$0.00';
    }
    
    // Disable checkout button
    if (elements.checkoutBtn) {
        elements.checkoutBtn.disabled = true;
    }
    
    // Clear preview
    if (elements.cartPreview) {
        elements.cartPreview.innerHTML = '';
    }

    return [];
}

// Single export statement for all functions
export {
    saveCart,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateTotal,
    updateCartUI,
    populateCheckoutSummary,
    clearCart,
    updatePreviewCart
};