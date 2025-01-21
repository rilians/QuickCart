export const loadingStates = {
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error'
};

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

export const settings = {
    apiUrl: '/api',
    imageBasePath: '/assets/images/',
    iconBasePath: '/assets/icons/'
};

export const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export const PRODUCT_IMAGES_PATH = '/assets/images/products/';
export const DEFAULT_PRODUCT_IMAGE = '/assets/images/placeholder.png';

export const getProductImagePath = (imageName) => {
    // Jika imageName adalah URL absolut (dimulai dengan http atau https)
    if (imageName && imageName.startsWith('http')) {
        return imageName; // Gunakan langsung URL absolut
    }

    // Jika imageName relatif atau tidak ada, gunakan PRODUCT_IMAGES_PATH
    return imageName ? `${PRODUCT_IMAGES_PATH}${imageName}` : DEFAULT_PRODUCT_IMAGE;
};
