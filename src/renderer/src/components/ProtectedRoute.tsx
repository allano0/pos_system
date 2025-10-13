import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const userRole = sessionStorage.getItem('role') || 'default';
  
  if (!allowedRoles.includes(userRole)) {
    // Redirect to sale page for cashiers, or owner dashboard for owners
    return <Navigate to={userRole === 'cashier' ? '/sale' : '/owner-dashboard'} replace />;
  }
  
  return <>{children}</>;
}
