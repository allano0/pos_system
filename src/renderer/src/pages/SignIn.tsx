import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import electronLogo from '../assets/electron.svg';
import './SignIn.css';

const keypadNumbers = [1,2,3,4,5,6,7,8,9,0];
const CASHIER_STORAGE_KEY = 'pos_cashiers';
const BRANCH_STORAGE_KEY = 'pos_branches';

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

export default function SignIn() {
  const [role, setRole] = useState<'cashier' | 'owner'>('cashier');
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cashiers = getCashiers();
  const branches = getBranches();

  const handleKeypad = (num: number) => {
    if (pin.length < 6) setPin(pin + num);
  };
  const handleBackspace = () => setPin(pin.slice(0, -1));
  const handleClear = () => setPin('');

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
        // Persist session info if needed
        navigate('/cashier-dashboard');
      } else {
        setError('Incorrect PIN or branch. Please try again.');
        setPin('');
      }
    } else if (role === 'owner' && pin === '2921') {
      sessionStorage.setItem('role', 'default');
      sessionStorage.setItem('userName', 'Owner');
      navigate('/owner-dashboard');
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="signin-root">
      <div className="signin-card">
        {/* Left: Logo/Image */}
        <div className="signin-image-section">
          <img src={electronLogo} alt="Logo" className="signin-logo" draggable="false" />
        </div>
        {/* Right: Sign In Form */}
        <div className="signin-form-section">
          <h1 className="signin-title">Sign In</h1>
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
    </div>
  );
} 