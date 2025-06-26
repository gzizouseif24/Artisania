import React, { useState } from 'react';
import { useAuth } from '../../stores/AuthContext';
import '../common/Modal.css';
import './LoginRegisterModal.css';

interface LoginRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBecomeArtisan: () => void;
}

const LoginRegisterModal: React.FC<LoginRegisterModalProps> = ({ isOpen, onClose, onBecomeArtisan }) => {

  const { login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLogin = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!registerData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await login(loginData.email, loginData.password);
      onClose();
      // Reset form
      setLoginData({ email: '', password: '' });
    } catch (error: any) {
      setErrors({ 
        general: error.response?.data?.message || 'Login failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await register(registerData.email, registerData.password, 'CUSTOMER');
      onClose();
      // Reset form
      setRegisterData({ email: '', password: '', confirmPassword: '' });
    } catch (error: any) {
      setErrors({ 
        general: error.response?.data?.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabSwitch = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrors({});
    // Reset forms when switching tabs
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', password: '', confirmPassword: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <div className="modal-tabs">
            <button 
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
              disabled={isSubmitting}
            >
              Login
            </button>
            <button 
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
              disabled={isSubmitting}
            >
              Register
            </button>
          </div>
        </div>

        <div className="modal-body">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className={errors.email ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className={errors.password ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className={errors.email ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min. 6 characters)"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className={errors.password ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Customer Account'}
              </button>
            </form>
          )}
          
          <div className="auth-divider">
            <span>or</span>
          </div>
          
          <button 
            className="become-artisan-button"
            onClick={onBecomeArtisan}
            disabled={isSubmitting}
          >
            Become an Artisan
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal; 