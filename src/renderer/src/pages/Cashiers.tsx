import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    setBranches(getBranches());
  }, []);

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
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Cashiers</h2>
        <button
          onClick={openAddModal}
          style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Cashier
        </button>
      </div>
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
            {cashiers.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#888' }}>No cashiers found.</td></tr>
            ) : cashiers.map(cashier => {
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