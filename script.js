import { loadingStates, showNotification, getProductImagePath, DEFAULT_PRODUCT_IMAGE } from './modules/constants.js';
import { loadProducts, getProducts } from './modules/products.js';
import { initializeFilters } from './modules/filters.js';
import { displayProducts, showProductDetails, closeModal } from './modules/ui.js';
import * as cartFunctions from './modules/cartFunctions.js';

// Remove conflicting window.cart assignments and keep only one
// Remove reference to setupCart since we're using cartFunctions instead
window.ui = {
    displayProducts,
    showProductDetails,
    closeModal
};

window.cart = {
    addToCart: cartFunctions.addToCart,
    removeFromCart: cartFunctions.removeFromCart,
    updateQuantity: cartFunctions.updateQuantity,
    calculateTotal: cartFunctions.calculateTotal,
    updateCartUI: cartFunctions.updateCartUI,    // Add this line
    populateCheckoutSummary: cartFunctions.populateCheckoutSummary,  // Add this line
    clearCart: cartFunctions.clearCart,
    updatePreviewCart: cartFunctions.updatePreviewCart
};

// Replace class with object for better browser compatibility
const ErrorBoundary = {
    handleError(error) {
        console.error('Application Error:', error);
        showNotification('Something went wrong', 'error');
    }
};

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', debounce(filterProducts, 300));

const productObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      loadProductImage(entry.target);
    }
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .catch(err => ErrorBoundary.handleError(err));
}

let cart = [];
let cartVisible = false;

function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = DEFAULT_PRODUCT_IMAGE;
}

function populateCategories() {
    const products = getProducts();
    const categories = ['All Categories', ...new Set(products.map(p => p.category))];
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (categoryFilter) {
        categoryFilter.innerHTML = categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
    }
}

function filterProducts() {
    const products = getProducts();
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const ratingSelect = document.getElementById('ratingFilter');
    const priceRange = document.getElementById('priceRange');
    
    if (!searchInput || !categorySelect || !ratingSelect || !priceRange) {
        console.warn('Filter elements not found');
        return;
    }
    
    const searchQuery = searchInput.value.toLowerCase().trim();
    const categoryFilter = categorySelect.value;
    const ratingFilter = parseFloat(ratingSelect.value) || 0;
    const maxPrice = parseFloat(priceRange.value);
    
    const filteredProducts = products.filter(product => {
        // Pencarian berdasarkan nama produk
        const nameMatch = product.name.toLowerCase().includes(searchQuery);
        
        // Filter kategori
        const categoryMatch = !categoryFilter || categoryFilter === 'All Categories' || 
                            product.category === categoryFilter;
        
        // Filter rating
        const ratingMatch = product.rating >= ratingFilter;
        
        // Filter harga
        const priceMatch = product.price <= maxPrice;
        
        return nameMatch && categoryMatch && ratingMatch && priceMatch;
    });
    
    displayProducts(filteredProducts);
    
    // Tampilkan pesan jika tidak ada produk yang ditemukan
    if (filteredProducts.length === 0) {
        showNotification('Tidak ada produk yang sesuai dengan filter', 'warning');
    }
}

function updatePriceLabel(value) {
    const priceLabel = document.getElementById('priceLabel');
    if (priceLabel) {
        priceLabel.textContent = `$${parseFloat(value).toFixed(2)}`;
    }
}

