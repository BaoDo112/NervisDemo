import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/hooks/useAuth';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/10">
        <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" aria-label="Đang tải" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-brand-cyan to-blue-500 bg-clip-text text-transparent">NervIS</span>
          </h1>
          <p className="text-brand-gray text-base">Nền tảng luyện tập phỏng vấn thông minh với AI</p>
        </div>

        {isLogin ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <SignUpForm onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  );
};