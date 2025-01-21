const FALLBACK_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function generateIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#00a5cf';
    ctx.fillRect(0, 0, size, size);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size/3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QC', size/2, size/2);
    
    const iconUrl = canvas.toDataURL('image/png');
    
    // Create blob for caching
    const blob = dataURItoBlob(iconUrl);
    
    // Save to cache
    if ('caches' in window) {
        const iconPath = `/assets/icons/icon-${size}x${size}.png`;
        caches.open('icon-cache').then(cache => {
            cache.put(iconPath, new Response(blob, {
                headers: { 'Content-Type': 'image/png' }
            }));
        });
    }
    
    return iconUrl;
}

function dataURItoBlob(dataURI) {
    const binary = atob(dataURI.split(',')[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: 'image/png' });
}

export default async function updateIcons() {
    try {
        // Create icons directory if it doesn't exist
        const iconDir = '/assets/icons/';
        
        // Generate icons and update links
        const sizes = [192, 512];
        const iconPromises = sizes.map(async size => {
            const iconUrl = generateIcon(size);
            const iconPath = `${iconDir}icon-${size}.png`;
            
            // Cache the icon
            if ('caches' in window) {
                const cache = await caches.open('icon-cache');
                const blob = await (await fetch(iconUrl)).blob();
                await cache.put(iconPath, new Response(blob, {
                    headers: { 'Content-Type': 'image/png' }
                }));
            }
            
            // Update icon links
            document.querySelectorAll(`link[sizes="${size}x${size}"]`).forEach(link => {
                link.href = iconUrl;
            });
            
            // Update apple touch icon
            if (size === 192) {
                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                if (appleIcon) appleIcon.href = iconUrl;
            }
            
            return iconUrl;
        });
        
        await Promise.all(iconPromises);
        
    } catch (error) {
        console.error('Error generating icons:', error);
        // Use fallback icon
        const links = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
        links.forEach(link => link.href = FALLBACK_ICON);
    }
}
