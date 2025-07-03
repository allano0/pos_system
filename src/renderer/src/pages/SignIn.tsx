import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import electronLogo from '../assets/electron.svg';
import './SignIn.css';

const keypadNumbers = [1,2,3,4,5,6,7,8,9,0];

export default function SignIn() {
  const [role, setRole] = useState<'cashier' | 'owner'>('cashier');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleKeypad = (num: number) => {
    if (pin.length < 6) setPin(pin + num);
  };
  const handleBackspace = () => setPin(pin.slice(0, -1));
  const handleClear = () => setPin('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'cashier' && pin === '1234') {
      navigate('/cashier-dashboard');
    } else if (role === 'owner' && pin === '2921') {
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
                  onChange={() => setRole(r as 'cashier' | 'owner')}
                />
                <span className="signin-role-text">{r}</span>
              </label>
            ))}
          </div>
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