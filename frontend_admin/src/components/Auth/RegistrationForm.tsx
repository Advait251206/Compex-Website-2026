import { useState } from 'react';
import CustomDatePicker from '../UI/CustomDatePicker';
import PasswordInput from '../UI/PasswordInput';
import { authAPI } from '../../services/api';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

interface RegistrationFormProps {
  onSuccess: (email: string) => void;
  onLoginClick?: () => void;
}

export default function RegistrationForm({ onSuccess, onLoginClick }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    referralSource: '',
    otherReferralSource: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return "Password must be at least 8 characters long.";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter.";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecialChar) return "Password must contain at least one special character.";
    return null;
  };

  const passwordCriteria = [
    { label: "At least 8 characters", valid: formData.password.length >= 8 },
    { label: "At least one uppercase letter", valid: /[A-Z]/.test(formData.password) },
    { label: "At least one lowercase letter", valid: /[a-z]/.test(formData.password) },
    { label: "At least one number", valid: /\d/.test(formData.password) },
    { label: "At least one special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Password Validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Prepare API data
      const apiData = { ...formData };
      
      // Handle "Other" referral source
      if (apiData.referralSource === 'Other') {
        apiData.referralSource = `Other: ${apiData.otherReferralSource}`;
      }
      
      // Initial cleanup
      delete (apiData as any).confirmPassword;
      delete (apiData as any).otherReferralSource;

      await authAPI.register(apiData);
      onSuccess(formData.email);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RequiredStar = () => <span style={{ color: 'var(--error-color)' }}> *</span>;

  return (
    <div className="glass-card">
      <h2 className="text-center" style={{ color: '#a5b4fc', textShadow: '0 0 10px rgba(165, 180, 252, 0.3)' }}>REGISTRATION FORM</h2>
      <p className="text-center" style={{ marginBottom: '2rem', letterSpacing: '2px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>COMP-EX 2026</p>

      {/* Google Sign-In Section */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse: CredentialResponse) => {
              try {
                if (credentialResponse.credential) {
                  setLoading(true);
                  const response = await authAPI.googleLogin(credentialResponse.credential);
                  console.log("Google Login Success:", response.data);
                  // TODO: Handle success (redirect to dashboard or complete profile)
                  // For now, let's just callback with email
                  onSuccess(response.data.data.user.email); 
                }
              } catch (err: any) {
                console.error("Google Login Error:", err);
                setError("Google Sign-In failed. Please try again.");
              } finally {
                 setLoading(false);
              }
            }}
            onError={() => {
              setError("Google Sign-In failed. Please try again.");
            }}
            theme="filled_black"
            shape="pill"
            text="signup_with"
            width="300"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span>OR REGISTER WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>
      </div>

      {error && <div className="error-msg" style={{ position: 'relative', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">First Name<RequiredStar /></label>
            <input
              type="text"
              name="firstName"
              className="form-input"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Last Name<RequiredStar /></label>
            <input
              type="text"
              name="lastName"
              className="form-input"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Email Address<RequiredStar /></label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <PasswordInput
             label="Password"
             name="password"
             className="form-input"
             value={formData.password}
             onChange={handleChange}
             required
          />
          <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {passwordCriteria.map((criterion, index) => (
              <div 
                key={index} 
                style={{ 
                  color: criterion.valid ? 'var(--success-color)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>{criterion.valid ? '✓' : '○'}</span>
                {criterion.label}
              </div>
            ))}
          </div>
        </div>

        <div className="input-group">
          <PasswordInput
             label="Confirm Password"
             name="confirmPassword"
             className="form-input"
             value={formData.confirmPassword}
             onChange={handleChange}
             required
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Gender<RequiredStar /></label>
            <select
              name="gender"
              className="form-input"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Date of Birth<RequiredStar /></label>
            <CustomDatePicker
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              placeholder="DD-MM-YYYY"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">How did you hear about us?</label>
          <select
            name="referralSource"
            className="form-input"
            value={formData.referralSource}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select option</option>
            <option value="Social Media">Social Media</option>
            <option value="Friend / Referral">Friend / Referral</option>
            <option value="Google Search">Google Search</option>
            <option value="Advertisement">Advertisement</option>
            <option value="Other">Other</option>
          </select>
          
          {formData.referralSource === 'Other' && (
            <input
              type="text"
              name="otherReferralSource"
              className="form-input"
              style={{ marginTop: '0.5rem' }}
              value={formData.otherReferralSource}
              onChange={handleChange}
              required
              placeholder="Please specify..."
            />
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'REGISTER'}
        </button>

        <div className="text-center mt-4">
            <p className="mb-4">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={onLoginClick}
                  style={{ 
                    background: 'none', 
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--accent-color)', 
                    textDecoration: 'underline',
                    fontSize: 'inherit'
                  }}
                >
                  Login
                </button>
            </p>
        </div>
      </form>
    </div>
  );
}
