import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const userName = user?.firstName || 'User';
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
        try {
            const token = await getToken();
            if(!token) return;
            const res = await ticketAPI.getProfile(token);
            if (res.data.data.role === 'admin') {
                setIsAdmin(true);
            }
        } catch (err) {
            console.error('Failed to fetch user role', err);
        }
    };
    checkRole();
  }, [getToken]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="dashboard-welcome-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <h1 className="dashboard-title">
                Welcome <span style={{ color: '#8b5cf6' }}>{userName}</span>
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Manage your tickets, profile, and more from your dashboard.
                </p>
            </div>
            {isAdmin && (
                <div style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px', 
                    background: 'rgba(244, 63, 94, 0.1)', 
                    border: '1px solid #f43f5e', 
                    color: '#f43f5e',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    letterSpacing: '1px'
                }}>
                    ADMIN DETECTED
                </div>
            )}
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Admin Card */}
        {isAdmin && (
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(244, 63, 94, 0.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#f43f5e' }}></div>
                <h3 style={{ color: '#f43f5e' }}>Admin Controls</h3>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                    Verify entries and manage event logistics.
                </p>
                <button 
                    onClick={() => navigate('/admin/scanner')}
                    className="btn-primary"
                    style={{ 
                        marginTop: '1.5rem', 
                        background: 'linear-gradient(45deg, #f43f5e, #be123c)',
                        boxShadow: '0 0 15px rgba(244, 63, 94, 0.4)' 
                    }}
                >
                    SCAN TICKETS 📷
                </button>
            </div>
        )}

        <div className="glass-card" style={{ padding: '2rem' }}>
           <h3>Latest Event</h3>
           <p style={{marginTop: '1rem'}}>COMP-EX 2026</p>
           <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Central India's Largest IT Expo</p>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
           <h3>Quick Status</h3>
           <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <span style={{ 
                padding: '4px 12px', 
                background: 'rgba(16, 185, 129, 0.2)', 
                color: '#34d399', 
                borderRadius: '20px', 
                fontSize: '0.8rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                Active
              </span>
           </div>
        </div>
      </div>
    </div>
  );
}
