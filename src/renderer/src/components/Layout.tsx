import React from 'react';
import NavHeader from './NavHeader';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-root">
      <NavHeader />
      <div className="layout-content">{children}</div>
      <footer className="layout-footer">powered by <a href="https://www.forou.tech" target="_blank" rel="noopener noreferrer">www.forou.tech</a></footer>
    </div>
  );
} 