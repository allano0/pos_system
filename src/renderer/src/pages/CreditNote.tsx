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

interface CreditNoteRecord {
  id: string;
  originalSaleId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  date: string;
  creditNoteNo: string;
  userName: string;
  lastModified: number;
}

const SALES_KEY = 'pos_sales';
const CREDIT_NOTES_KEY = 'pos_credit_notes';

function getLocalSales(): SaleRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
  } catch {
    return [];
  }
}

function getLocalCreditNotes(): CreditNoteRecord[] {
  try {
    return JSON.parse(localStorage.getItem(CREDIT_NOTES_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function CreditNote() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [returnItems, setReturnItems] = useState<Array<{ id: string; name: string; price: number; quantity: number; max: number }>>([]);
  const [showCreditNote, setShowCreditNote] = useState(false);
  const [creditNoteData, setCreditNoteData] = useState<CreditNoteRecord | null>(null);
  const creditNoteRef = useRef<HTMLDivElement>(null);

  // Get cashier/owner name from sessionStorage
  const userName = sessionStorage.getItem('userName') || 'User';

  useEffect(() => {
    setSales(getLocalSales());
  }, []);

  const filteredSales = sales.filter(sale =>
    sale.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
    sale.userName.toLowerCase().includes(search.toLowerCase()) ||
    sale.date.includes(search)
  );

  const handleSelectSale = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setReturnItems(sale.items.map(item => ({ ...item, max: item.quantity, quantity: 0 })));
  };

  const updateReturnQuantity = (itemId: string, quantity: number) => {
    setReturnItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity: Math.max(0, Math.min(item.max, quantity)) } : item
    ));
  };

  const totalRefund = returnItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleGenerateCreditNote = () => {
    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      alert('Select at least one item to return.');
      return;
    }
    const creditNote: CreditNoteRecord = {
      id: Date.now().toString(),
      originalSaleId: selectedSale!.id,
      items: itemsToReturn.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
      total: totalRefund,
      date: new Date().toISOString(),
      creditNoteNo: 'CN' + Date.now(),
      userName,
      lastModified: Date.now(),
    };
    // Persist credit note
    try {
      const prevNotes = getLocalCreditNotes();
      prevNotes.push(creditNote);
      localStorage.setItem(CREDIT_NOTES_KEY, JSON.stringify(prevNotes));
    } catch {}
    setCreditNoteData({ ...creditNote, date: new Date().toLocaleString() });
    setShowCreditNote(true);
  };

  const handlePrint = () => {
    if (window.api && typeof window.api.printReceiptContent === 'function') {
      if (creditNoteRef.current) {
        window.api.printReceiptContent(creditNoteRef.current.innerHTML);
      } else {
        alert('Credit note content not found.');
      }
    } else {
      alert('Direct print is not available.');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>Credit Note</h2>
      {/* Step 1: Select Sale */}
      {!selectedSale && (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Select a Sale to Return Items From</h3>
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Search by receipt number, cashier, or date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', width: 400 }}
            />
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px #0001' }}>
            <h4 style={{ marginTop: 0, marginBottom: 16 }}>Recent Sales</h4>
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
                      onClick={() => handleSelectSale(sale)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        background: '#319795',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Step 2: Select Items to Return */}
      {selectedSale && !showCreditNote && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Select Items to Return</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Item</th>
                <th style={{ textAlign: 'right' }}>Sold Qty</th>
                <th style={{ textAlign: 'right' }}>Return Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {returnItems.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'right' }}>{item.max}</td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      min={0}
                      max={item.max}
                      value={item.quantity}
                      onChange={e => updateReturnQuantity(item.id, Number(e.target.value))}
                      style={{ width: 44, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>Ksh {item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>Ksh {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>
            Total Refund: Ksh {totalRefund.toFixed(2)}
          </div>
          <button
            onClick={handleGenerateCreditNote}
            disabled={returnItems.every(item => item.quantity === 0)}
            style={{ padding: '12px 0', borderRadius: 8, background: '#319795', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', cursor: returnItems.every(item => item.quantity === 0) ? 'not-allowed' : 'pointer' }}
          >
            Generate Credit Note
          </button>
          <button
            onClick={() => setSelectedSale(null)}
            style={{ marginTop: 12, padding: '10px 0', borderRadius: 8, background: '#eee', color: '#333', border: 'none', fontWeight: 600, fontSize: 15, width: '100%' }}
          >
            Back to Sale List
          </button>
        </div>
      )}
      {/* Step 3: Show Credit Note */}
      {showCreditNote && creditNoteData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={() => { setShowCreditNote(false); setSelectedSale(null); }} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <div ref={creditNoteRef}>
              <h2 className="center" style={{ textAlign: 'center', margin: 0 }}>CREDIT NOTE</h2>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>{creditNoteData.date}</div>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>Credit Note No: {creditNoteData.creditNoteNo}</div>
              <div style={{ textAlign: 'center', marginBottom: 12, color: '#888', fontSize: 13 }}>Original Receipt: {selectedSale?.receiptNo}</div>
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
                  {creditNoteData.items.map((item, index) => (
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
                Total Refund: Ksh {creditNoteData.total.toFixed(2)}
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, color: '#444', fontSize: 15 }}>
                Processed by <span style={{ fontWeight: 600 }}>{creditNoteData.userName}</span>
              </div>
            </div>
            <button onClick={handlePrint} style={{ padding: '12px 0', borderRadius: 8, background: '#319795', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 16 }}>Print Credit Note</button>
          </div>
        </div>
      )}
    </div>
  );
} 