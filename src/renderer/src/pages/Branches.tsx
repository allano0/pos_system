import React, { useState } from 'react';

interface Branch {
  id: string;
  name: string;
  location: string;
}

const STORAGE_KEY = 'pos_branches';
const BRANCH_SYNC_URL = 'http://localhost:5000/api/branches/sync';

function getInitialBranches(): Branch[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>(getInitialBranches());
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const saveBranches = (branches: Branch[]) => {
    setBranches(branches);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
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
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setName(branch.name);
    setLocation(branch.location);
  };

  const handleDelete = (id: string) => {
    const updated = branches.filter(b => b.id !== id);
    saveBranches(updated);
    if (editingId === id) {
      setEditingId(null);
      setName('');
      setLocation('');
    }
  };

  const handleSync = async () => {
    setSyncStatus('loading');
    setSyncMessage('');
    try {
      const res = await fetch(BRANCH_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branches }),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      if (Array.isArray(data.branches)) {
        saveBranches(data.branches);
        setSyncStatus('success');
        setSyncMessage('Sync successful! Local branches updated.');
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage('Sync failed. Please try again.');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h2>Branches</h2>
      <button
        onClick={handleSync}
        disabled={syncStatus === 'loading'}
        style={{ padding: '10px 24px', fontSize: 18, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 16 }}
      >
        {syncStatus === 'loading' ? 'Syncing...' : 'Sync Branches to Cloud'}
      </button>
      {syncMessage && (
        <div style={{ color: syncStatus === 'success' ? 'green' : 'red', marginTop: 12, fontWeight: 500 }}>{syncMessage}</div>
      )}
      <div style={{ color: '#888', marginTop: 8, fontSize: 14, marginBottom: 24 }}>
        This will push local branches to the cloud and pull the latest from the cloud (MongoDB).
      </div>
      <form onSubmit={handleAddOrUpdate} style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Branch Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ marginRight: 8, padding: 8, fontSize: 16 }}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={{ marginRight: 8, padding: 8, fontSize: 16 }}
        />
        <button type="submit" style={{ padding: '8px 20px', fontSize: 16, borderRadius: 6, background: '#3182ce', color: '#fff', border: 'none' }}>
          {editingId ? 'Update' : 'Add'} Branch
        </button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setName(''); setLocation(''); }} style={{ marginLeft: 8, padding: '8px 20px', fontSize: 16, borderRadius: 6, background: '#aaa', color: '#fff', border: 'none' }}>
            Cancel
          </button>
        )}
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Location</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map(branch => (
            <tr key={branch.id}>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>{branch.name}</td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>{branch.location}</td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>
                <button onClick={() => handleEdit(branch)} style={{ marginRight: 8, padding: '4px 12px', fontSize: 14 }}>Edit</button>
                <button onClick={() => handleDelete(branch.id)} style={{ padding: '4px 12px', fontSize: 14, color: 'white', background: '#e53e3e', border: 'none', borderRadius: 4 }}>Delete</button>
              </td>
            </tr>
          ))}
          {branches.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: '#888', padding: 16 }}>No branches found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 