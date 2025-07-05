import React from 'react';
import NavHeader from './NavHeader';
import './Layout.css';

export default function Layout({ children, role = 'default' }: { children: React.ReactNode, role?: 'default' | 'cashier' }) {
  return (
    <div className="layout-root">
      <div className="layout-sidebar">
        <NavHeader role={role} />
      </div>
      <div className="layout-main">
        <div className="layout-content">{children}</div>
        <footer className="layout-footer">powered by <a href="https://www.forou.tech" target="_blank" rel="noopener noreferrer">www.forou.tech</a></footer>
      </div>
    </div>
  );
} 