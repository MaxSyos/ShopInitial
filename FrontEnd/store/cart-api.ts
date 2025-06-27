import api from '../lib/axiosConfig';

export const fetchCart = () => api.get('/cart');
export const addToCart = (productId: string, quantity: number) => api.post('/cart/items', { productId, quantity });
export const updateCartItem = (itemId: string, quantity: number) => api.put(`/cart/items/${itemId}`, { quantity });
export const removeCartItem = (itemId: string) => api.delete(`/cart/items/${itemId}`);
export const clearCart = () => api.delete('/cart');
