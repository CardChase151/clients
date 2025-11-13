import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin?: () => void;
}

function Login({ onLogin }: LoginProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    // Demo login for template purposes
    if (email === 'viewer@gmail.com' && password === 'view') {
      setTimeout(() => {
        setIsLoggingIn(false);
        setLoginSuccess(true);
        setTimeout(() => {
          // Simulate auth by creating a fake session in localStorage
          localStorage.setItem('demoAuth', 'true');
          if (onLogin) {
            onLogin();
          }
          window.location.reload(); // Refresh to trigger auth state change
        }, 1500);
      }, 1000);
      return;
    }

    // Real Supabase login
    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoggingIn(false);
    } else {
      setIsLoggingIn(false);
      setLoginSuccess(true);
      setTimeout(() => {
        if (onLogin) {
          onLogin();
        }
      }, 1500);
    }
  };

  if (loginSuccess) {
    return (
      <div style={{
        backgroundColor: '#0F1623',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        color: '#E2F4FF'
      }}>
        <div style={{
          fontSize: '60px',
          color: '#00D1FF',
          marginBottom: '20px',
          animation: 'bounce 0.6s ease-in-out'
        }}>
          ✓
        </div>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '800',
          textAlign: 'center',
          color: '#00D1FF'
        }}>
          Login Successful!
        </h2>
        <style>{`
          @keyframes bounce {
            0%, 20%, 60%, 100% { transform: translateY(0); }
            40% { transform: translateY(-30px); }
            80% { transform: translateY(-15px); }
          }
        `}</style>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: '#101A2B',
    border: '1px solid #1b2a44',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#E2F4FF',
    fontSize: '16px',
    width: '100%',
    marginBottom: '16px',
    outline: 'none'
  };

  const buttonStyle = {
    backgroundColor: '#00D1FF',
    color: '#0F1623',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '900',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '12px'
  };

  const secondaryButtonStyle = {
    backgroundColor: '#101A2B',
    color: '#E2F4FF',
    border: '1px solid #1b2a44',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    marginRight: '12px'
  };

  return (
    <div style={{
      backgroundColor: '#0F1623',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      color: '#E2F4FF'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '800', 
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Login to [APP NAME]
        </h2>
        
        <form onSubmit={handleLogin} style={{ marginBottom: '24px' }}>
          {error && (
            <div style={{
              color: '#FF6B6B',
              backgroundColor: '#2A1A1A',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <input
            type="email"
            placeholder="viewer@gmail.com (demo) or your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="view (demo) or your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle} disabled={isLoggingIn}>
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => window.location.href = '/signup'}
            style={secondaryButtonStyle}
          >
            Sign Up
          </button>
          <button
            onClick={() => window.location.href = '/forgot-password'}
            style={secondaryButtonStyle}
          >
            Forgot Password
          </button>
        </div>

        {/* App Data Debug Link */}
        <button
          onClick={() => navigate('/debug')}
          disabled={isLoggingIn}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: '#7A8CA0',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: isLoggingIn ? 'not-allowed' : 'pointer',
            transition: 'color 0.2s',
            opacity: isLoggingIn ? 0.5 : 1,
            marginTop: '12px'
          }}
          onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.color = '#00D1FF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#7A8CA0')}
        >
          App Data
        </button>
      </div>
    </div>
  );
}

export default Login;