export function setLoadingState(isLoading) {
    const container = document.getElementById('productContainer');
    if (isLoading) {
        container.innerHTML = Array(8).fill(0).map(() => `
            <div class="product skeleton">
                <div class="product-image skeleton"></div>
                <div class="product-info skeleton"></div>
            </div>
        `).join('');
    }
}

export function updateLoadingUI() {
    const loadingSkeleton = document.getElementById('loading-skeleton');
    if (loadingSkeleton) {
        loadingSkeleton.style.display = 
            Object.values(loadingStates).some(state => state) ? 'block' : 'none';
    }
}
