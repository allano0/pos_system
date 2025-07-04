import React, { useState, useEffect } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

const STORAGE_KEY = 'pos_customers';
const PAGE_SIZE = 5;

function loadCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

const emptyCustomer: Omit<Customer, 'id'> = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({ ...emptyCustomer });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [dbResults, setDbResults] = useState<Customer[] | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [dbPage, setDbPage] = useState(1);

  useEffect(() => {
    setCustomers(loadCustomers());
  }, []);

  useEffect(() => {
    let filtered = customers;
    if (search.trim()) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    setFilteredCustomers(filtered);
    setPage(1);
  }, [search, customers]);

  const openAddModal = () => {
    setForm({ ...emptyCustomer });
    setModalMode('add');
    setEditId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setModalMode('edit');
    setEditId(customer.id);
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
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim()) {
      setError('Please fill all fields.');
      return;
    }
    if (modalMode === 'add') {
      const newCustomer: Customer = {
        ...form,
        id: Date.now().toString(),
      };
      const updated = [...customers, newCustomer];
      setCustomers(updated);
      saveCustomers(updated);
    } else if (modalMode === 'edit' && editId) {
      const updated = customers.map(c =>
        c.id === editId ? { ...c, ...form } : c
      );
      setCustomers(updated);
      saveCustomers(updated);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    saveCustomers(updated);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE) || 1;
  const paginated = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
      // Replace with your real endpoint if available
      const res = await fetch('http://localhost:5000/api/customers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: search.trim() }),
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      setDbResults(data.customers || []);
    } catch (err) {
      setDbError('Failed to search database.');
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Customers</h2>
        <button
          onClick={openAddModal}
          style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Customer
        </button>
      </div>
      {/* Search and filter bar - at top */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
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
                  <th style={{ padding: 10, textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Address</th>
                </tr>
              </thead>
              <tbody>
                {dbPaginated.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No results found in database.</td></tr>
                ) : dbPaginated.map(customer => (
                  <tr key={customer.id || (customer as any)._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 10 }}>{customer.name}</td>
                    <td style={{ padding: 10 }}>{customer.phone}</td>
                    <td style={{ padding: 10 }}>{customer.email}</td>
                    <td style={{ padding: 10 }}>{customer.address}</td>
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
      {/* Main Table */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead style={{ background: '#f5f7fa' }}>
            <tr>
              <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Phone</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Email</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Address</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No customers yet.</td></tr>
            ) : paginated.map(customer => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 10 }}>{customer.name}</td>
                <td style={{ padding: 10 }}>{customer.phone}</td>
                <td style={{ padding: 10 }}>{customer.email}</td>
                <td style={{ padding: 10 }}>{customer.address}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <button onClick={() => openEditModal(customer)} style={{ color: '#fff', background: '#3182ce', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                  <button onClick={() => handleDelete(customer.id)} style={{ color: '#fff', background: '#e53e3e', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
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
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>{modalMode === 'add' ? 'Add Customer' : 'Edit Customer'}</h3>
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
                  Phone
                  <input name="phone" placeholder="Phone" value={form.phone} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Email
                  <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                <label style={{ fontWeight: 600, color: '#223', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Address
                  <input name="address" placeholder="Address" value={form.address} onChange={handleFormChange} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} required />
                </label>
                {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
              </div>
              <button type="submit" style={{ padding: '12px 0', borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, width: '100%', marginTop: 8 }}>{modalMode === 'add' ? 'Add Customer' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 