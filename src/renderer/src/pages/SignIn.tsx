import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';

const keypadNumbers = [1,2,3,4,5,6,7,8,9,0];
const CASHIER_STORAGE_KEY = 'supermax_cashiers';
const BRANCH_STORAGE_KEY = 'supermax_branches';
const OWNER_STORAGE_KEY = 'supermax_owner';

function getCashiers() {
  try {
    return JSON.parse(localStorage.getItem(CASHIER_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function getBranches() {
  try {
    return JSON.parse(localStorage.getItem(BRANCH_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function getOwner() {
  try {
    return JSON.parse(localStorage.getItem(OWNER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function SignIn() {
  const [role, setRole] = useState<'cashier' | 'owner'>('cashier');
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const navigate = useNavigate();
  const cashiers = getCashiers();
  const branches = getBranches();
  const owner = getOwner();

  // Check if this is a fresh installation (no data in localStorage)
  useEffect(() => {
    const hasData = cashiers.length > 0 || branches.length > 0 || owner !== null;
    if (!hasData) {
      setShowSyncModal(true);
    }
  }, [cashiers.length, branches.length, owner]);

  const handleKeypad = (num: number) => {
    if (pin.length < 6) setPin(pin + num);
  };
  const handleBackspace = () => setPin(pin.slice(0, -1));
  const handleClear = () => setPin('');

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncError('');
    
    try {
      // Determine backend URL based on environment
      const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      const baseUrl = isDev ? 'http://localhost:5000' : 'http://localhost:5000'; // Same for now since backend is bundled
      console.log('Environment:', isDev ? 'Development' : 'Production');
      console.log('Attempting to connect to backend at:', baseUrl);
      
      // Test backend connectivity first with retry mechanism
      let backendReady = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!backendReady && attempts < maxAttempts) {
        try {
          console.log(`Testing backend connectivity (attempt ${attempts + 1}/${maxAttempts})...`);
          const testResponse = await fetch(`${baseUrl}/api/test`);
          console.log('Backend test response status:', testResponse.status);
          if (!testResponse.ok) {
            throw new Error(`Backend responded with status: ${testResponse.status}`);
          }
          const testData = await testResponse.json();
          console.log('Backend test response:', testData);
          backendReady = true;
        } catch (testError) {
          console.error(`Backend connectivity test failed (attempt ${attempts + 1}):`, testError);
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Waiting 2 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw new Error(`Cannot connect to backend server after ${maxAttempts} attempts. Please ensure the server is running on ${baseUrl}`);
          }
        }
      }
      
      // Fetch cashiers
      console.log('Fetching cashiers...');
      const cashiersResponse = await fetch(`${baseUrl}/api/cashiers`);
      if (!cashiersResponse.ok) {
        throw new Error(`Failed to fetch cashiers: ${cashiersResponse.status}`);
      }
      const cashiers = await cashiersResponse.json();
      console.log('Cashiers fetched:', cashiers.length, 'records');
      
      // Fetch branches
      console.log('Fetching branches...');
      const branchesResponse = await fetch(`${baseUrl}/api/branches`);
      if (!branchesResponse.ok) {
        throw new Error(`Failed to fetch branches: ${branchesResponse.status}`);
      }
      const branches = await branchesResponse.json();
      console.log('Branches fetched:', branches.length, 'records');
      
      // Fetch owner/admin data
      console.log('Fetching owner data...');
      const ownerResponse = await fetch(`${baseUrl}/api/owner`);
      if (!ownerResponse.ok) {
        throw new Error(`Failed to fetch owner data: ${ownerResponse.status}`);
      }
      const owner = await ownerResponse.json();
      console.log('Owner data fetched:', owner);
      
      // Store the real data in localStorage
      localStorage.setItem(CASHIER_STORAGE_KEY, JSON.stringify(cashiers));
      localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(branches));
      localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(owner));
      
      console.log('Data successfully stored in localStorage');
      setShowSyncModal(false);
      window.location.reload(); // Reload to refresh the data
      
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSyncError(`Failed to sync data: ${errorMessage}. Please try restarting the application.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'cashier') {
      if (!branchId) {
        setError('Please select a branch.');
        return;
      }
      const cashier = cashiers.find(c => c.pin === pin && c.branchId === branchId);
      if (cashier) {
        sessionStorage.setItem('role', 'cashier');
        sessionStorage.setItem('userName', cashier.name);
        // Redirect to sale instead of cashier-dashboard
        navigate('/sale');
      } else {
        setError('Incorrect PIN or branch. Please try again.');
        setPin('');
      }
    } else if (role === 'owner' && owner && pin === owner.pin) {
      sessionStorage.setItem('role', 'default');
      sessionStorage.setItem('userName', owner.name);
      navigate('/owner-dashboard');
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="signin-root">
      <div className="signin-card">
        {/* Left: Hero Image */}
        <div className="signin-image-section">
          <img src="/src/assets/hero.png" alt="POS System Hero" className="signin-hero" draggable="false" />
        </div>
        {/* Right: Sign In Form */}
        <div className="signin-form-section">
          <h1 className="signin-title">Supermax POS</h1>
          {/* Role Selection */}
          <div className="signin-role-select">
            {['cashier', 'owner'].map((r) => (
              <label key={r} className="signin-role-label">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => { setRole(r as 'cashier' | 'owner'); setError(''); setPin(''); setBranchId(''); }}
                />
                <span className="signin-role-text">{r}</span>
              </label>
            ))}
          </div>
          {/* Branch Selection for Cashier */}
          {role === 'cashier' && (
            <div style={{ marginBottom: 16 }}>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="signin-branch-select"
                style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
              >
                <option value="">Select Branch</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>
          )}
          {/* PIN Input */}
          <div className="signin-pin-input-wrapper">
            <input
              type="password"
              value={pin}
              readOnly
              className="signin-pin-input"
              placeholder="Enter PIN"
              maxLength={6}
              style={{ letterSpacing: '0.5em' }}
            />
          </div>
          {/* Error Message */}
          {error && <div style={{color: 'red', marginBottom: 12, fontWeight: 500}}>{error}</div>}
          {/* Keypad */}
          <div className="signin-keypad">
            {keypadNumbers.slice(0,9).map(num => (
              <button
                key={num}
                className="signin-keypad-btn"
                onClick={()=>handleKeypad(num)}
              >
                {num}
              </button>
            ))}
            <button
              className="signin-keypad-btn signin-keypad-backspace"
              onClick={handleBackspace}
              aria-label="Backspace"
            >
              ←
            </button>
            <button
              className="signin-keypad-btn"
              onClick={()=>handleKeypad(0)}
            >
              0
            </button>
            <button
              className="signin-keypad-btn signin-keypad-clear"
              onClick={handleClear}
              aria-label="Clear"
            >
              C
            </button>
          </div>
          <button className="signin-submit-btn" onClick={handleSignIn}>Sign In</button>
        </div>
      </div>

      {/* Data Sync Modal */}
      {showSyncModal && (
        <div className="sync-modal-overlay">
          <div className="sync-modal">
            <div className="sync-modal-header">
              <h2>Welcome to Supermax POS</h2>
              <p>First-time setup required</p>
            </div>
            <div className="sync-modal-content">
              <div className="sync-icon">🔄</div>
              <h3>Sync Data from Server</h3>
              <p>
                This appears to be a fresh installation. To get started, you need to sync 
                your data from the server. This will download:
              </p>
              <ul>
                <li>• Cashier accounts and PINs</li>
                <li>• Branch information</li>
                <li>• Owner/admin credentials</li>
              </ul>
              <div className="sync-warning">
                <strong>⚠️ Important:</strong> The backend server will start automatically. If sync fails, please restart the application.
              </div>
              {syncError && (
                <div className="sync-error">
                  {syncError}
                </div>
              )}
            </div>
            <div className="sync-modal-actions">
              <button 
                className="sync-btn"
                onClick={handleSyncData}
                disabled={isSyncing}
              >
                {isSyncing ? 'Syncing...' : 'Sync Data Now'}
              </button>
              <button 
                className="sync-skip-btn"
                onClick={() => setShowSyncModal(false)}
                disabled={isSyncing}
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 