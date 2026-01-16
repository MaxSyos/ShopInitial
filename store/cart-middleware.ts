import { Middleware } from '@reduxjs/toolkit';
import cartLocal from '../lib/cartLocal';
import cartSync from '../lib/cartSync';

const cartMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const prev = storeAPI.getState().cart;
  // let action proceed to reducers
  const result = next(action);
  const nextState = storeAPI.getState().cart;

  try {
    // Persist local cart snapshot to localStorage
    cartLocal.writeLocalCart(nextState);
  } catch (e) {
    console.warn('cartMiddleware: failed to write local cart', e);
  }

  // Only consider specific cart actions to enqueue ops
  try {
    const type: string = action.type || '';
    if (type.endsWith('/addItemToCart')) {
      const payload = action.payload as any;
      const productId = payload.product?.id || payload.product?.slug?.current || null;
      if (productId) {
        cartLocal.enqueueOp({ type: 'add', productId, quantity: Number(payload.quantity), unitPrice: payload.product?.price });
        cartSync.scheduleSync();
      }
    } else if (type.endsWith('/removeItemFromCart') || type.endsWith('/removeItemCompletely')) {
      // payload is slug.current — find item in nextState
      const slug = action.payload as string;
      const item = (nextState.items || []).find((it: any) => it.slug?.current === slug || it.id === slug);
      const prevItem = (prev.items || []).find((it: any) => it.slug?.current === slug || it.id === slug);
      const nextItem = (nextState.items || []).find((it: any) => it.slug?.current === slug || it.id === slug);
      if (prevItem && !nextItem) {
        // item was removed completely -> enqueue remove
        const productId = prevItem.id || prevItem.slug?.current;
        if (productId) {
          cartLocal.enqueueOp({ type: 'remove', productId });
          cartSync.scheduleSync();
        }
      } else if (nextItem) {
        // item still exists -> enqueue update to new quantity
        cartLocal.enqueueOp({ type: 'update', productId: nextItem.id || nextItem.slug?.current, quantity: Number(nextItem.quantity) });
        cartSync.scheduleSync();
      }
    } else if (type.endsWith('/setItemQuantity')) {
      const payload = action.payload as any;
      const productId = payload.productSlugOrId;
      const quantity = Number(payload.quantity || 0);
      if (productId) {
        cartLocal.enqueueOp({ type: 'update', productId, quantity });
        cartSync.scheduleSync();
      }
    } else if (type.endsWith('/clearCart')) {
      cartLocal.enqueueOp({ type: 'clear' });
      cartSync.scheduleSync();
    }
  } catch (e) {
    console.warn('cartMiddleware: failed to enqueue op', e);
  }

  return result;
};

export default cartMiddleware;
