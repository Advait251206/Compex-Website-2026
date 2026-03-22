import { Outlet, NavLink } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useState } from 'react';

export default function DashboardLayout() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const handleLogout = () => {
    signOut({ redirectUrl: '/' });
  };



  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Loading State - Block everything until we know who the user is
  if (!isLoaded) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'black', 
        color: 'white',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        LOADING SECURITY PROTOCOLS...
      </div>
    );
  }

  // 2. Security Check
  if (user) {
    const userEmail = user.primaryEmailAddress?.emailAddress;
    // Update allowed admins to include visitcompex
    const allowedAdmins = ['advaitkawale@gmail.com', 'compex251206@gmail.com', 'visitcompex@gmail.com', 'praveshpshrivastava@gmail.com'];
    
    if (!userEmail || !allowedAdmins.includes(userEmail)) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white',
          background: 'rgba(0,0,0,0.8)',
          gap: '1rem'
        }}>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', color: '#ff6b6b' }}>ACCESS DENIED</h1>
          <p>You are not authorized to access this administrative dashboard.</p>
          <p style={{ opacity: 0.7 }}>Variable: {userEmail}</p>
          <button 
            onClick={() => signOut({ redirectUrl: '/' })}
            style={{
              padding: '10px 20px',
              background: '#ff6b6b',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Sign Out
          </button>
        </div>
      );
    }
  }

  // Define Nav Items based on Role
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  // Full Admins can see everything (Database + Scanner)
  const fullAdmins = ['advaitkawale@gmail.com', 'visitcompex@gmail.com', 'praveshpshrivastava@gmail.com'];
  const isFullAdmin = userEmail && fullAdmins.includes(userEmail);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Scanner', path: '/admin/scanner', icon: '📷' },
    // Only show Database Access for Full Admins
    ...(isFullAdmin ? [{ name: 'Database Access', path: '/admin/database', icon: '🗄️' }] : []),
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsSidebarOpen(true)}
      >
        ☰ MENU
      </button>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>×</button>

        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
           <h2 style={{ fontSize: '1.2rem', color: '#a5b4fc', letterSpacing: '2px', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)', margin: 0 }}>COMP-EX</h2>
           <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
              {user?.firstName ? `WELCOME, ${user.firstName.toUpperCase()}` : 'DASHBOARD'}
           </span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => setIsSidebarOpen(false)} // Close on navigate
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.9rem',
                letterSpacing: '0.5px'
              })}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          style={{
            marginTop: 'auto',
            background: 'rgba(255, 99, 99, 0.1)',
            border: '1px solid rgba(255, 99, 99, 0.2)',
            color: '#ff8888',
            padding: '12px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: 'Orbitron, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 99, 99, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 99, 99, 0.1)'}
        >
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
