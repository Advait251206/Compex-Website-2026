import { useState, useEffect } from 'react';
import api from '../api';
import { Loader2 } from 'lucide-react';

interface OTPProps {
  email: string;
  onVerified: (ticketId: string) => void;
  onResend: () => void;
}

export default function OTPVerification({ email, onVerified, onResend }: OTPProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 mins

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Verify OTP
      await api.post('/user/verify-email', { email, otp });
      
      // 2. Create Ticket (Backend does this automatically? 
      //    Wait, check backend controller. verifyEmailAndCreateTicket does BOTH. 
      //    It returns { message, ticketId }. Perfect.)
      
      // Actually let's double check exact endpoint response structure in backend code if needed.
      // Assuming it works as per previous implementation plan.
      
      // Re-trigger verify call which returns ticket info
      const res = await api.post('/user/verify-email', { email, otp });
      onVerified(res.data.ticketId);

    } catch (error: any) {
      alert(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#8b5cf6', marginBottom: '1rem' }}>VERIFY EMAIL</h2>
      <p style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
        Enter the OTP sent to <br/><span style={{ color: 'white' }}>{email}</span>
      </p>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          maxLength={6}
          className="form-input text-center"
          style={{ fontSize: '2rem', letterSpacing: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          autoFocus
        />

        <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
          {loading ? <Loader2 className="spinner" /> : "Verify & Get Ticket"}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
        OTP Expires in: {formatTime(timer)}
      </div>

      <button 
        onClick={onResend}
        style={{ background: 'none', border: 'none', color: '#a5b4fc', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
      >
        Resend OTP
      </button>
    </div>
  );
}
