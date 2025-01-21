import { showNotification } from './constants.js';

let productsList = [];

export const getProducts = () => productsList;

export async function loadProducts() {
    try {
        const response = await fetch('/data/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        try {
            productsList = JSON.parse(text);
            return productsList;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Received text:', text);
            throw parseError;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
        return [];
    }
}