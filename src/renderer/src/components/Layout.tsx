import React from 'react';
import NavHeader, { CashierNavHeader } from './NavHeader';
import './Layout.css';

export default function Layout({ children, role = 'default' }: { children: React.ReactNode, role?: 'default' | 'cashier' }) {
  return (
    <div className="layout-root">
      {role === 'cashier' ? <CashierNavHeader /> : <NavHeader />}
      <div className="layout-content">{children}</div>
      <footer className="layout-footer">powered by <a href="https://www.forou.tech" target="_blank" rel="noopener noreferrer">www.forou.tech</a></footer>
    </div>
  );
} 