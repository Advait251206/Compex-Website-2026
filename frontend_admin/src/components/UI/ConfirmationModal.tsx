interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-card" style={{ 
        maxWidth: '400px', 
        padding: '2rem',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          color: variant === 'danger' ? '#ef4444' : 'white',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '1.25rem'
        }}>
          {title}
        </h3>
        
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, sans-serif',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              background: variant === 'danger' ? 'rgba(239, 68, 68, 0.8)' : '#6366f1',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: variant === 'danger' 
                ? '0 4px 15px rgba(239, 68, 68, 0.4)' 
                : '0 4px 15px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
