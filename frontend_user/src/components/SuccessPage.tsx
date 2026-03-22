import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import api from '../api';
import TicketDisplay from './TicketDisplay';

interface SuccessProps {
  ticketId: string;
  // email removed as unused
}

export default function SuccessPage({ ticketId }: SuccessProps) {
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchTicket = async () => {
         try {
             // Fetch full ticket details including QR code
             const res = await api.get(`/user/ticket/${ticketId}`);
             setTicketData(res.data.ticket);
         } catch (err) {
             console.error("Failed to fetch ticket details", err);
         } finally {
             setLoading(false);
         }
     };

     if (ticketId) {
         fetchTicket();
     }
  }, [ticketId]);

  // If we have the ticket data, show the beautiful Ticket Display
  if (ticketData) {
      return (
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              <TicketDisplay 
                ticket={ticketData} 
                onBack={() => window.location.reload()} 
              />
          </div>
      );
  }

  // Fallback / Loading State (The original Simple Success Card)
  return (
    <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center' }}>
      {loading ? (
          <div className="spinner" style={{ margin: '2rem auto' }}></div>
      ) : (
          <>
            <CheckCircle size={80} className="text-success" style={{ margin: '0 auto 1.5rem auto' }} />
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#51cf66' }}>SUCCESS!</h1>
            
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                Your ticket has been generated successfully!
            </p>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ticket ID</p>
                <code style={{ fontSize: '1.2rem', color: '#a5b4fc', letterSpacing: '2px' }}>{ticketId.slice(-8).toUpperCase()}</code>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                Please check your contact method or download below.
            </p>
            
            <button className="btn-primary"  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => window.location.reload()}>
                Register Another Person
            </button>
          </>
      )}
    </div>
  );
}
