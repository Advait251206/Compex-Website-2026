import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../UI/PasswordInput';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { authAPI } from '../../services/api';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export default function LoginForm({ onSuccess, onRegisterClick, onForgotPasswordClick }: LoginFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Mock login for now, or replace with actual API call
      // await authAPI.login(formData);
      console.log('Logging in with:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/auth/success');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RequiredStar = () => <span style={{ color: 'var(--error-color)' }}> *</span>;

  return (
    <div className="glass-card">
      <h2 className="text-center" style={{ color: '#a5b4fc', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)' }}>LOGIN</h2>
      <p className="text-center" style={{ marginBottom: '2rem', letterSpacing: '2px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>COMP-EX 2026</p>

      {error && <div className="error-msg" style={{ position: 'relative', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email Address<RequiredStar /></label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <PasswordInput
              label={<span>Password<RequiredStar /></span>}
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
          />
          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'LOGIN'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ padding: '0 10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>OR LOGIN WITH</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse: CredentialResponse) => {
              try {
                if (credentialResponse.credential) {
                  setLoading(true);
                  const response = await authAPI.googleLogin(credentialResponse.credential);
                  console.log("Google Login Success:", response.data);
                  
                  // Handle success
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    navigate('/dashboard'); // Or whatever the success route is
                  }
                }
              } catch (err: any) {
                console.error("Google Login Error:", err);
                setError("Google Sign-In failed. Please try again.");
              } finally {
                 setLoading(false);
              }
            }}
            onError={() => {
              setError("Google Sign-In failed. Please try again.");
            }}
            theme="filled_black"
            shape="pill"
            width="300" // Fixed width in pixels
          />
        </div>
        
        {/* Mock Login for Development */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => {
              // Mock Login Logic
              localStorage.setItem('token', 'mock-token');
              if (onSuccess) {
                  onSuccess();
              } else {
                  navigate('/dashboard');
              }
            }}
            style={{
              background: 'none',
              border: '1px dashed rgba(99, 102, 241, 0.5)',
              color: 'rgba(99, 102, 241, 0.8)',
              padding: '6px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'all 0.2s'
            }}
          >
            Mock Login (Dev Mode)
          </button>
        </div>

        <div className="text-center mt-4">
            <p className="mb-4">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={onRegisterClick}
                  style={{ 
                    background: 'none', 
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--accent-color)', 
                    textDecoration: 'underline',
                    fontSize: 'inherit'
                  }}
                >
                  Register
                </button>
            </p>
        </div>
      </form>
    </div>
  );
}
