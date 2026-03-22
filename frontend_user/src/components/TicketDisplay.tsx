import { useState } from 'react';
import { Download, Mail, CheckCircle, Phone } from 'lucide-react';
import api from '../api';

interface TicketData {
  id: string;
  holderName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  qrCode: string;
}

interface TicketDisplayProps {
  ticket: TicketData;
  onBack: () => void;
}

export default function TicketDisplay({ ticket, onBack }: TicketDisplayProps) {
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Add Email State
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addEmailStep, setAddEmailStep] = useState<'input' | 'otp'>('input');
  const [emailOtp, setEmailOtp] = useState('');
  const [addEmailLoading, setAddEmailLoading] = useState(false);
  const [localTicketEmail, setLocalTicketEmail] = useState(ticket.email); // Track locally updated email

  // Exact 45-degree chamfered corners
  const chamferPoly = 'polygon(' +
    '30px 0, ' +                 // Top-Left start
    'calc(100% - 30px) 0, ' +    // Top-Right start
    '100% 30px, ' +              // Top-Right end
    '100% calc(100% - 30px), ' + // Bottom-Right start
    'calc(100% - 30px) 100%, ' + // Bottom-Right end
    '30px 100%, ' +              // Bottom-Left start
    '0 calc(100% - 30px), ' +    // Bottom-Left end
    '0 30px' +                   // Top-Left end
  ')';

  const handleDownload = () => {
    const url = `${api.defaults.baseURL}/user/ticket/${ticket.id}/download`;
    window.open(url, '_blank');
  };

  const handleEmailAction = () => {
      if (!localTicketEmail) {
          setShowAddEmail(true);
      } else {
          sendTicketEmail();
      }
  };

  const sendTicketEmail = async () => {
    setEmailLoading(true);
    try {
      await api.post(`/user/ticket/${ticket.id}/email`);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to email ticket', err);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Add Email Flow
  const handleSendAddEmailOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setAddEmailLoading(true);
      try {
          await api.post(`/user/ticket/${ticket.id}/update-email-otp`, { email: newEmail });
          setAddEmailStep('otp');
      } catch (err: any) {
          alert(err.response?.data?.message || "Failed to send OTP");
      } finally {
          setAddEmailLoading(false);
      }
  };

  const handleVerifyAddEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      setAddEmailLoading(true);
      try {
          const res = await api.post(`/user/ticket/${ticket.id}/verify-email-update`, { email: newEmail, otp: emailOtp });
          // Success
          setLocalTicketEmail(res.data.email);
          setShowAddEmail(false);
          // Auto send ticket after adding
          setTimeout(() => sendTicketEmail(), 500); 
      } catch (err: any) {
          alert(err.response?.data?.message || "Failed to verify OTP");
      } finally {
          setAddEmailLoading(false);
      }
  };

  // Add Phone State
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [addPhoneStep, setAddPhoneStep] = useState<'input' | 'otp'>('input');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [addPhoneLoading, setAddPhoneLoading] = useState(false);
  const [localTicketPhone, setLocalTicketPhone] = useState(ticket.phone);

  const handlePhoneAction = () => {
      if (!localTicketPhone) {
          setShowAddPhone(true);
      }
  };

  const handleSendAddPhoneOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setAddPhoneLoading(true);
      try {
          await api.post(`/user/ticket/${ticket.id}/update-phone-otp`, { phone: newPhone });
          setAddPhoneStep('otp');
      } catch (err: any) {
          alert(err.response?.data?.message || "Failed to send OTP");
      } finally {
          setAddPhoneLoading(false);
      }
  };

  const handleVerifyAddPhone = async (e: React.FormEvent) => {
      e.preventDefault();
      setAddPhoneLoading(true);
      try {
          const res = await api.post(`/user/ticket/${ticket.id}/verify-phone-update`, { phone: newPhone, otp: phoneOtp });
          setLocalTicketPhone(res.data.phone);
          setShowAddPhone(false);
      } catch (err: any) {
          alert(err.response?.data?.message || "Failed to verify OTP");
      } finally {
          setAddPhoneLoading(false);
      }
  };

  // Helper for Data Rows - Compact
  const DataRow = ({ label, value }: { label: string, value: string }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
      <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'Courier New', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: '#ffffff', fontSize: '0.9rem', fontFamily: 'Courier New', fontWeight: 'bold', letterSpacing: '1px' }}>{value || '-'}</span>
    </div>
  );

  return (
    <div className="ticket-display-container" style={{ padding: '0.5rem', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      
      {/* MODAL FOR ADDING EMAIL */}
      {showAddEmail && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-card" style={{ width: '90%', maxWidth: '400px', position: 'relative' }}>
                  <button onClick={() => setShowAddEmail(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                  <h3 style={{ color: 'white', marginBottom: '1rem' }}>{addEmailStep === 'input' ? 'Add Email Address' : 'Verify Email'}</h3>
                  
                  {addEmailStep === 'input' ? (
                      <form onSubmit={handleSendAddEmailOtp}>
                          <input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="form-input" 
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)} 
                            required 
                            autoFocus
                          />
                          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={addEmailLoading}>
                              {addEmailLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                      </form>
                  ) : (
                      <form onSubmit={handleVerifyAddEmail}>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter OTP sent to {newEmail}</p>
                          <input 
                            type="text" 
                            placeholder="OTP" 
                            className="form-input text-center" 
                            maxLength={6}
                            value={emailOtp} 
                            onChange={e => setEmailOtp(e.target.value)} 
                            required 
                            autoFocus
                          />
                          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={addEmailLoading}>
                              {addEmailLoading ? 'Verifying...' : 'Verify & Link'}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* MODAL FOR ADDING PHONE */}
      {showAddPhone && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-card" style={{ width: '90%', maxWidth: '400px', position: 'relative' }}>
                  <button onClick={() => setShowAddPhone(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                  <h3 style={{ color: 'white', marginBottom: '1rem' }}>{addPhoneStep === 'input' ? 'Add Phone Number' : 'Verify Phone'}</h3>
                  
                  {addPhoneStep === 'input' ? (
                      <form onSubmit={handleSendAddPhoneOtp}>
                          <input 
                            type="tel" 
                            placeholder="Enter 10-digit Phone" 
                            className="form-input" 
                            value={newPhone} 
                            onChange={e => setNewPhone(e.target.value)} 
                            required 
                            autoFocus
                            minLength={10}
                            maxLength={10}
                          />
                          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={addPhoneLoading}>
                              {addPhoneLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                      </form>
                  ) : (
                      <form onSubmit={handleVerifyAddPhone}>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter OTP sent to {newPhone}</p>
                          <input 
                            type="text" 
                            placeholder="OTP" 
                            className="form-input text-center" 
                            maxLength={6}
                            value={phoneOtp} 
                            onChange={e => setPhoneOtp(e.target.value)} 
                            required 
                            autoFocus
                          />
                          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={addPhoneLoading}>
                              {addPhoneLoading ? 'Verifying...' : 'Verify & Link'}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* Success Banner */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', animation: 'fadeIn 0.5s ease-out', transform: 'scale(0.9)' }}>
         <div style={{ background: 'rgba(0, 243, 255, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1.5rem', borderRadius: '30px', border: '1px solid rgba(0, 243, 255, 0.3)' }}>
            <CheckCircle color="#00f3ff" size={16} />
            <span style={{ color: '#00f3ff', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'Courier New', fontSize: '0.9rem' }}>VERIFICATION SUCCESSFUL</span>
         </div>
         <h1 style={{ marginTop: '0.5rem', fontSize: '1.5rem', color: 'white', textShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: 'Segoe UI, sans-serif' }}>
            WELCOME, {ticket.holderName.split(' ')[0].toUpperCase()}!
         </h1>
      </div>

      {/* TICKET CARD CONTAINER - The Cyan Border */}
      <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '750px', // Reduced width
          padding: '2px', 
          background: '#00f3ff', 
          clipPath: chamferPoly,
          animation: 'slideUp 0.6s ease-out',
          boxShadow: '0 0 40px rgba(0, 243, 255, 0.15)'
      }}>
        
        {/* INNER CONTENT - Black Background */}
        <div style={{ 
            background: '#050508', 
            width: '100%',
            height: '100%',
            clipPath: chamferPoly, 
            padding: '2rem 2.5rem', // Reduced padding
            boxSizing: 'border-box',
            position: 'relative' 
        }}>
            



            {/* HEADER SECTION */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #bc13fe', paddingBottom: '0.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                <h2 style={{ margin: 0, color: '#ffffff', fontSize: '2rem', letterSpacing: '4px', fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>COMP-EX 2026</h2>
                <p style={{ margin: '5px 0 0 0', color: '#00f3ff', fontSize: '0.8rem', letterSpacing: '4px', fontFamily: 'Courier New', textTransform: 'uppercase', fontWeight: 'bold' }}>OFFICIAL ENTRY PASS PROTOCOL</p>
            </div>

            {/* CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1.5rem' }}>
              
              {/* Left Column: Data Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem' }}>
                 <DataRow label="TICKET ID" value={ticket.id.slice(-8).toUpperCase()} />
                 <DataRow label="ATTENDEE" value={ticket.holderName.toUpperCase()} />
                 <DataRow label="EMAIL" value={localTicketEmail} />
                 <DataRow label="PHONE" value={localTicketPhone} />
                 <DataRow label="GENDER" value={ticket.gender ? ticket.gender.toUpperCase() : 'N/A'} />
                 <DataRow label="DOB" value={new Date(ticket.dob).toLocaleDateString('en-GB')} /> 
              </div>

              {/* Right Column: QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                      padding: '8px', 
                      background: 'white', 
                      border: '4px solid #00f3ff', 
                      width: '160px', // Reduced size
                      height: '160px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                  }}>
                    <img src={ticket.qrCode} alt="Ticket QR" style={{ width: '100%', height: '100%' }} />
                  </div>
                  <span style={{ marginTop: '0.8rem', color: '#bc13fe', letterSpacing: '2px', fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'Courier New' }}>SCAN_ME</span>
              </div>
            </div>

            {/* FOOTER TEXT */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.55rem', color: '#64748b', fontFamily: 'Courier New', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    AUTHORIZED PERSONNEL ONLY • SYSTEM GENERATED • INVALID WITHOUT QR
                </p>
            </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={handleDownload}
          className="btn-primary"
          style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: '#00f3ff', color: 'black', border: 'none', fontWeight: 'bold',
              padding: '0.8rem 1.5rem', fontSize: '0.9rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
          }}
        >
          <Download size={18} />
          DOWNLOAD PDF
        </button>
        
        <button 
          onClick={handleEmailAction}
          className="btn-secondary"
          disabled={emailLoading || emailSuccess}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: emailSuccess ? '#10b981' : (localTicketEmail ? 'transparent' : '#bc13fe'), 
            color: 'white', border: localTicketEmail ? '1px solid rgba(255,255,255,0.2)' : 'none',
            cursor: emailLoading ? 'not-allowed' : 'pointer',
             padding: '0.8rem 1.5rem', fontSize: '0.9rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
          }}
        >
           {emailSuccess ? <CheckCircle size={18} /> : <Mail size={18} />}
           {emailSuccess ? 'SENT!' : (emailLoading ? 'SENDING...' : (localTicketEmail ? 'EMAIL TICKET' : 'ADD EMAIL TO SEND'))}
        </button>

        {/* Add Phone Button - Only shows if no phone linked */}
        {!localTicketPhone && (
            <button 
                onClick={handlePhoneAction}
                className="btn-secondary"
                disabled={addPhoneLoading}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    background: '#bc13fe', 
                    color: 'white', border: 'none',
                    cursor: addPhoneLoading ? 'not-allowed' : 'pointer',
                    padding: '0.8rem 1.5rem', fontSize: '0.9rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
            >
                <Phone size={18} />
                {addPhoneLoading ? 'SENDING...' : 'ADD PHONE'}
            </button>
        )}

        <button 
          onClick={onBack}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'transparent', 
            color: 'white', border: '1px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
             padding: '0.8rem 1.5rem', fontSize: '0.9rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
             transition: 'all 0.3s ease'
          }}
        >
           BACK TO HOME
        </button>
      </div>

       {/* Mobile Responsive Style Override */}
       <style>{`
         @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
         @media (max-width: 768px) {
           .ticket-display-container { padding: 10px !important; }
           
           /* Reduce width of card on mobile */
           .ticket-display-container > div:nth-child(2) {
               width: 95% !important;
           }

           /* Content Grid: Switch to Column, Reverse Order to put QR on Top */
           .ticket-display-container > div > div > div { 
             display: flex !important;
             flex-direction: column-reverse !important;
             gap: 2rem !important;
             align-items: center !important;
             text-align: center !important;
           }

           /* Removing Left Padding from Details Column */
           .ticket-display-container > div > div > div > div:first-child { 
              padding-left: 0 !important;
              width: 100% !important;
              align-items: center !important; /* Center align text rows */
           }
           
           /* Center the DataRows content */
           .ticket-display-container > div > div > div > div:first-child > div {
               grid-template-columns: 1fr !important; /* Stack label/value */
               text-align: center !important;
               justify-items: center !important;
               gap: 0 !important;
               margin-bottom: 0.5rem !important;
           }
         }
       `}</style>
    </div>
  );
}
