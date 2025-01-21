import { getProductImagePath } from './constants.js';
import { getProducts } from './products.js';

export function displayProducts(productsToShow) {
    const container = document.querySelector('.products-grid');
    if (!container) {
        console.warn('Products container not found');
        return;
    }
    
    if (productsToShow.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <p>No products found</p>
            </div>`;
        return;
    }
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card" onclick="window.ui.showProductDetails(${product.id})">
            <div class="product-image">
                <img src="${getProductImagePath(product.image)}" 
                     alt="${product.name}" 
                     onerror="handleImageError(this)">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}
                    <span>(${product.rating})</span>
                </div>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" onclick="window.cart.addToCart(${product.id}, event)">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

export function showProductDetails(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'product-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="window.ui.closeModal()">&times;</button>
            <div class="product-detail">
                <div class="product-detail-image">
                    <img src="${getProductImagePath(product.image)}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <div class="rating">
                        ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}
                        <span>(${product.rating})</span>
                    </div>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="stock">Stock: ${product.stock}</p>
                    <p class="description">${product.description || 'No description available'}</p>
                    <button class="add-to-cart-btn" onclick="window.cart.addToCart(${product.id}, event)">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.ui.closeModal();
        }
    });
}

export function closeModal() {
    const modal = document.querySelector('.product-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}
