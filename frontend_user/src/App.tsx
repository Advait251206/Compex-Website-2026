import { useState } from 'react';
import RegisterForm from './components/RegisterForm';
import ViewTicket from './components/ViewTicket';
import SuccessPage from './components/SuccessPage';
import TicketDisplay from './components/TicketDisplay';
import Background from './components/Layout/Background';

import LandingPage from './components/LandingPage';

function App() {
  const [step, setStep] = useState<'landing' | 'register' | 'view-ticket' | 'success' | 'display-ticket'>('landing');
  const [_email, setEmail] = useState('');
  const [_name, setName] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);

  const handleRegisterSuccess = (email: string, name: string, id: string) => {
    setEmail(email);
    setName(name);
    setTicketId(id);
    setStep('success'); 
  };

  const handleViewSuccess = (ticket: any) => {
    setTicketData(ticket);
    setStep('display-ticket');
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      {/* Background 3D Scene */}
      <Background />

      {/* Foreground Content */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', overflowY: 'auto' }}>
         <div className="app-container" style={{ flexDirection: 'column' }}>
            
            {/* Navigation Tabs - Only show when in register or view-ticket state */}
            {(step === 'register' || step === 'view-ticket') && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', zIndex: 10, width: '100%' }}>
                <button 
                  onClick={() => setStep('register')}
                  style={{
                    background: step === 'register' ? 'rgba(165, 180, 252, 0.2)' : 'transparent',
                    border: '1px solid ' + (step === 'register' ? '#a5b4fc' : 'rgba(255,255,255,0.2)'),
                    color: step === 'register' ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Register
                </button>
                <button 
                  onClick={() => setStep('view-ticket')}
                  style={{
                    background: step === 'view-ticket' ? 'rgba(165, 180, 252, 0.2)' : 'transparent',
                    border: '1px solid ' + (step === 'view-ticket' ? '#a5b4fc' : 'rgba(255,255,255,0.2)'),
                    color: step === 'view-ticket' ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  View Your Ticket
                </button>
              </div>
            )}

            {step === 'landing' && <LandingPage onGetStarted={() => setStep('register')} />}
            {step === 'register' && <RegisterForm onSuccess={handleRegisterSuccess} />}
            {step === 'view-ticket' && <ViewTicket onSuccess={handleViewSuccess} />}
            {step === 'success' && <SuccessPage ticketId={ticketId} />}
            {step === 'display-ticket' && ticketData && <TicketDisplay ticket={ticketData} onBack={() => setStep('register')} />}
         </div>
      </div>
    </div>
  );
}

export default App;

