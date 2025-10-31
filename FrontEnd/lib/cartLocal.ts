// Gerencia o armazenamento local do carrinho e a fila de operações (oplog)
type CartOp =
  | { type: 'add'; productId: string; quantity: number; unitPrice?: number }
  | { type: 'update'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' };

const CART_KEY = 'cart';
const CART_OPS_KEY = 'cart_ops';
const CART_LAST_SYNC = 'cart_last_sync';

export function readLocalCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('cartLocal.readLocalCart error', e);
    return null;
  }
}

export function writeLocalCart(cart: any) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn('cartLocal.writeLocalCart error', e);
  }
}

export function enqueueOp(op: CartOp) {
  try {
    const raw = localStorage.getItem(CART_OPS_KEY);
    const ops: CartOp[] = raw ? JSON.parse(raw) : [];
    ops.push(op);
    localStorage.setItem(CART_OPS_KEY, JSON.stringify(ops));
  } catch (e) {
    console.warn('cartLocal.enqueueOp error', e);
  }
}

export function drainOps(): CartOp[] {
  try {
    const raw = localStorage.getItem(CART_OPS_KEY);
    const ops: CartOp[] = raw ? JSON.parse(raw) : [];
    localStorage.removeItem(CART_OPS_KEY);
    return ops;
  } catch (e) {
    console.warn('cartLocal.drainOps error', e);
    return [];
  }
}

export function peekOps(): CartOp[] {
  try {
    const raw = localStorage.getItem(CART_OPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('cartLocal.peekOps error', e);
    return [];
  }
}

export function clearOps() {
  try {
    localStorage.removeItem(CART_OPS_KEY);
  } catch (e) {}
}

export function setLastSync(ts: number) {
  try { localStorage.setItem(CART_LAST_SYNC, String(ts)); } catch (e) {}
}

export function getLastSync(): number | null {
  try {
    const v = localStorage.getItem(CART_LAST_SYNC);
    return v ? Number(v) : null;
  } catch (e) {
    return null;
  }
}

export default {
  readLocalCart,
  writeLocalCart,
  enqueueOp,
  drainOps,
  peekOps,
  clearOps,
  setLastSync,
  getLastSync,
};
