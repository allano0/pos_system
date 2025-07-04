import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Cashier {
  id: string;
  name: string;
  pin: string;
  branchId: string;
  lastModified: number;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

const CASHIER_STORAGE_KEY = 'pos_cashiers';
const BRANCH_STORAGE_KEY = 'pos_branches';
const DELETED_CASHIER_KEY = 'pos_deleted_cashiers';

function getInitialCashiers(): Cashier[] {
  try {
    return JSON.parse(localStorage.getItem(CASHIER_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function getBranches(): Branch[] {
  try {
    return JSON.parse(localStorage.getItem(BRANCH_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadDeletedCashierIds(): string[] {
  try {
    const data = localStorage.getItem(DELETED_CASHIER_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDeletedCashierIds(ids: string[]) {
  localStorage.setItem(DELETED_CASHIER_KEY, JSON.stringify(ids));
}

const emptyCashier: Omit<Cashier, 'id' | 'lastModified'> = {
  name: '',
  pin: '',
  branchId: '',
};

export default function Cashiers() {
  const [cashiers, setCashiers] = useState<Cashier[]>(getInitialCashiers());
  const [branches, setBranches] = useState<Branch[]>(getBranches());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({ ...emptyCashier });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Search/filter state
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [filteredCashiers, setFilteredCashiers] = useState<Cashier[]>(cashiers);
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const [dbResults, setDbResults] = useState<Cashier[] | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role === 'cashier') {
      navigate('/cashier-dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    setBranches(getBranches());
  }, []);

  useEffect(() => {
    let filtered = cashiers;
    if (search.trim()) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    if (branchFilter) {
      filtered = filtered.filter(c => c.branchId === branchFilter);
    }
    setFilteredCashiers(filtered);
    setPage(1); // Reset to first page on filter/search change
  }, [search, branchFilter, cashiers]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCashiers.length / PAGE_SIZE) || 1;
  const paginated = filteredCashiers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  const openAddModal = () => {
    setForm({ ...emptyCashier });
    setModalMode('add');
    setEditId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (cashier: Cashier) => {
    setForm({ name: cashier.name, pin: cashier.pin, branchId: cashier.branchId });
    setModalMode('edit');
    setEditId(cashier.id);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'pin' ? value.replace(/[^0-9]/g, '') : value }));
  };

  const saveCashiers = (cashiers: Cashier[]) => {
    setCashiers(cashiers);
    localStorage.setItem(CASHIER_STORAGE_KEY, JSON.stringify(cashiers));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^\d{4}$/.test(form.pin) || !form.branchId) {
      setError('Please enter a name, a 4-digit PIN, and select a branch.');
      return;
    }
    if (modalMode === 'add') {
      const newCashier: Cashier = {
        ...form,
        id: Date.now().toString(),
        lastModified: Date.now(),
      };
      const updated = [...cashiers, newCashier];
      saveCashiers(updated);
    } else if (modalMode === 'edit' && editId) {
      const updated = cashiers.map(c =>
        c.id === editId ? { ...c, ...form, lastModified: Date.now() } : c
      );
      saveCashiers(updated);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    const updated = cashiers.filter(c => c.id !== id);
    saveCashiers(updated);
    // Track deleted ID
    const deletedIds = loadDeletedCashierIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedCashierIds(deletedIds);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is handled by useEffect
  };

  const handleDbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);
    setDbError('');
    setDbResults(null);
    try {
      const res = await fetch('http://localhost:5000/api/cashiers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: search.trim(), branchId: branchFilter }),
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      setDbResults(data.cashiers || []);
    } catch (err) {
      setDbError('Failed to search database.');
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Cashiers</h2>
        <button
          onClick={openAddModal}
          style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Cashier
        </button>
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
        <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minWidth: 160 }}
        >
          <option value="">All Branches</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>{branch.name} ({branch.location})</option>
          ))}
        </select>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead style={{ background: '#e3eefe' }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>PIN</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Branch</th>
                </tr>
              </thead>
              <tbody>
                {dbResults.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No results found in database.</td></tr>
                ) : dbResults.map(cashier => {
                  const branch = branches.find(b => b.id === cashier.branchId);
                  return (
                    <tr key={cashier.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: 10 }}>{cashier.name}</td>
                      <td style={{ padding: 10 }}>{cashier.pin}</td>
                      <td style={{ padding: 10 }}>{branch ? `${branch.name} (${branch.location})` : cashier.branchId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead style={{ background: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 10, textAlign: 'left' }}>PIN</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Branch</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No cashiers found.</td></tr>
            ) : paginated.map(cashier => {
              const branch = branches.find(b => b.id === cashier.branchId);
              return (
                <tr key={cashier.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 10 }}>{cashier.name}</td>
                  <td style={{ padding: 10 }}>{cashier.pin}</td>
                  <td style={{ padding: 10 }}>{branch ? `${branch.name} (${branch.location})` : 'N/A'}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <button onClick={() => openEditModal(cashier)} style={{ color: '#fff', background: '#3182ce', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                    <button onClick={() => handleDelete(cashier.id)} style={{ color: '#fff', background: '#e53e3e', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              );
            })}
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
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 320, maxWidth: 400, width: '100%', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>{modalMode === 'add' ? 'Add Cashier' : 'Edit Cashier'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Cashier Name"
                  value={form.name}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10 }}
                />
                <input
                  type="text"
                  name="pin"
                  placeholder="4-digit PIN"
                  value={form.pin}
                  maxLength={4}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10 }}
                />
                <select
                  name="branchId"
                  value={form.branchId}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10 }}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.location})
                    </option>
                  ))}
                </select>
              </div>
              {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
              <button type="submit" style={{ width: '100%', padding: '10px 0', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600 }}>
                {modalMode === 'add' ? 'Add Cashier' : 'Update Cashier'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 