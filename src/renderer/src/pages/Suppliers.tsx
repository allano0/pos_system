import React, { useState, useEffect } from 'react';

interface Supplier {
  id: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  category: string;
}

const STORAGE_KEY = 'pos_suppliers';
const PAGE_SIZE = 5;
const DELETED_SUPPLIER_KEY = 'pos_deleted_suppliers';

function loadSuppliers(): Supplier[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSuppliers(suppliers: Supplier[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
}

function loadDeletedSupplierIds(): string[] {
  try {
    const data = localStorage.getItem(DELETED_SUPPLIER_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDeletedSupplierIds(ids: string[]) {
  localStorage.setItem(DELETED_SUPPLIER_KEY, JSON.stringify(ids));
}

const emptySupplier: Omit<Supplier, 'id'> = {
  name: '',
  location: '',
  phone: '',
  email: '',
  category: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({ ...emptySupplier });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [dbResults, setDbResults] = useState<Supplier[] | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [dbPage, setDbPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSuppliers(loadSuppliers());
  }, []);

  // Refresh data when localStorage changes (e.g., after sync)
  useEffect(() => {
    const handleStorageChange = () => {
      setSuppliers(loadSuppliers());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    let filtered = suppliers;
    if (search.trim()) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    if (categoryFilter) {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }
    setFilteredSuppliers(filtered);
    setPage(1);
  }, [search, categoryFilter, suppliers]);

  const openAddModal = () => {
    setForm({ ...emptySupplier });
    setModalMode('add');
    setEditId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setForm({
      name: supplier.name,
      location: supplier.location,
      phone: supplier.phone,
      email: supplier.email,
      category: supplier.category,
    });
    setModalMode('edit');
    setEditId(supplier.id);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.phone.trim() || !form.email.trim() || !form.category.trim()) {
      setError('Please fill all fields.');
      return;
    }
    if (modalMode === 'add') {
      const newSupplier: Supplier = {
        ...form,
        id: Date.now().toString(),
      };
      const updated = [...suppliers, newSupplier];
      setSuppliers(updated);
      saveSuppliers(updated);
    } else if (modalMode === 'edit' && editId) {
      const updated = suppliers.map(s =>
        s.id === editId ? { ...s, ...form } : s
      );
      setSuppliers(updated);
      saveSuppliers(updated);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveSuppliers(updated);
    // Track deleted ID
    const deletedIds = loadDeletedSupplierIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedSupplierIds(deletedIds);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Determine backend URL based on environment
      const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      const baseUrl = isDev ? 'http://localhost:5000' : 'https://supermax-backend.onrender.com';
      
      // Fetch fresh data from server
      const suppliersRes = await fetch(`${baseUrl}/api/suppliers`);
      
      if (suppliersRes.ok) {
        const suppliers = await suppliersRes.json();
        
        // Update localStorage and state
        localStorage.setItem('pos_suppliers', JSON.stringify(suppliers));
        setSuppliers(suppliers);
        
        // Show success feedback
        console.log('Suppliers refreshed successfully!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
      } else {
        throw new Error('Failed to fetch fresh data');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      // Fallback to localStorage refresh
      setSuppliers(loadSuppliers());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / PAGE_SIZE) || 1;
  const paginated = filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  // Database pagination
  const dbTotalPages = dbResults ? Math.ceil(dbResults.length / PAGE_SIZE) || 1 : 1;
  const dbPaginated = dbResults ? dbResults.slice((dbPage - 1) * PAGE_SIZE, dbPage * PAGE_SIZE) : [];
  const goToDbPage = (p: number) => setDbPage(Math.max(1, Math.min(dbTotalPages, p)));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is handled by useEffect
  };

  const handleDbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);
    setDbError('');
    setDbResults(null);
    setDbPage(1);
    try {
      const res = await fetch('http://localhost:5000/api/suppliers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: search.trim(), category: categoryFilter }),
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      setDbResults(data.suppliers || []);
    } catch (err) {
      setDbError('Failed to search database.');
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      
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
          Suppliers synced successfully!
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Suppliers</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              borderRadius: 12,
              background: isRefreshing ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            <span
              style={{
                display: 'inline-block',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                fontSize: '18px'
              }}
            >
              {isRefreshing ? '⚡' : '🔄'}
            </span>
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button
            onClick={openAddModal}
            style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            + Add Supplier
          </button>
        </div>
      </div>
      {/* Search and filter bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
        />
        <input
          type="text"
          placeholder="Category filter..."
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minWidth: 140 }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: 16, borderRadius: 8, background: '#22223b', color: '#fff', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px #0002', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="search">🔍</span> Search
        </button>
        <button type="button" onClick={handleDbSearch} style={{ padding: '10px 20px', fontSize: 16, borderRadius: 8, background: '#4f8cff', color: '#fff', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px #0002', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="cloud">☁️</span> Search from Database
        </button>
      </form>
      {/* Database Results */}
      {dbLoading && <div style={{ margin: '16px 0', color: '#3182ce', fontWeight: 500 }}>Searching database...</div>}
      {dbError && <div style={{ margin: '16px 0', color: 'red', fontWeight: 500 }}>{dbError}</div>}
      {dbResults && (
        <div style={{ margin: '32px 0' }}>
          <h3 style={{ marginBottom: 8 }}>Database Results</h3>
          <div style={{ overflowX: 'auto', background: '#f8faff', borderRadius: 8, boxShadow: '0 2px 8px #0001', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead style={{ background: '#e3eefe' }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Location</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {dbPaginated.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No results found in database.</td></tr>
                ) : dbPaginated.map(supplier => (
                  <tr key={supplier.id || (supplier as any)._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 10 }}>{supplier.name}</td>
                    <td style={{ padding: 10 }}>{supplier.location}</td>
                    <td style={{ padding: 10 }}>{supplier.phone}</td>
                    <td style={{ padding: 10 }}>{supplier.email}</td>
                    <td style={{ padding: 10 }}>{supplier.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* DB Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={() => goToDbPage(dbPage - 1)} disabled={dbPage === 1} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: dbPage === 1 ? '#f5f7fa' : '#fff', cursor: dbPage === 1 ? 'not-allowed' : 'pointer' }}>{'<'}</button>
            {Array.from({ length: dbTotalPages }, (_, i) => (
              <button key={i+1} onClick={() => goToDbPage(i+1)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', background: dbPage === i+1 ? '#3182ce' : '#fff', color: dbPage === i+1 ? '#fff' : '#222', fontWeight: dbPage === i+1 ? 700 : 400, cursor: 'pointer' }}>{i+1}</button>
            ))}
            <button onClick={() => goToDbPage(dbPage + 1)} disabled={dbPage === dbTotalPages} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: dbPage === dbTotalPages ? '#f5f7fa' : '#fff', cursor: dbPage === dbTotalPages ? 'not-allowed' : 'pointer' }}>{'>'}</button>
          </div>
        </div>
      )}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead style={{ background: '#f5f7fa' }}>
            <tr>
              <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Location</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Phone</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Email</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Category</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No suppliers yet.</td></tr>
            ) : paginated.map(supplier => (
              <tr key={supplier.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 10 }}>{supplier.name}</td>
                <td style={{ padding: 10 }}>{supplier.location}</td>
                <td style={{ padding: 10 }}>{supplier.phone}</td>
                <td style={{ padding: 10 }}>{supplier.email}</td>
                <td style={{ padding: 10 }}>{supplier.category}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <button onClick={() => openEditModal(supplier)} style={{ color: '#fff', background: '#3182ce', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                  <button onClick={() => handleDelete(supplier.id)} style={{ color: '#fff', background: '#e53e3e', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button onClick={() => goToPage(page - 1)} disabled={page === 1} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: page === 1 ? '#f5f7fa' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{'<'}</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i+1} onClick={() => goToPage(i+1)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', background: page === i+1 ? '#3182ce' : '#fff', color: page === i+1 ? '#fff' : '#222', fontWeight: page === i+1 ? 700 : 400, cursor: 'pointer' }}>{i+1}</button>
        ))}
        <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: page === totalPages ? '#f5f7fa' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{'>'}</button>
      </div>
      {/* Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>{modalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                rowGap: 16,
                columnGap: 16,
                marginBottom: 8,
              }}>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Name
                  <input name="name" placeholder="Name" value={form.name} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Location
                  <input name="location" placeholder="Location" value={form.location} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Phone Number
                  <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Email Address
                  <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Category
                  <input name="category" placeholder="Category" value={form.category} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
              </div>
              <button type="submit" style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 8 }}>{modalMode === 'add' ? 'Add Supplier' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 