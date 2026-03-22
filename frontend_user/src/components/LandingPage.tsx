

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {



  return (
    <div className='landing-container'>
      <h1 className='landing-title'>
        Comp-Ex 2026<br className="mobile-break" /> Registration
      </h1>
      
      <p className='landing-desc'>
        <span style={{ fontSize: '1.2em' }}>
          Event Date: <span style={{  
            background: 'linear-gradient(to bottom right, #ffffff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>5th to 8th February</span>
        </span>
        <br />
        <span style={{ fontSize: '1.2em' }}>
          Venue: <span style={{ 
            background: 'linear-gradient(to bottom right, #ffffff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>St. Ursula School Ground, Near VCA Stadium, Civil Lines, Nagpur</span>
        </span>
      </p>
      
      <button 
        className="btn-primary" 
        style={{ 
          width: 'auto',        
          minWidth: '220px',    
          padding: '1rem 2rem', 
          borderRadius: '50px' 
        }}
        onClick={onGetStarted}
      >
        Get your free tickets
      </button>

      <div style={{
        marginTop: '2rem',
        padding: '0.8rem 1.5rem',
        border: '1px solid #ff7300',
        borderRadius: '12px',
        background: 'rgba(253, 224, 71, 0.1)',
        backdropFilter: 'blur(4px)',
        display: 'inline-block'
      }}>
        <p style={{ 
          margin: 0,
          fontSize: '1rem', 
          color: '#ff7b00', 
          letterSpacing: '1px',
          fontFamily: 'Orbitron',
          fontWeight: 'bold',
          textShadow: '0 0 15px rgba(255, 137, 2, 0.4)'
        }}>
          LIMITED FREE TICKETS 
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
