import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Lock scrolling on mount
    document.body.style.overflow = 'hidden';
    
    // Unlock on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className='landing-container'>
      <h1 className='landing-title'>
        Comp-Ex <br className="mobile-break" /> Registration
      </h1>
      
      <p className='landing-desc'>
        COMP-EX is one of India’s most prominent Information Technology exhibitions and the largest IT expo in Central India, serving as a dynamic platform for innovation, business growth, and digital transformation
      </p>
      
      <button 
        className="btn-primary" 
        style={{ 
          width: 'auto',        
          minWidth: '180px',    
          padding: '1rem 2rem', 
          borderRadius: '50px' 
        }}
        onClick={() => navigate('/auth')}
      >
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;
