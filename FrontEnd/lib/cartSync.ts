import cartLocal from './cartLocal';
import * as cartApi from '../store/cart-api';
// Nota: não importamos tipos do cartLocal aqui para evitar dependências circulares de runtime

let syncTimer: any = null;
let inactivityTimer: any = null;
const SYNC_DEBOUNCE_MS = 3000; // aguarda X ms após última alteração
const INACTIVITY_MS = 1000 * 60 * 5; // 5 minutos

async function syncNowIfAuthenticated(getAuthToken: () => string | null) {
  const token = getAuthToken();
  if (!token) return { ok: false, reason: 'not-authenticated' };
  return syncNow();
}

async function syncNow() {
  try {
    const ops = cartLocal.peekOps();
    if (!ops || ops.length === 0) {
      return { ok: true, synced: 0 };
    }

    // buscar estado atual do servidor
    const serverResp = await cartApi.fetchCart();
    const serverData = serverResp.data || { items: [] };
    const serverItems: Record<string, any> = {};
    (serverData.items || []).forEach((it: any) => {
      const pid = it.id || (it.slug && it.slug.current) || null;
      if (pid) serverItems[pid] = it;
    });

    // Replayed state starts from server state
    const merged: Record<string, { quantity: number; unitPrice?: number }> = {};
    Object.keys(serverItems).forEach((pid) => {
      merged[pid] = { quantity: serverItems[pid].quantity || 0, unitPrice: serverItems[pid].price || serverItems[pid].unitPrice || 0 };
    });

    // Apply local ops in order
    ops.forEach((op: any) => {
      if (op.type === 'clear') {
        Object.keys(merged).forEach((k) => delete merged[k]);
      } else if (op.type === 'add') {
        const cur = merged[op.productId] || { quantity: 0, unitPrice: op.unitPrice };
        merged[op.productId] = { quantity: cur.quantity + Number(op.quantity), unitPrice: cur.unitPrice ?? op.unitPrice };
      } else if (op.type === 'update') {
        merged[op.productId] = { quantity: Number(op.quantity), unitPrice: merged[op.productId]?.unitPrice };
      } else if (op.type === 'remove') {
        delete merged[op.productId];
      }
    });

    // Compute diffs between serverItems and merged state and perform minimal API calls
    const syncPromises: Promise<any>[] = [];
    Object.keys(merged).forEach((pid) => {
      const target = merged[pid];
      const server = serverItems[pid];
      if (!server) {
        // add
        syncPromises.push(cartApi.addToCart(pid, target.quantity));
      } else if ((server.quantity || 0) !== target.quantity) {
        // update — server has cartItemId
        const cartItemId = server.cartItemId || server.id;
        if (cartItemId) syncPromises.push(cartApi.updateCartItem(cartItemId, target.quantity));
        else syncPromises.push(cartApi.addToCart(pid, target.quantity));
      }
    });

    // removals: items present on server but not in merged
    Object.keys(serverItems).forEach((pid) => {
      if (!merged[pid]) {
        const server = serverItems[pid];
        const cartItemId = server.cartItemId || server.id;
        if (cartItemId) syncPromises.push(cartApi.removeCartItem(cartItemId));
      }
    });

    const results = await Promise.allSettled(syncPromises);
    const successCount = results.filter((r) => r.status === 'fulfilled').length;

    if (successCount > 0) {
      cartLocal.clearOps();
      cartLocal.setLastSync(Date.now());
    }

    // refresh local state from server
    try { await cartApi.fetchCart(); } catch (e) {}

    return { ok: true, synced: successCount };
  } catch (e) {
    console.error('cartSync.syncNow error', e);
    return { ok: false, error: e };
  }
}

function scheduleSync(delay = SYNC_DEBOUNCE_MS) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { syncNow().catch(()=>{}); }, delay);

  // reset inactivity timer
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => { syncNow().catch(()=>{}); }, INACTIVITY_MS);
}

function cancelScheduledSync() {
  if (syncTimer) clearTimeout(syncTimer);
  if (inactivityTimer) clearTimeout(inactivityTimer);
}

export default {
  syncNow,
  syncNowIfAuthenticated,
  scheduleSync,
  cancelScheduledSync,
};
