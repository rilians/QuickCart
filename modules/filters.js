import { getProducts } from './products.js';
import { displayProducts } from './ui.js';
import { showNotification } from './constants.js';

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

export function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const ratingSelect = document.getElementById('ratingFilter');
    const priceRange = document.getElementById('priceRange');
    const priceLabel = document.getElementById('priceLabel');

    // Check if elements exist
    if (!searchInput || !categorySelect || !ratingSelect || !priceRange || !priceLabel) {
        console.error('Filter elements missing:', {
            searchInput: !!searchInput,
            categorySelect: !!categorySelect,
            ratingSelect: !!ratingSelect,
            priceRange: !!priceRange,
            priceLabel: !!priceLabel
        });
        return;
    }

    // Setup initial values
    const products = getProducts();
    const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 1000;
    
    // Initialize price range
    priceRange.max = maxPrice;
    priceRange.value = maxPrice;
    priceLabel.textContent = `$${maxPrice.toFixed(2)}`;

    // Initialize category filter
    const categories = ['All Categories', ...new Set(products.map(p => p.category))];
    categorySelect.innerHTML = categories.map(category => 
        `<option value="${category}">${category}</option>`
    ).join('');

    // Setup event listeners
    searchInput.addEventListener('input', debounce(() => filterProducts(), 300));
    categorySelect.addEventListener('change', () => filterProducts());
    ratingSelect.addEventListener('change', () => filterProducts());
    priceRange.addEventListener('input', (e) => {
        priceLabel.textContent = `$${parseFloat(e.target.value).toFixed(2)}`;
        filterProducts();
    });
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
        const nameMatch = product.name.toLowerCase().includes(searchQuery);
        const categoryMatch = categoryFilter === 'All Categories' || product.category === categoryFilter;
        const ratingMatch = product.rating >= ratingFilter;
        const priceMatch = product.price <= maxPrice;
        
        return nameMatch && categoryMatch && ratingMatch && priceMatch;
    });
    
    displayProducts(filteredProducts);
    
    if (filteredProducts.length === 0) {
        showNotification('No products match your filters', 'warning');
    }
}
