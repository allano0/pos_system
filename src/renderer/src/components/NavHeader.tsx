import React from 'react';
import { FaCashRegister, FaUserPlus, FaUsersCog, FaBoxOpen, FaTruck, FaFileInvoiceDollar, FaSyncAlt, FaSignOutAlt } from 'react-icons/fa';
import './NavHeader.css';
import wavyLines from '../assets/wavy-lines.svg';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Sale', icon: <FaCashRegister />, path: '/sale' },
  { label: 'Customers', icon: <FaUserPlus />, path: '/customers' },
  { label: 'Cashiers', icon: <FaUsersCog />, path: '/cashiers' },
  { label: 'Products', icon: <FaBoxOpen />, path: '/products' },
  { label: 'Suppliers', icon: <FaTruck />, path: '/suppliers' },
  { label: 'Credit Note', icon: <FaFileInvoiceDollar />, path: '/credit-note' },
  { label: 'Data Sync', icon: <FaSyncAlt />, path: '/data-sync' },
  { label: 'Log Out', icon: <FaSignOutAlt />, path: '/signin' },
];

export default function NavHeader() {
  const navigate = useNavigate();
  // Placeholder for user info
  const user = { name: 'Allan', initials: 'AL' };
  return (
    <header className="nav-header-cool">
      <div className="nav-header-bg">
        <img src={wavyLines} alt="bg" className="nav-header-wavy" />
      </div>
      <div className="nav-header-glass">
        <div className="nav-header-row">
          <div>
            <div className="nav-header-title">POS System <span className="nav-header-emoji">💸</span></div>
            <div className="nav-header-subtitle">Fast. Reliable. Modern.</div>
          </div>
          <div className="nav-header-avatar" title={user.name}>
            <span>{user.initials}</span>
          </div>
        </div>
        <nav className="nav-header-items">
          {navItems.map((item) => (
            <div
              className="nav-header-item"
              key={item.label}
              tabIndex={0}
              onClick={() => navigate(item.path)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(item.path); }}
              role="button"
              aria-label={item.label}
            >
              <span className="nav-header-icon">{item.icon}</span>
              <span className="nav-header-label">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
      <div className="nav-header-gradient-border" />
    </header>
  );
} 