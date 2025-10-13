import React, { useState, useEffect, useRef } from 'react';
import hero from '../assets/hero.png';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  supplier: string;
  lastModified: number;
  modifiedBy?: string;
}

const STORAGE_KEY = 'pos_products';

function loadProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const products = data ? JSON.parse(data) : [];
    
    // Migrate existing products to include new fields
    const migratedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category || 'General',
      description: product.description || 'No description available',
      price: product.price,
      stock: product.stock,
      supplier: product.supplier || 'Unknown',
      lastModified: product.lastModified || Date.now(),
      modifiedBy: product.modifiedBy || 'System'
    }));
    
    // Save migrated products back to localStorage if migration occurred
    const needsMigration = products.some((product: any) => !product.category || !product.description);
    if (needsMigration && migratedProducts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedProducts));
    }
    
    return migratedProducts;
  } catch {
    return [];
  }
}

interface CartItem extends Product {
  quantity: number;
}

export default function Sale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | ''>('');
  const [mpesaPaymentTime, setMpesaPaymentTime] = useState('');
  const [mpesaRefNumber, setMpesaRefNumber] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
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

  // Convert logo to base64 for printing
  const convertImageToBase64 = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      };
      img.onerror = () => resolve(''); // Fallback to empty string if error
      img.src = imageSrc;
    });
  };

  useEffect(() => {
    setProducts(loadProducts());
    // Convert logo to base64 when component mounts
    convertImageToBase64(hero).then(setLogoBase64);
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
    setMpesaPaymentTime('');
    setMpesaRefNumber('');
  };

  const handlePayment = () => {
    // Validation for M-Pesa fields
    if (paymentMethod === 'mpesa') {
      if (!mpesaPaymentTime.trim()) {
        alert('Please enter the payment time for M-Pesa transaction.');
        return;
      }
      if (!mpesaRefNumber.trim()) {
        alert('Please enter the reference number for M-Pesa transaction.');
        return;
      }
    }

    // Generate receipt data
    const saleRecord = {
      id: Date.now().toString(),
      items: cart,
      total,
      paymentMethod,
      date: new Date().toISOString(),
      receiptNo: 'R' + Date.now(),
      userName,
      lastModified: Date.now(),
      // M-Pesa specific fields
      ...(paymentMethod === 'mpesa' && {
        mpesaPaymentTime: mpesaPaymentTime.trim(),
        mpesaRefNumber: mpesaRefNumber.trim().toUpperCase()
      })
    };
    // Persist sale to localStorage
    try {
      const salesKey = 'pos_sales';
      const prevSales = JSON.parse(localStorage.getItem(salesKey) || '[]');
      prevSales.push(saleRecord);
      localStorage.setItem(salesKey, JSON.stringify(prevSales));
    } catch {}
    setReceiptData({
      ...saleRecord,
      date: new Date().toLocaleString(), // for display
    });
    setShowReceipt(true);
    setModalOpen(false);
    setCart([]);
  };

  const handlePrint = () => {
    if (window.api && typeof window.api.printReceiptContent === 'function') {
      if (receiptRef.current) {
        console.log('Sale receipt HTML content:', receiptRef.current.innerHTML);
        console.log('Logo base64 length:', logoBase64.length);
        window.api.printReceiptContent(receiptRef.current.innerHTML);
        // Show success toast and close modal
        setShowSuccess(true);
        setShowReceipt(false);
        // Auto-hide toast after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
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
      
      {/* Success Notification */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          Receipt printed successfully!
        </div>
      )}
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
                  gap: 8,
                  minHeight: 200,
                  position: 'relative',
                  border: '1.5px solid #e3eefe',
                }}
              >
                {/* Product Name */}
                <div style={{ fontWeight: 700, fontSize: 18, color: '#223', marginBottom: 2, lineHeight: 1.2 }}>
                  {product.name}
                </div>
                
                {/* Category */}
                {product.category && (
                  <div style={{ 
                    background: '#f0f9ff', 
                    color: '#0369a1', 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    fontSize: 12, 
                    fontWeight: 600,
                    marginBottom: 4
                  }}>
                    {product.category}
                  </div>
                )}
                
                {/* Description */}
                {product.description && (
                  <div style={{ 
                    color: '#666', 
                    fontSize: 13, 
                    lineHeight: 1.3,
                    marginBottom: 6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {product.description}
                  </div>
                )}
                
                {/* Price */}
                <div style={{ color: '#3182ce', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  Ksh {product.price.toFixed(2)}
                </div>
                
                {/* Stock */}
                <div style={{ 
                  color: product.stock > 10 ? '#059669' : product.stock > 0 ? '#d97706' : '#dc2626', 
                  fontSize: 14, 
                  fontWeight: 600,
                  marginBottom: 4
                }}>
                  Stock: {product.stock}
                </div>
                
                {/* Supplier */}
                {product.supplier && (
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
                    Supplier: {product.supplier}
                  </div>
                )}
                
                {/* Last Modified Info */}
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: 11, 
                  marginTop: 'auto',
                  paddingTop: 8,
                  borderTop: '1px solid #f3f4f6',
                  width: '100%'
                }}>
                  <div>Modified: {new Date(product.lastModified).toLocaleDateString()}</div>
                  {product.modifiedBy && (
                    <div>By: {product.modifiedBy}</div>
                  )}
                </div>
                
                {/* Add Button */}
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  style={{
                    marginTop: 8,
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: product.stock === 0 ? '#9ca3af' : '#3182ce',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 4px #0001',
                    width: '100%'
                  }}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add'}
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
              
              {/* M-Pesa specific fields */}
              {paymentMethod === 'mpesa' && (
                <div style={{ marginTop: 16, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #0ea5e9' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#0369a1', fontSize: '14px', fontWeight: 600 }}>M-Pesa Transaction Details</h4>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                      Payment Time:
                    </label>
                    <input
                      type="time"
                      value={mpesaPaymentTime}
                      onChange={(e) => setMpesaPaymentTime(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        border: '1px solid #d1d5db', 
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                      Reference Number:
                    </label>
                    <input
                      type="text"
                      value={mpesaRefNumber}
                      onChange={(e) => setMpesaRefNumber(e.target.value.toUpperCase())}
                      placeholder="e.g., QG123ABC456"
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        border: '1px solid #d1d5db', 
                        fontSize: '14px',
                        outline: 'none',
                        textTransform: 'uppercase'
                      }}
                      required
                    />
                  </div>
                </div>
              )}
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
              {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h2 style={{ 
                  textAlign: 'center', 
                  margin: '0 0 8px 0', 
                  fontSize: '24px', 
                  fontWeight: 700,
                  color: '#3182ce'
                }}>
                  SAMTECH COMPUTERS
                </h2>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 8, 
                  color: '#666', 
                  fontSize: 12,
                  borderBottom: '2px solid #3182ce',
                  paddingBottom: 8
                }}>
                  Opposite Family Bank, Thika, Kenya
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 8, 
                  color: '#666', 
                  fontSize: 11
                }}>
                  Tel: 0712 345 678 | Email: info@samtech.co.ke
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 12, 
                  color: '#888', 
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  RECEIPT
                </div>
              </div>

              {/* Receipt Details */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 4, color: '#666', fontSize: 12 }}>
                  Date: {receiptData.date}
                </div>
                <div style={{ textAlign: 'center', marginBottom: 8, color: '#666', fontSize: 12 }}>
                  Receipt No: {receiptData.receiptNo}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginBottom: 12,
                border: '1px solid #3182ce'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '8px',
                      borderBottom: '2px solid #3182ce',
                      borderRight: '1px solid #3182ce',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#3182ce'
                    }}>
                      Item
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '8px',
                      borderBottom: '2px solid #3182ce',
                      borderRight: '1px solid #3182ce',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#3182ce'
                    }}>
                      Qty
                    </th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '8px',
                      borderBottom: '2px solid #3182ce',
                      borderRight: '1px solid #3182ce',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#3182ce'
                    }}>
                      Price
                    </th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '8px',
                      borderBottom: '2px solid #3182ce',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#3182ce'
                    }}>
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item: CartItem, index: number) => (
                    <tr key={item.id} style={{ 
                      background: index % 2 === 0 ? '#f8fafc' : 'white'
                    }}>
                      <td style={{ 
                        padding: '8px',
                        borderBottom: '1px solid #3182ce',
                        borderRight: '1px solid #3182ce',
                        fontSize: 11
                      }}>
                        {item.name}
                      </td>
                      <td style={{ 
                        textAlign: 'center', 
                        padding: '8px',
                        borderBottom: '1px solid #3182ce',
                        borderRight: '1px solid #3182ce',
                        fontSize: 11
                      }}>
                        {item.quantity}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '8px',
                        borderBottom: '1px solid #3182ce',
                        borderRight: '1px solid #3182ce',
                        fontSize: 11
                      }}>
                        Ksh {item.price.toFixed(2)}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '8px',
                        borderBottom: '1px solid #3182ce',
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        Ksh {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{ 
                textAlign: 'right', 
                fontWeight: 700, 
                fontSize: 16, 
                marginBottom: 8,
                color: '#3182ce',
                borderTop: '2px solid #3182ce',
                paddingTop: 8
              }}>
                Total: Ksh {receiptData.total.toFixed(2)}
              </div>

              {/* Payment Method */}
              <div style={{ 
                textAlign: 'right', 
                marginBottom: 8,
                fontSize: 12,
                color: '#666'
              }}>
                Payment Method: <span style={{ 
                  fontWeight: 600, 
                  textTransform: 'capitalize',
                  color: '#3182ce'
                }}>
                  {receiptData.paymentMethod}
                </span>
              </div>

              {/* M-Pesa Details */}
              {receiptData.paymentMethod === 'mpesa' && receiptData.mpesaPaymentTime && receiptData.mpesaRefNumber && (
                <div style={{ marginBottom: 8, fontSize: 11 }}>
                  <div style={{ textAlign: 'right', marginBottom: 2, color: '#666' }}>
                    M-Pesa Time: <span style={{ fontWeight: 600, color: '#3182ce' }}>{receiptData.mpesaPaymentTime}</span>
                  </div>
                  <div style={{ textAlign: 'right', color: '#666' }}>
                    M-Pesa Ref: <span style={{ fontWeight: 600, color: '#3182ce' }}>{receiptData.mpesaRefNumber}</span>
                  </div>
                </div>
              )}

              {/* Served By */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: 12, 
                marginBottom: 8,
                color: '#666', 
                fontSize: 12,
                borderTop: '1px solid #3182ce',
                paddingTop: 8
              }}>
                Served by: <span style={{ fontWeight: 600, color: '#3182ce' }}>{userName}</span>
              </div>

              {/* Return Policy */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: 8,
                color: '#e53e3e', 
                fontSize: 10,
                fontWeight: 600,
                borderTop: '1px solid #e53e3e',
                paddingTop: 6
              }}>
                ⚠️ Goods once sold cannot be returned
              </div>
            </div>
            <button onClick={handlePrint} style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 16 }}>Print Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
} 