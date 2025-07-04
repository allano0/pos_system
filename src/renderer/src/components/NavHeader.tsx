import React from 'react';
import { FaTachometerAlt, FaCashRegister, FaUserPlus, FaUsersCog, FaBoxOpen, FaTruck, FaFileInvoiceDollar, FaSyncAlt, FaSignOutAlt, FaCodeBranch } from 'react-icons/fa';
import './NavHeader.css';
import wavyLines from '../assets/wavy-lines.svg';
import { useNavigate } from 'react-router-dom';

const allNavItems = [
  { label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
  { label: 'Sale', icon: <FaCashRegister />, path: '/sale' },
  { label: 'Customers', icon: <FaUserPlus />, path: '/customers' },
  { label: 'Cashiers', icon: <FaUsersCog />, path: '/cashiers' },
  { label: 'Products', icon: <FaBoxOpen />, path: '/products' },
  { label: 'Suppliers', icon: <FaTruck />, path: '/suppliers' },
  { label: 'Credit Note', icon: <FaFileInvoiceDollar />, path: '/credit-note' },
  { label: 'Branches', icon: <FaCodeBranch />, path: '/branches' },
  { label: 'Data Sync', icon: <FaSyncAlt />, path: '/data-sync' },
  { label: 'Log Out', icon: <FaSignOutAlt />, path: '/signin' },
];

const cashierNavItems = [
  { label: 'Sale', icon: <FaCashRegister />, path: '/sale' },
  { label: 'Customers', icon: <FaUserPlus />, path: '/customers' },
  { label: 'Products', icon: <FaBoxOpen />, path: '/products' },
  { label: 'Suppliers', icon: <FaTruck />, path: '/suppliers' },
  { label: 'Credit Note', icon: <FaFileInvoiceDollar />, path: '/credit-note' },
  { label: 'Data Sync', icon: <FaSyncAlt />, path: '/data-sync' },
  { label: 'Log Out', icon: <FaSignOutAlt />, path: '/signin' },
];

function getUserName() {
  return sessionStorage.getItem('userName') || 'User';
}
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}

export default function NavHeader({ role = 'default' }: { role?: 'default' | 'cashier' }) {
  const navigate = useNavigate();
  const userName = getUserName();
  const userInitials = getInitials(userName);
  const navItems = role === 'cashier' ? cashierNavItems : allNavItems;
  return (
    <aside className="nav-sidebar">
      <div className="nav-sidebar-header">
        <img src={wavyLines} alt="bg" className="nav-sidebar-wavy" />
        <div className="nav-sidebar-title">POS System <span className="nav-sidebar-emoji">💸</span></div>
        <div className="nav-sidebar-subtitle">Fast. Reliable. Modern.</div>
        <div className="nav-sidebar-avatar" title={userName}>
          <span>{userInitials}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', margin: '16px 0', fontWeight: 500, fontSize: 18 }}>
        Hello, {userName}!
      </div>
      <nav className="nav-sidebar-items">
        {navItems.map((item) => (
          <div
            className="nav-sidebar-item"
            key={item.label}
            tabIndex={0}
            onClick={() => navigate(item.path)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(item.path); }}
            role="button"
            aria-label={item.label}
          >
            <span className="nav-sidebar-icon">{item.icon}</span>
            <span className="nav-sidebar-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function CashierNavHeader() {
  return <NavHeader role="cashier" />;
} 