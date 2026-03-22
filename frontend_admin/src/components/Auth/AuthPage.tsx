import { SignIn, SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useState } from 'react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
       <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ marginBottom: '20px' }}>
              <button 
                onClick={() => setIsLogin(true)}
                style={{ 
                    background: isLogin ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px 0 0 8px',
                    cursor: 'pointer',
                    fontWeight: isLogin ? 'bold' : 'normal'
                }}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                style={{ 
                    background: !isLogin ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '0 8px 8px 0',
                    cursor: 'pointer',
                    fontWeight: !isLogin ? 'bold' : 'normal'
                }}
              >
                Register
              </button>
          </div>

          {isLogin ? (
              <SignIn 
                routing="hash" 
                appearance={{
                    baseTheme: dark,
                    elements: {
                        card: "glass-card-clerk",
                        formButtonPrimary: "btn-primary",
                        footerActionLink: "text-accent",
                        headerTitle: "text-white orbitron-font",
                        headerSubtitle: "text-gray-400",
                        socialButtonsBlockButton: "text-white border-white/20 hover:bg-white/10",
                        formFieldInput: "bg-white/5 border-white/10 text-white",
                        formFieldLabel: "text-gray-300"
                    },
                    variables: {
                        colorPrimary: '#6366f1',
                        colorBackground: 'transparent',
                        colorText: 'white',
                        colorInputText: 'white',
                    }
                }}
                forceRedirectUrl="/dashboard"
              />
          ) : (
              <SignUp 
                routing="hash"
                appearance={{
                    baseTheme: dark,
                    elements: {
                        card: "glass-card-clerk",
                        formButtonPrimary: "btn-primary",
                        footerActionLink: "text-accent",
                        headerTitle: "text-white orbitron-font",
                        headerSubtitle: "text-gray-400",
                        socialButtonsBlockButton: "text-white border-white/20 hover:bg-white/10",
                        formFieldInput: "bg-white/5 border-white/10 text-white",
                        formFieldLabel: "text-gray-300"
                    },
                    variables: {
                        colorPrimary: '#6366f1',
                        colorBackground: 'transparent',
                        colorText: 'white',
                        colorInputText: 'white',
                    }
                }}
                forceRedirectUrl="/dashboard"
              />
          )}
       </div>
    </div>
  );
}
