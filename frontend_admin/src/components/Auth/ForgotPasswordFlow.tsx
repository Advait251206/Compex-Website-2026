import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import PasswordInput from '../UI/PasswordInput';

interface ForgotPasswordFlowProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'REQUEST' | 'VERIFY' | 'RESET' | 'SUCCESS';

export default function ForgotPasswordFlow({ onSuccess, onCancel }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<Step>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins for OTP

  // Timer logic for Verify step
  useEffect(() => {
    let timer: any;
    if (step === 'VERIFY' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.requestPasswordResetOTP({ email });
      // console.log('Requested OTP for:', email); // Mock
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('VERIFY');
      setTimeLeft(300);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authAPI.verifyResetOTP({ email, otp });
      // console.log('Verifying OTP:', otp); // Mock
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('RESET');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
      await authAPI.resetPassword({ email, newPassword, otp });
      // console.log('Resetting password for:', email); // Mock
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const renderStep = () => {
    switch (step) {
      case 'REQUEST':
        return (
          <form onSubmit={handleRequestOTP}>
            <div className="input-group">
              <label className="input-label">Enter your Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'SEND OTP'}
            </button>
          </form>
        );

      case 'VERIFY':
        return (
          <form onSubmit={handleVerifyOTP}>
             <p className="text-center mb-4" style={{ fontSize: '0.9rem' }}>
                OTP sent to <strong>{email}</strong>
             </p>
            <div className="input-group">
              <label className="input-label">Enter OTP</label>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
              />
            </div>
            <div className="text-center mb-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Time remaining: <span style={{ color: timeLeft < 60 ? 'var(--error-color)' : 'var(--accent-color)' }}>{formatTime(timeLeft)}</span>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'VERIFY'}
            </button>
          </form>
        );

      case 'RESET':
        return (
          <form onSubmit={handleResetPassword}>
            <PasswordInput
               label="New Password"
               className="form-input"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               required
            />
            <PasswordInput
               label="Confirm New Password"
               className="form-input"
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'RESET PASSWORD'}
            </button>
          </form>
        );

      case 'SUCCESS':
        return (
          <div className="text-center">
             <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
             <h3>Password Reset!</h3>
             <p>Your password has been successfully updated.</p>
             <button type="button" className="btn-primary mt-4" onClick={onSuccess}>
               Back to Login
             </button>
          </div>
        );
    }
  };

  return (
    <div className="glass-card">
      <h2 className="text-center" style={{ color: '#a5b4fc', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)' }}>
        {step === 'REQUEST' && 'FORGOT PASSWORD'}
        {step === 'VERIFY' && 'VERIFY OTP'}
        {step === 'RESET' && 'RESET PASSWORD'}
        {step === 'SUCCESS' && 'SUCCESS'}
      </h2>
      <p className="text-center" style={{ marginBottom: '2rem', letterSpacing: '2px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>COMP-EX 2026</p>

      {error && <div className="error-msg" style={{ position: 'relative', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      {renderStep()}

      {step === 'REQUEST' && (
          <div className="text-center mt-4">
            <button 
                type="button" 
                onClick={onCancel}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Back to Login
            </button>
          </div>
      )}
    </div>
  );
}
