import React, { useState, useEffect, useRef } from 'react';

interface SaleRecord {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod: string;
  date: string;
  receiptNo: string;
  userName: string;
  lastModified: number;
}

const SALES_KEY = 'pos_sales';

function getLocalSales(): SaleRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function Receipts() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSales(getLocalSales());
  }, []);

  const filteredSales = sales.filter(sale =>
    sale.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    sale.userName.toLowerCase().includes(search.toLowerCase()) ||
    sale.date.includes(search)
  );

  const handleReprint = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setShowReceipt(true);
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
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>Receipts</h2>
      
      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search by receipt number, cashier, or date..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', width: 400 }}
        />
      </div>

      {/* Sales List */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px #0001' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Recent Sales</h3>
        {filteredSales.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>No sales found.</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredSales.map(sale => (
              <div
                key={sale.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  marginBottom: 12,
                  background: '#f9fafb'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Receipt: {sale.receiptNo}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    {new Date(sale.date).toLocaleString()} • {sale.userName} • {sale.paymentMethod}
                  </div>
                  <div style={{ color: '#3182ce', fontWeight: 600 }}>Ksh {sale.total.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => handleReprint(sale)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#3182ce',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reprint
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={() => setShowReceipt(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <div ref={receiptRef}>
              <h2 className="center" style={{ textAlign: 'center', margin: 0 }}>RECEIPT</h2>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>{new Date(selectedSale.date).toLocaleString()}</div>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>Receipt No: {selectedSale.receiptNo}</div>
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
                  {selectedSale.items.map((item, index) => (
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
                Total: Ksh {selectedSale.total.toFixed(2)}
              </div>
              <div style={{ textAlign: 'right', marginBottom: 8 }}>
                Payment Method: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedSale.paymentMethod}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, color: '#444', fontSize: 15 }}>
                You were served by <span style={{ fontWeight: 600 }}>{selectedSale.userName}</span>
              </div>
            </div>
            <button onClick={handlePrint} style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 16 }}>Print Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
} 