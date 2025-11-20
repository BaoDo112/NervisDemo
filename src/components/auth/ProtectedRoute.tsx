import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/auth-types';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
}) => {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const { user, profile, loading } = useAuth();

  // In DEMO mode, bypass auth checks to allow UI exploration
  if (demoMode) {
    return <>{children}</>;
  }

  // Subtle loading state consistent with app design
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/10">
        <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" aria-label="Đang tải" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access
  if (requiredRole && profile && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Không có quyền truy cập
          </h1>
          <p className="text-gray-600 mb-4">
            Bạn không có quyền truy cập vào trang này.
          </p>
          <p className="text-sm text-gray-500">
            Vai trò hiện tại: {profile.role === 'job_seeker' ? 'Ứng viên' : 'Nhà tuyển dụng'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};