function updateFloatingCart() {
    const cartPreview = document.querySelector('.cart-preview');
    if (!cartPreview) return;

    const products = getProducts(); // Get products here
    cartPreview.innerHTML = '';

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;

        const cartItem = `
            <div class="preview-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="details">
                    <h4>${product.name}</h4>
                    <span class="preview-quantity">${item.quantity}</span>
                </div>
            </div>
        `;
        cartPreview.innerHTML += cartItem;
    });

    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
        cart.splice(index, 1);
        updateCartDisplay();
        updateCartCount();
        showNotification('Item removed from cart', 'success');
    }
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const products = getProducts(); // Get products here
    const product = products.find(p => p.id === productId);
    const newQuantity = item.quantity + change;
    
    if (newQuantity > 0 && newQuantity <= product.stock) {
        item.quantity = newQuantity;
        updateCartDisplay();
        updateCartCount();
    } else if (newQuantity === 0) {
        removeFromCart(productId);
    }
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cartContainer');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartContainer || !cartTotal) return;

    const products = getProducts(); // Get products here
    if (!products || products.length === 0) {
        console.warn('Products not loaded yet');
        return;
    }

    let total = 0;
    cartContainer.innerHTML = '';

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;

        const subtotal = item.price * item.quantity;
        total += subtotal;

        const cartItem = `
            <div class="cart-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="details">
                    <h4>${product.name}</h4>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${product.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${product.id}, 1)">+</button>
                    </div>
                    <p>$${subtotal.toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${product.id})" class="remove-btn">Remove</button>
            </div>
        `;
        cartContainer.innerHTML += cartItem;
    });

    cartTotal.textContent = `$${total.toFixed(2)}`;
    document.getElementById('proceedCheckoutBtn').style.display = cart.length > 0 ? 'block' : 'none';
    updateFloatingCart(); // Update floating cart preview
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function toggleCart() {
    const cartPanel = document.querySelector('.cart-panel');
    cartPanel.classList.toggle('active');
    
    // Add overlay when cart is open
    if (cartPanel.classList.contains('active')) {
        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        overlay.onclick = toggleCart;
        document.body.appendChild(overlay);
    } else {
        const overlay = document.querySelector('.cart-overlay');
        if (overlay) overlay.remove();
    }
}

function toggleCheckout() {
    const form = document.getElementById('checkoutForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

document.getElementById('checkoutForm').onsubmit = function(event) {
    event.preventDefault();
    alert('Thank you for your purchase!');
    cart = [];
    updateCartDisplay();
    toggleCheckout();
};

window.onload = loadProducts;

function attachClickEventsToProducts() {
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        product.addEventListener('click', function(e) {
            if (!e.target.closest('.add-to-cart-btn')) {
                const productId = this.getAttribute('data-id');
                showProductDetails(productId);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        product.addEventListener('click', function() {
            showProductDetails(parseInt(this.dataset.id));
        });
    });
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts().then(() => {
        attachClickEventsToProducts();
    });
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (cartVisible && !e.target.closest('.cart-panel') && !e.target.closest('.cart-icon')) {
            toggleCart();
        }
    });
});

// Checkout process
function handlePurchase(event) {
    event.preventDefault();

    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    const isValid = validateCheckoutForm(formData);

    if (!isValid) {
        showNotification('Please fill out all fields correctly.', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    showNotification(`Purchase successful! Total: $${total.toFixed(2)}`, 'success');

    // Clear Cart
    cart = [];
    updateCartDisplay();
    updateCartCount();
    saveCartToStorage();

    // Reset Form
    form.reset();
    backToCart();
}

function validateCheckoutForm(formData) {
    // Basic validation
    const requiredFields = ['name', 'email', 'phone', 'address'];
    for (const field of requiredFields) {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            console.log(`Missing required field: ${field}`);
            showNotification(`Please fill in your ${field}`, 'error');
            return false;
        }
    }

    // Email validation
    const email = formData.get('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('Invalid email format');
        showNotification('Please enter a valid email address', 'error');
        return false;
    }

    // Phone validation (minimal 10 digits)
    const phone = formData.get('phone');
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone)) {
        console.log('Invalid phone format');
        showNotification('Please enter a valid phone number (min. 10 digits)', 'error');
        return false;
    }

    // Validate cart is not empty
    const cartItems = cartFunctions.loadCart();
    if (!cartItems || cartItems.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return false;
    }

    return true;
}

function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Processing your order...</p>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
}

function showSuccessOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <h3>Order Successful!</h3>
            <p>Thank you for your purchase</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideSuccessOverlay() {
    const overlay = document.querySelector('.success-overlay');
    if (overlay) overlay.remove();
}

// Initialize cart count when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

function showCheckout() {
    const cartPanel = document.querySelector('.cart-panel');
    const checkoutPanel = document.querySelector('.checkout-panel');
    
    cartPanel.classList.remove('active');
    checkoutPanel.classList.add('active');
    
    updateCheckoutSummary();
}

function backToCart() {
    const cartPanel = document.querySelector('.cart-panel');
    const checkoutPanel = document.querySelector('.checkout-panel');
    
    checkoutPanel.classList.remove('active');
    cartPanel.classList.add('active');
}

function closeCheckout() {
    const checkoutPanel = document.querySelector('.checkout-panel');
    checkoutPanel.classList.remove('active');
}

function updateCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    let total = 0;
    
    checkoutItems.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div class="checkout-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
}

// Tambahkan CSS class untuk animasi
function addStyleSheet() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .cart-trigger.bounce {
            animation: bounce 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Fungsi untuk menyimpan cart ke localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Fungsi untuk memuat cart dari localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

// Fungsi untuk setup filter listeners
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const ratingSelect = document.getElementById('ratingFilter');
    const priceRange = document.getElementById('priceRange');
    
    const products = getProducts(); // Get products here
    // Setup max price untuk price range
    const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 100;
    if (priceRange) {
        priceRange.max = maxPrice;
        priceRange.value = maxPrice;
        updatePriceLabel(maxPrice);
    }
    
    // Event listeners untuk setiap filter
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterProducts, 300));
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', filterProducts);
    }
    
    if (ratingSelect) {
        ratingSelect.addEventListener('change', filterProducts);
    }
    
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            updatePriceLabel(e.target.value);
            filterProducts();
        });
    }
}

// Fungsi debounce untuk mencegah terlalu banyak pemrosesan saat mengetik
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fungsi untuk inisialisasi semua komponen
async function initializeComponents() {
    try {
        // First load products
        await loadProducts();
        const products = getProducts();
        if (!products || products.length === 0) {
            throw new Error('No products loaded');
        }
        
        // Initialize all components
        loadCartFromStorage();
        addStyleSheet();
        displayProducts(products);
        initializeFilters(); // Make sure this runs after products are loaded
        
    } catch (error) {
        console.error('Error initializing components:', error);
        showNotification('Error loading components', 'error');
    }
}

// Load saat halaman dimuat
document.addEventListener('DOMContentLoaded', initializeComponents);

// Initialize Components
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadProducts();
        
        // Then initialize UI with loaded products
        displayProducts(getProducts());
        
        // Setup other components
        setupFilters();
        
        // Setup event listeners for products
        attachClickEventsToProducts();
        
        const checkoutFormElement = document.getElementById('checkoutForm');
        if (checkoutFormElement) {
            checkoutFormElement.onsubmit = handlePurchase;
        }

        // Add cart and checkout event listeners here
        const cartTrigger = document.querySelector('.cart-trigger');
        const closeCart = document.querySelector('.close-cart');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const backToCart = document.querySelector('.back-to-cart');
        const closeCheckout = document.querySelector('.close-checkout');
        
        if (cartTrigger) {
            cartTrigger.addEventListener('click', () => {
                document.querySelector('.cart-panel').classList.add('active');
            });
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => {
                document.querySelector('.cart-panel').classList.remove('active');
            });
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                document.querySelector('.cart-panel').classList.remove('active');
                document.querySelector('.checkout-panel').classList.add('active');
                window.cart.populateCheckoutSummary();
            });
        }

        if (backToCart) {
            backToCart.addEventListener('click', window.backToCart);
        }

        if (closeCheckout) {
            closeCheckout.addEventListener('click', window.closeCheckout);
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', window.handlePurchase);
        }

    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error loading application', 'error');
    }
});

