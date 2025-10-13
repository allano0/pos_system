import React, { useState, useEffect, useRef } from 'react';

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

interface InvoiceItem extends Product {
  quantity: number;
}

interface InvoiceRecord {
  id: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  invoiceNo: string;
  customerName: string;
  userName: string;
  lastModified: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

const PRODUCT_STORAGE_KEY = 'pos_products';
const INVOICE_STORAGE_KEY = 'pos_invoices';
const CUSTOMER_STORAGE_KEY = 'pos_customers';

function loadProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCT_STORAGE_KEY);
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
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(migratedProducts));
    }
    
    return migratedProducts;
  } catch {
    return [];
  }
}

function getLocalInvoices(): InvoiceRecord[] {
  try {
    return JSON.parse(localStorage.getItem(INVOICE_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export default function Invoice() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceRecord | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  // Get cashier/owner name from sessionStorage
  const userName = sessionStorage.getItem('userName') || 'User';

  useEffect(() => {
    setProducts(loadProducts());
    setCustomers(loadCustomers());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleGenerateInvoice = () => {
    if (!selectedCustomer) {
      alert('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      alert('Add at least one product to the invoice.');
      return;
    }
    const invoice: InvoiceRecord = {
      id: Date.now().toString(),
      items: cart,
      total,
      date: new Date().toISOString(),
      invoiceNo: 'INV' + Date.now(),
      customerName: selectedCustomer.name,
      userName,
      lastModified: Date.now(),
    };
    try {
      const prevInvoices = getLocalInvoices();
      prevInvoices.push(invoice);
      localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(prevInvoices));
    } catch {}
    setInvoiceData({ ...invoice, date: new Date().toLocaleString() });
    setShowInvoice(true);
  };

  const handlePrint = () => {
    if (window.api && typeof window.api.printReceiptContent === 'function') {
      if (invoiceRef.current) {
        window.api.printReceiptContent(invoiceRef.current.innerHTML);
      } else {
        alert('Invoice content not found.');
      }
    } else {
      alert('Direct print is not available.');
    }
  };

  const handleDownload = () => {
    if (!invoiceRef.current) return;
    const content = invoiceRef.current.innerHTML;
    const blob = new Blob([
      '<html><head><title>Invoice</title></head><body>' + content + '</body></html>'
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (invoiceData?.invoiceNo || 'invoice') + '.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={{ padding: '24px 32px 32px 32px', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>New Invoice</h2>
      {!showInvoice && (
        <>
          <div style={{ marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minWidth: 220 }}
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Product List (Left) */}
            <div style={{ flex: 2, minWidth: 320, maxWidth: 700, background: '#f7fafd', borderRadius: 14, boxShadow: '0 2px 12px #b6d0f533', padding: 18, border: '2px solid #e3eefe' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, background: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 16 }}>
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
                      border: '1.5px solid #e3eefe' 
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
                        padding: '8px 12px', 
                        borderRadius: 8, 
                        background: product.stock === 0 ? '#9ca3af' : '#3182ce', 
                        color: '#fff', 
                        border: 'none', 
                        fontWeight: 600, 
                        fontSize: 15, 
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                        width: '100%'
                      }}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', color: '#3182ce', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                <span style={{ fontWeight: 600, color: '#333', fontSize: 15 }}>Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', color: '#3182ce', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
            {/* Cart (Right) */}
            <div style={{ flex: 1, minWidth: 320, background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px #b6d0f533', padding: 18, border: '2px solid #e3eefe' }}>
              <h3 style={{ color: '#3182ce', fontWeight: 700, fontSize: 20, marginTop: 0, marginBottom: 18 }}>Invoice Items</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 18, color: '#888' }}>No items.</td></tr>
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
                      <td style={{ padding: 8 }}>Ksh {item.price.toFixed(2)}</td>
                      <td style={{ padding: 8 }}>Ksh {(item.price * item.quantity).toFixed(2)}</td>
                      <td style={{ padding: 8 }}>
                        <button onClick={() => removeFromCart(item.id)} style={{ padding: '4px 8px', borderRadius: 6, background: '#e53e3e', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>
                Total: Ksh {total.toFixed(2)}
              </div>
              <button
                onClick={handleGenerateInvoice}
                disabled={cart.length === 0 || !selectedCustomerId}
                style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', cursor: cart.length === 0 || !selectedCustomerId ? 'not-allowed' : 'pointer', opacity: cart.length === 0 || !selectedCustomerId ? 0.6 : 1 }}
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </>
      )}
      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={() => { setShowInvoice(false); setCart([]); setSelectedCustomerId(''); }} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <div ref={invoiceRef}>
              <h2 className="center" style={{ textAlign: 'center', margin: 0 }}>INVOICE</h2>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>{invoiceData.date}</div>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>Invoice No: {invoiceData.invoiceNo}</div>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>Customer: {invoiceData.customerName}</div>
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
                  {invoiceData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>Ksh {item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>Ksh {(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total" style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                Total: Ksh {invoiceData.total.toFixed(2)}
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, color: '#444', fontSize: 15 }}>
                Served by <span style={{ fontWeight: 600 }}>{invoiceData.userName}</span>
              </div>
            </div>
            <button onClick={handlePrint} style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 16 }}>Print Invoice</button>
            <button onClick={handleDownload} style={{ padding: '12px 0', borderRadius: 8, background: '#319795', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 12 }}>Download Invoice</button>
          </div>
        </div>
      )}
    </div>
  );
} 