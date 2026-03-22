import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ticketAPI } from '../../services/api';
import ConfirmationModal from '../UI/ConfirmationModal';

interface Ticket {
  _id: string;
  holderName: string;
  holderEmail: string;
  holderGender: string;
  holderDob: string;
  status: string;
  createdAt: string;
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    variant: 'info' as 'info' | 'danger' | 'warning',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  // Toast State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        
        const response = await ticketAPI.getMyTickets(token);
        setTickets(response.data.data);
      } catch (err: any) {
        setError('Failed to load tickets.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [getToken]);

  const initiateCancel = (id: string) => {
    setModalConfig({
        title: 'Cancel Ticket?',
        message: 'Are you sure you want to cancel this ticket? You may not be able to undo this action.',
        variant: 'warning',
        confirmText: 'Yes, Cancel It',
        onConfirm: () => performCancel(id)
    });
    setModalOpen(true);
  };

  const initiateDelete = (id: string) => {
    setModalConfig({
        title: 'Delete Ticket?',
        message: 'This action cannot be undone. The ticket will be permanently removed from your history.',
        variant: 'danger',
        confirmText: 'Permanently Delete',
        onConfirm: () => performDelete(id)
    });
    setModalOpen(true);
  };

  const performCancel = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await ticketAPI.cancelTicket(id, token);
      // Update local state to reflect cancellation
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'cancelled' } : t));
      setModalOpen(false);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Cancellation failed', 'error');
    }
  };

  const performDelete = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await ticketAPI.deleteTicket(id, token);
      // Remove from local state
      setTickets(prev => prev.filter(t => t._id !== id));
      setModalOpen(false);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Deletion failed', 'error');
    }
  };

  const handleDownload = async (ticket: Ticket) => {
    try {
        const token = await getToken();
        if(!token) return;

        const response = await ticketAPI.downloadTicket(ticket._id, token);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `CompEx2026-Ticket-${ticket._id.slice(-6).toUpperCase()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (err) {
        console.error(err);
        showNotification('Failed to download ticket.', 'error');
    }
  };

  const initiateEmail = (id: string) => {
    setModalConfig({
        title: 'Send Ticket via Email',
        message: 'This will send a PDF copy of your ticket to your registered email address.',
        variant: 'info',
        confirmText: 'Send Email',
        onConfirm: () => performEmail(id)
    });
    setModalOpen(true);
  };

  const performEmail = async (id: string) => {
      try {
          const token = await getToken();
          if(!token) return;
          
          const response = await ticketAPI.emailTicket(id, token);
          
          // Handle Soft Error (Cooldown)
          if (response.data && response.data.success === false) {
             showNotification(response.data.message, 'error');
             setModalOpen(false);
             return;
          }

          setModalOpen(false);
          // Optional: Show a success toast/message better than alert, but alert for now as requested by "no dialog box" probably meant the confirm/cancel one. 
          // Actually user said "I don't want such a dialog box" referring to window.confirm. 
          // We can keep a simple success alert or just console log.
          // Let's stick to a simple alert for success or just silent. 
          // Given the user dislikes native dialogs, I'll use a small timeout to close modal then show nothing or a non-blocking toast if I had one.
          // For now, I'll just close modal.
          showNotification('Ticket sent successfully to your email!', 'success');
      } catch (err: any) {
          // Handle Rate Limiting (Cooldown) - Legacy catch in case backend sends 429
          if (err.response && err.response.status === 429) {
             showNotification(err.response.data.message || 'Please wait before sending another email.', 'error');
             // We don't console.error here to avoid spamming the console for expected behavior
          } else {
             console.error(err);
             showNotification('Failed to send email.', 'error');
          }
      }
  };

  return (
    <div className="auth-page-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          zIndex: 2000,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          fontFamily: 'Orbitron, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
        </div>
      )}

      <ConfirmationModal 
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
        variant={modalConfig.variant}
        confirmText={modalConfig.confirmText}
      />

      <div className="glass-card" style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <h2 style={{ color: '#a5b4fc', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)', margin: 0 }}>MY TICKETS</h2>
             <button 
                onClick={() => navigate('/tickets/book')}
                className="btn-primary" 
                style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
             >
                + NEW TICKET
             </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {loading ? (
           <div className="text-center" style={{ color: 'white' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
           <div className="text-center" style={{ padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
              <p>You haven't booked any tickets yet.</p>
           </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {tickets.map(ticket => (
              <div 
                key={ticket._id} 
                className="ticket-card"
              >
                <div className="ticket-info">
                   <h3>{ticket.holderName}</h3>
                   <p>{ticket.holderEmail}</p>
                   <div className="ticket-meta">
                      <span>Gender: {ticket.holderGender}</span>
                      <span>•</span>
                      <span>DOB: {new Date(ticket.holderDob).toLocaleDateString()}</span>
                   </div>
                </div>
                <div className="ticket-actions">
                    <span style={{ 
                        background: ticket.status === 'booked' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        color: ticket.status === 'booked' ? '#4ade80' : '#f87171',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        {ticket.status}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        Booked on {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    
                    {ticket.status === 'booked' && (
                        <button
                            onClick={() => initiateCancel(ticket._id)}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                padding: '6px 16px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'Orbitron, sans-serif'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                            CANCEL
                        </button>
                    )}

                    {ticket.status === 'booked' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => handleDownload(ticket)}
                                style={{
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: '#a5b4fc',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontFamily: 'Orbitron, sans-serif'
                                }}
                            >
                                ⬇ PDF
                            </button>
                            <button
                                onClick={() => initiateEmail(ticket._id)}
                                style={{
                                    background: 'rgba(6, 182, 212, 0.1)',
                                    color: '#22d3ee',
                                    border: '1px solid rgba(6, 182, 212, 0.2)',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontFamily: 'Orbitron, sans-serif'
                                }}
                            >
                                ✉ EMAIL
                            </button>
                        </div>
                    )}
                    
                    {ticket.status === 'cancelled' && (
                        <button
                            onClick={() => initiateDelete(ticket._id)}
                            style={{
                                background: 'rgba(107, 114, 128, 0.2)',
                                color: '#9ca3af',
                                border: '1px solid rgba(107, 114, 128, 0.3)',
                                padding: '6px 16px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'Orbitron, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
                                e.currentTarget.style.color = '#9ca3af';
                                e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)';
                            }}
                        >
                            DELETE
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
             <button 
                onClick={() => navigate('/dashboard')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Back to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
}
