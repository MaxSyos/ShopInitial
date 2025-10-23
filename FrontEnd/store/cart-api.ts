import axios from 'axios';

export const fetchCart = () => axios.get('/api/cart');
export const addToCart = (productId: string, quantity: number) => axios.post('/api/cart/items', { productId, quantity });
export const updateCartItem = (itemId: string, quantity: number) => axios.put(`/api/cart/items/${itemId}`, { quantity });
export const removeCartItem = (itemId: string) => axios.delete(`/api/cart/items/${itemId}`);
export const clearCart = () => axios.delete('/api/cart');
