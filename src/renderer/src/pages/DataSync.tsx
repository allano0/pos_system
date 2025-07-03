import React, { useState } from 'react';

const STORAGE_KEY = 'pos_products';

export default function DataSync() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const res = await fetch('http://localhost:5000/api/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      if (Array.isArray(data.products)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.products));
        setStatus('success');
        setMessage('Sync successful! Local products updated.');
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Sync failed. Please try again.');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
      <h2>Data Sync</h2>
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        style={{ padding: '10px 24px', fontSize: 18, borderRadius: 8, background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 16 }}
      >
        {status === 'loading' ? 'Syncing...' : 'Sync Products to Cloud'}
      </button>
      {message && (
        <div style={{ color: status === 'success' ? 'green' : 'red', marginTop: 12, fontWeight: 500 }}>{message}</div>
      )}
      <div style={{ color: '#888', marginTop: 24, fontSize: 14 }}>
        This will push local products to the cloud and pull the latest from the cloud (MongoDB).
      </div>
    </div>
  );
} 