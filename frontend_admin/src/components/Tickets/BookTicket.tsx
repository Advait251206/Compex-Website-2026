import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI, otpAPI } from '../../services/api';
import CustomDatePicker from '../UI/CustomDatePicker';

export default function BookTicket() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    holderName: '',
    holderEmail: '',
    holderPhone: '',
    holderGender: '',
    holderDob: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Reset verification if email changes
    if (e.target.name === 'holderEmail') {
        setIsVerified(false);
        setOtpSent(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.holderEmail) {
        setError("Please enter an email address first.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
        const token = await getToken();
        if(!token) return;
        await otpAPI.sendOTP(formData.holderEmail, formData.holderName, token);
        setOtpSent(true);
        // alert(`OTP sent to ${formData.holderEmail}`); // Removed as requested
    } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
     setLoading(true);
     setError(null);
     try {
         const token = await getToken();
         if(!token) return;
         await otpAPI.verifyOTP(formData.holderEmail, otpInput, token);
         setIsVerified(true);
         setOtpSent(false);
         setOtpInput('');
     } catch (err: any) {
         setError(err.response?.data?.message || 'Invalid OTP.');
     } finally {
         setLoading(false);
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication missing. Please login again.");
        return;
      }
      
      if (!isVerified) {
          setError("Please verify the email address before booking.");
          setLoading(false);
          return;
      }

      await ticketAPI.bookTicket(formData, token);
      navigate('/tickets/my-tickets'); // Redirect to My Tickets on success
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RequiredStar = () => <span style={{ color: 'var(--error-color)' }}> *</span>;

  return (
    <div className="auth-page-container">
    <div className="glass-card">
      <h2 className="text-center" style={{ color: '#a5b4fc', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)' }}>BOOK TICKET</h2>
      <p className="text-center" style={{ marginBottom: '2rem', letterSpacing: '1px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
        Enter attendee details below.
      </p>

      {error && <div className="error-msg" style={{ position: 'relative', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Full Name<RequiredStar /></label>
          <input
            type="text"
            name="holderName"
            className="form-input"
            value={formData.holderName}
            onChange={handleChange}
            required
            placeholder="Attendee's Name"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email Address<RequiredStar /></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
                type="email"
                name="holderEmail"
                className="form-input"
                value={formData.holderEmail}
                onChange={handleChange}
                required
                placeholder="Attendee's Email"
                style={{ width: '100%', borderColor: isVerified ? '#4ade80' : undefined }}
                readOnly={isVerified}
            />
            {!isVerified && !otpSent && (
                <button 
                    type="button" 
                    onClick={handleSendOTP}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.25rem' }}
                    disabled={loading || !formData.holderEmail}
                >
                    VERIFY EMAIL
                </button>
            )}
            {isVerified && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', padding: '0.5rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)', marginTop: '0.25rem' }}>
                    ✓ Verified
                </div>
            )}
          </div>
          {otpSent && !isVerified && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeIn 0.3s' }}>
                  <div style={{ fontSize: '0.8rem', color: '#a5b4fc', textAlign: 'center' }}>
                      OTP sent to {formData.holderEmail}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    className="form-input" 
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    style={{ width: '100%', textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem' }}
                    maxLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={handleVerifyOTP} 
                    className="btn-primary"
                    style={{ background: '#10b981', padding: '0.75rem', width: '100%' }}
                    disabled={loading}
                  >
                    CONFIRM OTP
                  </button>
              </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Phone Number<RequiredStar /></label>
          <input
            type="tel"
            name="holderPhone"
            className="form-input"
            value={formData.holderPhone}
            onChange={handleChange}
            required
            placeholder="10-digit Mobile Number"
          />
        </div>

        <div className="form-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Gender<RequiredStar /></label>
            <select
              name="holderGender"
              className="form-input"
              value={formData.holderGender}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Date of Birth<RequiredStar /></label>
            <CustomDatePicker
              name="holderDob"
              value={formData.holderDob}
              onChange={handleChange}
              required
              placeholder="DD-MM-YYYY"
            />
          </div>
        </div>



        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'CONFIRM BOOKING'}
        </button>
        
        <div className="text-center mt-3">
            <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Cancel
            </button>
        </div>

      </form>
    </div>
    </div>
  );
}
