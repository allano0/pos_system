import React, { useState, useEffect } from 'react';

interface Branch {
  id: string;
  name: string;
  location: string;
}

const STORAGE_KEY = 'pos_branches';
const PAGE_SIZE = 5;
const DELETED_BRANCH_KEY = 'pos_deleted_branches';

function getInitialBranches(): Branch[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadDeletedBranchIds(): string[] {
  try {
    const data = localStorage.getItem(DELETED_BRANCH_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDeletedBranchIds(ids: string[]) {
  localStorage.setItem(DELETED_BRANCH_KEY, JSON.stringify(ids));
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>(getInitialBranches());
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  // Search/filter state
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>(branches);
  const [page, setPage] = useState(1);
  // Database search state
  const [dbResults, setDbResults] = useState<Branch[] | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [dbPage, setDbPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [error, setError] = useState('');

  useEffect(() => {
    let filtered = branches;
    if (search.trim()) {
      filtered = filtered.filter(b => b.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    if (locationFilter) {
      filtered = filtered.filter(b => b.location.toLowerCase().includes(locationFilter.trim().toLowerCase()));
    }
    setFilteredBranches(filtered);
    setPage(1);
  }, [search, locationFilter, branches]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBranches.length / PAGE_SIZE) || 1;
  const paginated = filteredBranches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  // Database pagination
  const dbTotalPages = dbResults ? Math.ceil(dbResults.length / PAGE_SIZE) || 1 : 1;
  const dbPaginated = dbResults ? dbResults.slice((dbPage - 1) * PAGE_SIZE, dbPage * PAGE_SIZE) : [];
  const goToDbPage = (p: number) => setDbPage(Math.max(1, Math.min(dbTotalPages, p)));

  const saveBranches = (branches: Branch[]) => {
    setBranches(branches);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
  };

  const openAddModal = () => {
    setName('');
    setLocation('');
    setModalMode('add');
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setName(branch.name);
    setLocation(branch.location);
    setModalMode('edit');
    setEditingId(branch.id);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError('');
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      setError('Please fill all fields.');
      return;
    }
    if (editingId) {
      // Update
      const updated = branches.map(b => b.id === editingId ? { ...b, name, location } : b);
      saveBranches(updated);
      setEditingId(null);
    } else {
      // Add
      const newBranch: Branch = { id: Date.now().toString(), name, location };
      saveBranches([...branches, newBranch]);
    }
    setName('');
    setLocation('');
    closeModal();
  };



  const handleDelete = (id: string) => {
    const updated = branches.filter(b => b.id !== id);
    saveBranches(updated);
    // Track deleted ID
    const deletedIds = loadDeletedBranchIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedBranchIds(deletedIds);
    }
    if (editingId === id) {
      setEditingId(null);
      setName('');
      setLocation('');
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
    setDbPage(1);
    try {
      const res = await fetch('http://localhost:5000/api/branches/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: search.trim(), location: locationFilter }),
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      setDbResults(data.branches || []);
    } catch (err) {
      setDbError('Failed to search database.');
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <h2>Branches</h2>
      {/* Search and filter bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button
          onClick={openAddModal}
          style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Branch
        </button>
      </div>
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
          placeholder="Location filter..."
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead style={{ background: '#e3eefe' }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {dbPaginated.length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No results found in database.</td></tr>
                ) : dbPaginated.map(branch => (
                  <tr key={branch.id || (branch as any)._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 10 }}>{branch.name}</td>
                    <td style={{ padding: 10 }}>{branch.location}</td>
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
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px #0002', padding: 32, minWidth: 320, maxWidth: 400, width: '100%', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>{modalMode === 'add' ? 'Add Branch' : 'Edit Branch'}</h3>
            <form onSubmit={handleAddOrUpdate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Name
                  <input
                    type="text"
                    placeholder="Branch Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10 }}
                  />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Location
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', marginBottom: 10 }}
                  />
                </label>
              </div>
              {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
              <button type="submit" style={{ width: '100%', padding: '10px 0', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600 }}>
                {modalMode === 'add' ? 'Add Branch' : 'Update Branch'}
              </button>
            </form>
          </div>
        </div>
      )}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Location</th>
              <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#888', padding: 16 }}>No branches found.</td>
              </tr>
            ) : paginated.map(branch => (
              <tr key={branch.id}>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>{branch.name}</td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>{branch.location}</td>
                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                  <button onClick={() => openEditModal(branch)} style={{ marginRight: 8, padding: '4px 12px', fontSize: 14 }}>Edit</button>
                  <button onClick={() => handleDelete(branch.id)} style={{ padding: '4px 12px', fontSize: 14, color: 'white', background: '#e53e3e', border: 'none', borderRadius: 4 }}>Delete</button>
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
    </div>
  );
} 