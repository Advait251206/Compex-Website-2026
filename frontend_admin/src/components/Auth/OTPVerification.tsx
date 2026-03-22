import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

interface OTPVerificationProps {
  email: string;
  onSuccess: () => void;
}

export default function OTPVerification({ email, onSuccess }: OTPVerificationProps) {
  const [otpData, setOtpData] = useState({
    emailOTP: ''
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpData({
      ...otpData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authAPI.verifyOTP({
        email,
        emailOTP: otpData.emailOTP
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await authAPI.resendOTP({ email });
      setTimeLeft(300); // Reset timer
      alert('OTP has been resent!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="glass-card">
      <h2 className="text-center">Verify Your Account</h2>
      <p className="text-center">
        We've sent an OTP to <strong>{email}</strong>.
      </p>

      {error && <div className="error-msg" style={{ position: 'relative', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email OTP</label>
          <input
            type="text"
            name="emailOTP"
            className="form-input"
            value={otpData.emailOTP}
            onChange={handleChange}
            placeholder="Enter 6-digit code"
            maxLength={6}
            required
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
          />
        </div>

        <div className="text-center mb-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Time remaining: <span style={{ color: timeLeft < 60 ? 'var(--error-color)' : 'var(--accent-color)', fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
        </div>

        <button type="submit" className="btn-primary mb-4" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'Verify & Complete'}
        </button>

        <div className="text-center">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handleResend}
            disabled={resending || timeLeft > 0}
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </form>
    </div>
  );
}