// Cart Panel Toggle
// document.querySelector('.cart-trigger').addEventListener('click', () => {
//     document.querySelector('.cart-panel').classList.add('active');
// });

// document.querySelector('.close-cart').addEventListener('click', () => {
//     document.querySelector('.cart-panel').classList.remove('active');
// });

// Checkout Panel Navigation
// document.getElementById('checkoutBtn').addEventListener('click', () => {
//     document.querySelector('.cart-panel').classList.remove('active');
//     document.querySelector('.checkout-panel').classList.add('active');
//     window.cart.populateCheckoutSummary();
// });

// document.querySelector('.back-to-cart').addEventListener('click', () => {
//     document.querySelector('.checkout-panel').classList.remove('active');
//     document.querySelector('.cart-panel').classList.add('active');
// });

// document.querySelector('.close-checkout').addEventListener('click', () => {
//     document.querySelector('.checkout-panel').classList.remove('active');
// });

// Handle checkout form submission
// document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
    
//     const formData = new FormData(e.target);
//     // Implement your checkout logic here
    
//     // Clear cart after successful checkout
//     window.cart.clearCart();
//     document.querySelector('.checkout-panel').classList.remove('active');
//     showNotification('Order placed successfully!', 'success');
// });

// Listen for cart updates
window.addEventListener('cartUpdated', (e) => {
    window.cart.updateCartUI(e.detail);
});

// Add these functions to the global scope
window.closeCheckout = function() {
    const checkoutPanel = document.querySelector('.checkout-panel');
    checkoutPanel.classList.remove('active');
};

window.backToCart = function() {
    const cartPanel = document.querySelector('.cart-panel');
    const checkoutPanel = document.querySelector('.checkout-panel');
    
    checkoutPanel.classList.remove('active');
    cartPanel.classList.add('active');
};

window.handlePurchase = function(event) {
    event.preventDefault();
    
    const cartItems = cartFunctions.loadCart();
    if (!cartItems || cartItems.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    
    try {
        // Validate form data
        const purchaseData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            items: cartItems,
            total: cartFunctions.calculateTotal()
        };

        if (!validateCheckoutForm(formData)) {
            showNotification('Please fill all required fields correctly', 'error');
            return;
        }

        // Show loading overlay
        showLoadingOverlay();

        // Process checkout
        setTimeout(() => {
            hideLoadingOverlay();
            showSuccessOverlay();
            
            // Clear cart
            window.cart.clearCart();
            
            // Reset form
            form.reset();
            
            // Close checkout panel
            closeCheckout();
            
            showNotification(`Order placed successfully! Total: $${purchaseData.total.toFixed(2)}`, 'success');
            
            // Hide success overlay after 2 seconds
            setTimeout(() => {
                hideSuccessOverlay();
            }, 2000);
        }, 1500);

    } catch (error) {
        console.error('Checkout error:', error);
        hideLoadingOverlay();
        showNotification('Error processing checkout', 'error');
    }
};

// Update the DOMContentLoaded event listener to add event handlers
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // ...existing initialization code...

        // Add event listeners for checkout buttons
        const backToCartBtn = document.querySelector('.back-to-cart');
        const closeCheckoutBtn = document.querySelector('.close-checkout');
        const checkoutForm = document.getElementById('checkoutForm');

        if (backToCartBtn) {
            backToCartBtn.addEventListener('click', window.backToCart);
        }

        if (closeCheckoutBtn) {
            closeCheckoutBtn.addEventListener('click', window.closeCheckout);
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', window.handlePurchase);
        }

        // Add event listener for cart trigger hover
        document.querySelector('.cart-trigger').addEventListener('mouseover', () => {
            const cartItems = cartFunctions.loadCart();
            cartFunctions.updatePreviewCart(cartItems);
        });

        // ...rest of existing initialization code...
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error loading application', 'error');
    }
});

// ...rest of existing code...


