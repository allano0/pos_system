import React, { useState, useEffect } from 'react';

const PRODUCT_STORAGE_KEY = 'pos_products';
const BRANCH_STORAGE_KEY = 'pos_branches';
const CASHIER_STORAGE_KEY = 'pos_cashiers';
const OWNER_STORAGE_KEY = 'pos_owner';
const SUPPLIER_STORAGE_KEY = 'pos_suppliers';
const SALES_STORAGE_KEY = 'pos_sales';
const INVOICE_STORAGE_KEY = 'pos_invoices';
const CREDIT_NOTE_STORAGE_KEY = 'pos_credit_notes';
// Determine backend URL based on environment
const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
const baseUrl = isDev ? 'http://localhost:5000' : 'https://SAMTECH-backend.onrender.com';
const SYNC_URL = `${baseUrl}/api/sync`;
const OWNER_URL = `${baseUrl}/api/owner`;
const DELETED_PRODUCT_KEY = 'pos_deleted_products';
const DELETED_BRANCH_KEY = 'pos_deleted_branches';
const DELETED_CASHIER_KEY = 'pos_deleted_cashiers';
const DELETED_SUPPLIER_KEY = 'pos_deleted_suppliers';

export default function DataSync() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [unsyncedProducts, setUnsyncedProducts] = useState(() => JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || '[]'));
  const [unsyncedBranches, setUnsyncedBranches] = useState(() => JSON.parse(localStorage.getItem(BRANCH_STORAGE_KEY) || '[]'));
  const [unsyncedCashiers, setUnsyncedCashiers] = useState(() => JSON.parse(localStorage.getItem(CASHIER_STORAGE_KEY) || '[]'));
  const [unsyncedSuppliers, setUnsyncedSuppliers] = useState(() => JSON.parse(localStorage.getItem(SUPPLIER_STORAGE_KEY) || '[]'));
  const [unsyncedSales, setUnsyncedSales] = useState(() => JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || '[]'));
  const [unsyncedInvoices, setUnsyncedInvoices] = useState(() => JSON.parse(localStorage.getItem(INVOICE_STORAGE_KEY) || '[]'));
  const [unsyncedCreditNotes, setUnsyncedCreditNotes] = useState(() => JSON.parse(localStorage.getItem(CREDIT_NOTE_STORAGE_KEY) || '[]'));

  // Refresh state when component mounts to reflect current localStorage data
  useEffect(() => {
    setUnsyncedProducts(JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || '[]'));
    setUnsyncedBranches(JSON.parse(localStorage.getItem(BRANCH_STORAGE_KEY) || '[]'));
    setUnsyncedCashiers(JSON.parse(localStorage.getItem(CASHIER_STORAGE_KEY) || '[]'));
    setUnsyncedSuppliers(JSON.parse(localStorage.getItem(SUPPLIER_STORAGE_KEY) || '[]'));
    setUnsyncedSales(JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || '[]'));
    setUnsyncedInvoices(JSON.parse(localStorage.getItem(INVOICE_STORAGE_KEY) || '[]'));
    setUnsyncedCreditNotes(JSON.parse(localStorage.getItem(CREDIT_NOTE_STORAGE_KEY) || '[]'));
  }, []);

  function loadDeletedProductIds() {
    try {
      return JSON.parse(localStorage.getItem(DELETED_PRODUCT_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function loadDeletedBranchIds() {
    try {
      return JSON.parse(localStorage.getItem(DELETED_BRANCH_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function loadDeletedCashierIds() {
    try {
      return JSON.parse(localStorage.getItem(DELETED_CASHIER_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function loadDeletedSupplierIds() {
    try {
      return JSON.parse(localStorage.getItem(DELETED_SUPPLIER_KEY) || '[]');
    } catch {
      return [];
    }
  }
  function clearDeletedIds() {
    localStorage.removeItem(DELETED_PRODUCT_KEY);
    localStorage.removeItem(DELETED_BRANCH_KEY);
    localStorage.removeItem(DELETED_CASHIER_KEY);
    localStorage.removeItem(DELETED_SUPPLIER_KEY);
  }

  const handleSync = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const deletedProductIds = loadDeletedProductIds();
      const deletedBranchIds = loadDeletedBranchIds();
      const deletedCashierIds = loadDeletedCashierIds();
      const deletedSupplierIds = loadDeletedSupplierIds();
      const res = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: unsyncedProducts,
          branches: unsyncedBranches,
          cashiers: unsyncedCashiers,
          suppliers: unsyncedSuppliers,
          sales: unsyncedSales,
          invoices: unsyncedInvoices,
          creditNotes: unsyncedCreditNotes,
          deletedProductIds,
          deletedBranchIds,
          deletedCashierIds,
          deletedSupplierIds,
        }),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      if (Array.isArray(data.products) && Array.isArray(data.branches) && Array.isArray(data.cashiers) && Array.isArray(data.suppliers) && Array.isArray(data.sales) && Array.isArray(data.invoices) && Array.isArray(data.creditNotes)) {
        localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(data.products));
        localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(data.branches));
        localStorage.setItem(CASHIER_STORAGE_KEY, JSON.stringify(data.cashiers));
        localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(data.suppliers));
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(data.sales));
        localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(data.invoices));
        localStorage.setItem(CREDIT_NOTE_STORAGE_KEY, JSON.stringify(data.creditNotes));
        // Fetch and persist owner
        try {
          const ownerRes = await fetch(OWNER_URL);
          if (ownerRes.ok) {
            const ownerData = await ownerRes.json();
            localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(ownerData.owner));
          }
        } catch {}
        setStatus('success');
        setMessage('Sync successful! All data has been synchronized with the cloud database.');
        setUnsyncedProducts([]);
        setUnsyncedBranches([]);
        setUnsyncedCashiers([]);
        setUnsyncedSuppliers([]);
        setUnsyncedSales([]);
        setUnsyncedInvoices([]);
        setUnsyncedCreditNotes([]);
        clearDeletedIds();
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        setMessage('Sync failed. No internet connection detected. Please check your network and try again.');
      } else {
        setMessage(`Sync failed: ${errorMessage}. Please try again.`);
      }
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h2>Data Sync</h2>
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        style={{ padding: '10px 24px', fontSize: 18, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 16 }}
      >
        {status === 'loading' ? 'Syncing...' : 'Sync All to Cloud'}
      </button>
      {message && (
        <div style={{ color: status === 'success' ? 'green' : 'red', marginTop: 12, fontWeight: 500 }}>{message}</div>
      )}
      <div style={{ color: '#888', marginTop: 24, fontSize: 14 }}>
        This will synchronize all local data (products, branches, cashiers, suppliers, sales, invoices, credit notes) with the cloud database and pull the latest updates.
      </div>
      <div style={{ 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: 8, 
        padding: 16, 
        marginTop: 16,
        fontSize: 14,
        color: '#0c4a6e'
      }}>
        <strong>💡 Offline Mode:</strong> Your POS system works completely offline! All sales, products, and data are stored locally. 
        Sync when you have internet to backup your data and get updates from other locations.
      </div>
      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 8 }}>Unsynced Products</h3>
        {unsyncedProducts.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 16 }}>No unsynced products.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Price</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {unsyncedProducts.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{p.id}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{p.name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{p.price}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{p.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 style={{ margin: '24px 0 8px 0' }}>Unsynced Branches</h3>
        {unsyncedBranches.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 16 }}>No unsynced branches.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Location</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {unsyncedBranches.map((b: any) => (
                <tr key={b.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.id}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.location}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 style={{ margin: '24px 0 8px 0' }}>Unsynced Cashiers</h3>
        {unsyncedCashiers.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 16 }}>No unsynced cashiers.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>PIN</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Branch ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {unsyncedCashiers.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.id}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.pin}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.branchId}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 style={{ margin: '24px 0 8px 0' }}>Unsynced Invoices</h3>
        {unsyncedInvoices.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 16 }}>No unsynced invoices.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Invoice No</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Customer</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Total</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {unsyncedInvoices.map((invoice: any) => (
                <tr key={invoice.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{invoice.id}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{invoice.invoiceNo}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{invoice.customerName}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>Ksh {invoice.total.toFixed(2)}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{invoice.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 style={{ margin: '24px 0 8px 0' }}>Unsynced Credit Notes</h3>
        {unsyncedCreditNotes.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 16 }}>No unsynced credit notes.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Credit Note No</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Original Receipt</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Total Refund</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {unsyncedCreditNotes.map((creditNote: any) => (
                <tr key={creditNote.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{creditNote.id}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{creditNote.creditNoteNo}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{creditNote.originalSaleId}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>Ksh {creditNote.total.toFixed(2)}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{creditNote.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 