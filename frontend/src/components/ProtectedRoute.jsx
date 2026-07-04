import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => {
  const r = role ? role.toLowerCase().trim() : '';
  if (r === 'administrateur') return 'admin';
  if (r === 'candidat') return 'stagiaire';
  return r;
};

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = normalizeRole(user.role);
    const required = normalizeRole(requiredRole);

    if (userRole !== required) {
      // Redirige chaque rôle vers son propre dashboard
      if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
      if (userRole === 'formateur') return <Navigate to={`/dashboard/formateur/${user.id}`} replace />;
      if (userRole === 'stagiaire') return <Navigate to={`/dashboard/stagiaire/${user.id}`} replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
