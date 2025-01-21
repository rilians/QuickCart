import { showNotification } from './constants.js';

let productsList = [];

// Fungsi untuk mendapatkan daftar produk
export const getProducts = () => productsList;

// Fungsi untuk memuat produk dari products.json
export async function loadProducts() {
    try {
        const response = await fetch('./data/products.json'); // Path diperbaiki menjadi relatif
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        try {
            productsList = JSON.parse(text); // Parsing JSON
            return productsList;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Received text:', text); // Debug log untuk konten yang diterima
            throw parseError;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error'); // Notifikasi error
        return []; // Return list kosong jika terjadi error
    }
}
