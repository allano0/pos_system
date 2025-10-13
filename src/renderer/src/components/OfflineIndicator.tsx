import React, { useState, useEffect } from 'react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showMessage && isOnline) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        padding: '12px 16px',
        borderRadius: 8,
        color: '#fff',
        fontWeight: 600,
        fontSize: 14,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        background: isOnline ? '#10b981' : '#ef4444',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
          animation: isOnline ? 'pulse 2s infinite' : 'none',
        }}
      />
      {isOnline ? 'Back Online' : 'Working Offline'}
    </div>
  );
};

export default OfflineIndicator;
