import React, { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const STORAGE_KEY = 'pos_products';

function loadProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

interface CartItem extends Product {
  quantity: number;
}

// Add type for window.api
declare global {
  interface Window {
    api?: {
      printReceipt: () => Promise<any>;
      listPrinters: () => Promise<any>;
      printReceiptContent: (content: string) => Promise<any>;
    };
  }
}

export default function Sale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | ''>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 8;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Get cashier/owner name from sessionStorage
  const userName = sessionStorage.getItem('userName') || 'User';

  // Filtered and paginated products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    setModalOpen(true);
    setPaymentMethod('');
  };

  const handlePayment = () => {
    // Generate receipt data
    setReceiptData({
      items: cart,
      total,
      paymentMethod,
      date: new Date().toLocaleString(),
      receiptNo: 'R' + Date.now(),
    });
    setShowReceipt(true);
    setModalOpen(false);
    setCart([]);
  };

  const handlePrint = () => {
    if (window.api && typeof window.api.printReceiptContent === 'function') {
      if (receiptRef.current) {
        window.api.printReceiptContent(receiptRef.current.innerHTML);
      } else {
        alert('Receipt content not found.');
      }
    } else {
      alert('Direct print is not available.');
    }
  };

  return (
    <div style={{ padding: '24px 32px 32px 32px', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Sale</h2>
      {/* Main Flex Layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 32,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Product List (Left) */}
        <div style={{
          flex: 2,
          minWidth: 320,
          maxWidth: 700,
          background: '#f7fafd',
          borderRadius: 14,
          boxShadow: '0 2px 12px #b6d0f533',
          padding: 18,
          border: '2px solid #e3eefe',
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3182ce', fontWeight: 700, fontSize: 22, marginTop: 0, marginBottom: 18 }}>
            <span role="img" aria-label="products">🛒</span> Products
          </h3>
          {/* Search bar */}
          <div style={{ marginBottom: 18, display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minWidth: 180, flex: 1 }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 20,
              background: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              marginBottom: 16,
            }}
          >
            {paginatedProducts.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#888', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
                No products found.
              </div>
            ) : paginatedProducts.map(product => (
              <div
                key={product.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px #0001',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 10,
                  minHeight: 140,
                  position: 'relative',
                  border: '1.5px solid #e3eefe',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18, color: '#223', marginBottom: 2 }}>{product.name}</div>
                <div style={{ color: '#3182ce', fontWeight: 600, fontSize: 16 }}>Ksh {product.price.toFixed(2)}</div>
                <div style={{ color: '#888', fontSize: 14 }}>Stock: {product.stock}</div>
                <button
                  onClick={() => addToCart(product)}
                  style={{
                    marginTop: 'auto',
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: '#3182ce',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px #0001',
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setPage(page - 1)} disabled={page === 1} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: page === 1 ? '#f5f7fa' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{'<'}</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} onClick={() => setPage(i+1)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', background: page === i+1 ? '#3182ce' : '#fff', color: page === i+1 ? '#fff' : '#222', fontWeight: page === i+1 ? 700 : 400, cursor: 'pointer' }}>{i+1}</button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: page === totalPages ? '#f5f7fa' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{'>'}</button>
          </div>
        </div>
        {/* Cart (Right) */}
        <div style={{
          flex: 1,
          minWidth: 300,
          maxWidth: 400,
          height: '70vh',
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 24px #3182ce22',
          padding: 28,
          position: 'sticky',
          top: 32,
          border: '2.5px solid #3182ce',
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3182ce', fontWeight: 700, fontSize: 22, marginTop: 0, marginBottom: 18 }}>
            <span role="img" aria-label="cart">🛍️</span> Cart
          </h3>
          <div style={{ marginBottom: 16, maxHeight: 340, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f5f7fa' }}>
                <tr>
                  <th style={{ padding: 8, fontSize: 15 }}>Name</th>
                  <th style={{ padding: 8, fontSize: 15 }}>Qty</th>
                  <th style={{ padding: 8, fontSize: 15 }}>Subtotal</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 18, color: '#888' }}>Cart is empty.</td></tr>
                ) : cart.map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: 8 }}>{item.name}</td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.quantity}
                        onChange={e => updateQuantity(item.id, Number(e.target.value))}
                        style={{ width: 44, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                      />
                    </td>
                    <td style={{ padding: 8 }}>Ksh {(item.price * item.quantity).toFixed(2)}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ padding: '4px 8px', borderRadius: 6, background: '#e53e3e', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>
            Total: Ksh {total.toFixed(2)}
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Checkout
          </button>
        </div>
      </div>
      {/* Payment Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 320, maxWidth: 400, width: '100%', position: 'relative' }}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>Select Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                Cash
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={() => setPaymentMethod('mpesa')} />
                Mpesa
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                Card
              </label>
            </div>
            <button
              onClick={handlePayment}
              disabled={!paymentMethod}
              style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 24, cursor: paymentMethod ? 'pointer' : 'not-allowed' }}
            >
              Pay & Generate Receipt
            </button>
          </div>
        </div>
      )}
      {/* Receipt */}
      {showReceipt && receiptData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={() => setShowReceipt(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <div ref={receiptRef}>
              <h2 className="center" style={{ textAlign: 'center', margin: 0 }}>RECEIPT</h2>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>{receiptData.date}</div>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>Receipt No: {receiptData.receiptNo}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item: CartItem) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>Ksh {item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>Ksh {(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total" style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                Total: Ksh {receiptData.total.toFixed(2)}
              </div>
              <div style={{ textAlign: 'right', marginBottom: 8 }}>
                Payment Method: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{receiptData.paymentMethod}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, color: '#444', fontSize: 15 }}>
                You were served by <span style={{ fontWeight: 600 }}>{userName}</span>
              </div>
            </div>
            <button onClick={handlePrint} style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 16 }}>Print Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
} 