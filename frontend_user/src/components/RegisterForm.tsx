import { useState, useEffect } from 'react';
import api from '../api';
import CustomDatePicker from './UI/CustomDatePicker';

interface RegisterProps {
  onSuccess: (email: string, name: string, ticketId: string) => void;
}

export default function RegisterForm({ onSuccess }: RegisterProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    referralSource: '',
    referralDetails: '',
    buyingInterest: '',
    buyingInterestDetails: ''
  });
  const [error, setError] = useState<string | null>(null);

  // OTP State
  // Removed verificationMethod toggle. Now tracking verification status directly.
  const [verifyingChannel, setVerifyingChannel] = useState<'email' | 'phone' | null>(null); // Which one is currently entering OTP
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [showRegisteredError, setShowRegisteredError] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showRegisteredError) {
      timer = setTimeout(() => {
        setShowRegisteredError(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showRegisteredError]);

  const handleChange = (e: any) => {
    setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
    })); 
    
    // Reset verification if the field changes
    if (e.target.name === 'email') {
        setEmailVerified(false);
        if (verifyingChannel === 'email') {
            setOtpSent(false);
            setOtpInput('');
            setVerifyingChannel(null);
        }
        setShowRegisteredError(false);
        setError(null);
    }
    if (e.target.name === 'phone') {
        setPhoneVerified(false);
        if (verifyingChannel === 'phone') {
            setOtpSent(false);
            setOtpInput('');
            setVerifyingChannel(null);
        }
    }
  };

  const handleEmailBlur = async () => {
    if (!formData.email || !formData.email.includes('@')) return;
    // Don't spam check if already verified or verifying
    if (emailVerified || verifyingChannel === 'email') return;

    try {
      const response = await api.post('/user/check-email', { email: formData.email });
      if (response.data.exists) {
        if (response.data.message === 'This email is already registered.') {
            setShowRegisteredError(true);
            setError(null);
        } else {
            setError(response.data.message);
        }
      } else {
         setError(null);
         setShowRegisteredError(false);
      }
    } catch (err) { }
  };

  const handlePhoneBlur = async () => {
    if (!formData.phone || formData.phone.length < 10) return;
    if (phoneVerified || verifyingChannel === 'phone') return;

    try {
      const response = await api.post('/user/check-phone', { phone: formData.phone });
      if (response.data.exists) {
         setShowRegisteredError(true);
         setError(null);
      } else {
         setError(null);
         setShowRegisteredError(false);
      }
    } catch (err) { }
  };
  
  // ... RegisteredErrorBox component (unchanged) ...
  const RegisteredErrorBox = () => (
    <div style={{
        position: 'fixed',
        top: '20%',
        right: '20px',
        maxWidth: '300px',
        background: 'rgba(255, 107, 107, 0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #ff6b6b',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        zIndex: 50,
        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.2)',
        animation: 'slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
        <h3 style={{ color: '#ff6b6b', marginTop: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Already Registered
        </h3>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.9)' }}>
            {error || "This email or phone is already registered. Only one free ticket is allowed per person."}
        </p>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', marginTop: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>
            Please go to <strong>View Your Ticket</strong> if you want to access your ticket.
        </p>
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', marginTop: '1rem', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: '#ff6b6b', animation: 'shrinkWidth 5s linear forwards' }} />
        </div>
    </div>
  );

  const handleSendOTP = async (channel: 'email' | 'phone') => {
    // 1. Validation
    if (channel === 'email') {
        if (!formData.email) { setError("Please enter an email address first."); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) { setError("Please enter a valid email address."); return; }
    } else {
        if (!formData.phone) { setError("Please enter a phone number first."); return; }
        if (formData.phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
    }
    
    setLoading(true);
    setError(null);

    try {
        // Pre-check email logic ONLY if email is provided
        if (channel === 'email' || (formData.email && formData.email.trim() !== '')) { 
            if (channel === 'email' && !formData.email) { setError("Email is required for registration."); setLoading(false); return; }
            
             if (channel === 'email') {
                // Check duplicate email
                const checkRes = await api.post('/user/check-email', { email: formData.email });
                if (checkRes.data.exists && checkRes.data.message === 'This email is already registered.') {
                    setShowRegisteredError(true);
                    setLoading(false);
                    return;
                }
             }
        }
        
        // Pre-check phone logic
        if (channel === 'phone') {
             const checkRes = await api.post('/user/check-phone', { phone: formData.phone });
             if (checkRes.data.exists) {
                setShowRegisteredError(true);
                setLoading(false);
                return;
             }
        }

        await api.post('/user/initiate-verification', {
            holderEmail: formData.email, // If empty, backend now handles it
            holderPhone: formData.phone,
            holderName: formData.name || 'Attendee',
            channel: channel
        });
        
        setVerifyingChannel(channel);
        setOtpSent(true);
        setOtpInput(''); // Clear previous input
    } catch (err: any) {
        if (err.response?.status === 409 || err.response?.data?.message?.includes('already registered')) {
             // Capture the specific backend message (e.g., Duplicate: field)
             const backendMsg = err.response?.data?.message;
             if (backendMsg) setError(backendMsg); 
             setShowRegisteredError(true);
        } else {
             setError(err.response?.data?.message || 'Failed to send OTP.');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
     if (!verifyingChannel) return;
     if (!otpInput || otpInput.trim().length === 0) {
         setError("Please enter the OTP.");
         return;
     }

     setLoading(true);
     setError(null);
     try {
         await api.post('/user/verify-otp', {
             email: formData.email,
             phone: formData.phone, // Send phone for lookup
             otp: otpInput
         });
         
         if (verifyingChannel === 'email') setEmailVerified(true);
         if (verifyingChannel === 'phone') setPhoneVerified(true);

         setOtpSent(false);
         setOtpInput('');
         setVerifyingChannel(null);
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

    // ... validation ...

    try {
      const response = await api.post('/user/complete-registration', {
        holderName: formData.name,
        holderEmail: formData.email,
        holderPhone: formData.phone,
        holderDob: formData.dob,
        holderGender: formData.gender,
        holderReferralSource: formData.referralSource,
        holderReferralDetails: formData.referralSource === 'Other' ? formData.referralDetails : '',
        holderBuyingInterest: formData.buyingInterest,
        holderBuyingInterestDetails: formData.buyingInterest === 'Other' ? formData.buyingInterestDetails : ''
      });
      // Pass ticketId from response
      onSuccess(formData.email, formData.name, response.data.ticket.id);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const RequiredStar = () => <span style={{ color: 'var(--error-color)' }}> *</span>;

  return (
    <div className="auth-page-container" style={{ padding: '0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {showRegisteredError && <RegisteredErrorBox />}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', maxWidth: '550px', margin: '0', transform: 'scale(1)' }}>
        <h2 className="text-center" style={{ color: '#a5b4fc', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)', marginBottom: '0.2rem', fontSize: '1.4rem' }}>
          BOOK YOUR <span className="animate-pulse-glow">FREE</span> TICKET
        </h2>
        <p className="text-center" style={{ marginBottom: '1.2rem', letterSpacing: '1px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
          Enter attendee details below.
        </p>

        {error && <div className="error-msg" style={{ position: 'relative', marginBottom: '0.5rem', color: '#ff6b6b', textAlign: 'center', fontSize: '0.75rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>Full Name<RequiredStar /></label>
            <input 
              className="form-input" 
              type="text" 
              name="name"
              required
              placeholder="Attendee's Name"
              value={formData.name}
              onChange={handleChange}
              style={{ padding: '8px 10px', fontSize: '0.9rem' }}
            />
          </div>

          {/* Email Section */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                Email Address{!phoneVerified && <RequiredStar />}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <input 
                  className="form-input" 
                  type="email" 
                  name="email"
                  // Required only if phone is NOT verified
                  required={!phoneVerified}
                  placeholder="Attendee's Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  style={{ width: '100%', borderColor: emailVerified ? '#4ade80' : undefined, padding: '8px 10px', fontSize: '0.9rem' }}
                  readOnly={emailVerified || (verifyingChannel === 'email')}
                />
                
                {!emailVerified && (verifyingChannel as string) !== 'email' && (
                    <button 
                        type="button" 
                        onClick={() => handleSendOTP('email')}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.2rem', background: '#4338ca' }}
                        disabled={loading || !formData.email || !!verifyingChannel}
                    >
                        {loading && verifyingChannel === 'email' ? 'SENDING...' : 'VERIFY EMAIL'}
                    </button> // Disabled if no email typed
                )}

                {emailVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '0.8rem', padding: '0.25rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 222, 128, 0.2)', marginTop: '0.2rem' }}>
                        ✓ Email Verified
                    </div>
                )}
            </div>
            
             {/* Email OTP Field */}
             {verifyingChannel === 'email' && otpSent && !emailVerified && (
                  <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', animation: 'fadeIn 0.3s' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textAlign: 'center' }}>
                          OTP sent to {formData.email}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        className="form-input" 
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        style={{ width: '100%', textAlign: 'center', letterSpacing: '2px', fontSize: '1rem', padding: '6px' }}
                        maxLength={6}
                      />
                      <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            type="button" 
                            onClick={() => { setVerifyingChannel(null); setOtpSent(false); setOtpInput(''); }}
                            style={{ flex: 1, padding: '0.4rem', background: 'transparent', border: '1px solid #6366f1', color: '#6366f1', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            onClick={handleVerifyOTP} 
                            className="btn-primary"
                            style={{ flex: 2, background: '#10b981', padding: '0.4rem', fontSize: '0.8rem' }}
                            disabled={loading}
                          >
                            CONFIRM OTP
                          </button>
                      </div>
                  </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '0.4rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ padding: '0 10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          {/* Phone Section */}
          <div className="input-group" style={{ marginBottom: 0 }}>
             <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                 Phone Number{!emailVerified && <RequiredStar />}
             </label>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
               <input 
                 className="form-input" 
                 type="tel" 
                 name="phone"
                 required={!emailVerified}
                 placeholder="10-digit Mobile Number"
                 value={formData.phone}
                 onChange={handleChange}
                 onBlur={handlePhoneBlur}
                 style={{ width: '100%', borderColor: phoneVerified ? '#4ade80' : undefined, padding: '8px 10px', fontSize: '0.9rem' }}
                 readOnly={phoneVerified || (verifyingChannel === 'phone')}
               />

                {!phoneVerified && (verifyingChannel as string) !== 'phone' && (
                    <button 
                        type="button" 
                        onClick={() => handleSendOTP('phone')}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.2rem', background: '#4338ca' }}
                        disabled={loading || !formData.phone || !!verifyingChannel}
                    >
                        {loading && verifyingChannel === 'phone' ? 'SENDING...' : 'VERIFY PHONE'}
                    </button>
                )}

                {phoneVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '0.8rem', padding: '0.25rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 222, 128, 0.2)', marginTop: '0.2rem' }}>
                        ✓ Phone Verified
                    </div>
                )}
             </div>

             {/* Phone OTP Field */}
             {verifyingChannel === 'phone' && otpSent && !phoneVerified && (
                  <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', animation: 'fadeIn 0.3s' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textAlign: 'center' }}>
                          OTP sent to {formData.phone} via SMS
                      </div>
                      <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        className="form-input" 
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        style={{ width: '100%', textAlign: 'center', letterSpacing: '2px', fontSize: '1rem', padding: '6px' }}
                        maxLength={6}
                      />
                       <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            type="button" 
                            onClick={() => { setVerifyingChannel(null); setOtpSent(false); setOtpInput(''); }}
                            style={{ flex: 1, padding: '0.4rem', background: 'transparent', border: '1px solid #6366f1', color: '#6366f1', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            onClick={handleVerifyOTP} 
                            className="btn-primary"
                            style={{ flex: 2, background: '#10b981', padding: '0.4rem', fontSize: '0.8rem' }}
                            disabled={loading}
                          >
                            CONFIRM OTP
                          </button>
                      </div>
                  </div>
            )}
            
            {/* Common OTP Notice */}
             {(loading || otpSent) && !emailVerified && !phoneVerified && (
                <div style={{ fontSize: '0.65rem', color: 'rgba(253, 224, 71, 0.8)', textAlign: 'center', marginTop: '4px' }}>
                      Note: OTP may take up to 30 secs due to high traffic.
                </div>
            )}
          </div>

          <div className="form-row" style={{ gap: '0.8rem' }}>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>Gender<RequiredStar /></label>
                <select 
                    className="form-input"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    style={{ padding: '8px 10px', fontSize: '0.9rem' }}
                >
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>Date of Birth<RequiredStar /></label>
                <CustomDatePicker
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  placeholder="DD-MM-YYYY"
                  // Assuming CustomDatePicker accepts style/className to pass down, but better to rely on global smaller inputs if needed.
                  // Since CustomDatePicker returns a div with inputs, might need to ensure its height matches.
                  // For now, let's assume it picks up .form-input styles. 
                />
            </div>
          </div>

          {/* Referral Source Section */}
          <div className="input-group" style={{ marginBottom: 0 }}>
             <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>Where did you hear about us?<RequiredStar /></label>
             <select 
                 className="form-input"
                 name="referralSource"
                 value={formData.referralSource}
                 onChange={handleChange}
                 required
                 style={{ padding: '8px 10px', fontSize: '0.9rem' }}
             >
                 <option value="" disabled>Select an option</option>
                 <option value="Instagram">Instagram</option>
                 <option value="LinkedIn">LinkedIn</option>
                 <option value="Friend/Colleague">Friend/Colleague</option>
                 <option value="College/University">College/University</option>
                 
             </select>
          </div>

          {formData.referralSource === 'Other' && (
            <div className="input-group" style={{ marginBottom: 0, animation: 'fadeIn 0.3s ease-out' }}>
               <input 
                 className="form-input" 
                 type="text" 
                 name="referralDetails"
                 required
                 placeholder="Please specify..."
                 value={formData.referralDetails}
                 onChange={handleChange}
                 style={{ padding: '8px 10px', fontSize: '0.9rem' }}
               />
            </div>
          )}

          {/* Buying Interest Section */}
          <div className="input-group" style={{ marginBottom: 0 }}>
             <label className="input-label" style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>Area Of Interest<RequiredStar /></label>
             <select 
                 className="form-input"
                 name="buyingInterest"
                 value={formData.buyingInterest}
                 onChange={handleChange}
                 required
                 style={{ padding: '8px 10px', fontSize: '0.9rem' }}
             >
                 <option value="" disabled>Select Category</option>
                 <option value="Laptops / Desktops">Laptops / Desktops</option>
                 <option value="Accessories (Mouse, Keyboard, Audio)">Accessories</option>
                 <option value="Printers / Scanners">Printers / Scanners</option>
                 <option value="CCTV / Security Systems">CCTV / Security Systems</option>
                 <option value="Smart Gadgets">Smart Gadgets</option>
                 <option value="Repair / Services">Workshops / Seminars</option>
                 <option value="Just Browsing">Just Browsing</option>
             </select>
          </div>

          {formData.buyingInterest === 'Other' && (
            <div className="input-group" style={{ marginBottom: 0, animation: 'fadeIn 0.3s ease-out' }}>
               <input 
                 className="form-input" 
                 type="text" 
                 name="buyingInterestDetails"
                 required
                 placeholder="Please specify..."
                 value={formData.buyingInterestDetails}
                 onChange={handleChange}
                 style={{ padding: '8px 10px', fontSize: '0.9rem' }}
               />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || showRegisteredError || (!emailVerified && !phoneVerified)} style={{ marginTop: '0.8rem', padding: '10px', fontSize: '1rem' }}>
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : 'CONFIRM DETAILS'}
          </button>
          
          <div className="text-center" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
             Ensure all details are correct before confirming.
          </div>
        </form>
      </div>
    </div>
  );
}

