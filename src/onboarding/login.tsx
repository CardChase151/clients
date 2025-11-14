import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin?: () => void;
}

function Login({ onLogin }: LoginProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useOTP, setUseOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const { error } = await signIn(email, '', true); // OTP login
      if (error) {
        setError(error.message);
        setIsLoggingIn(false);
      } else {
        setOtpSent(true);
        setIsLoggingIn(false);
      }
    } catch (err) {
      setError('Failed to send OTP');
      setIsLoggingIn(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      // Verify OTP logic here
      setIsLoggingIn(false);
      setLoginSuccess(true);
      setTimeout(() => {
        if (onLogin) {
          onLogin();
        }
      }, 1500);
    } catch (err) {
      setError('Invalid OTP');
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

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

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setIsLoggingIn(false);
    }
  };

  if (loginSuccess) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        color: '#FFFFFF'
      }}>
        <div style={{
          fontSize: '60px',
          color: '#FFFFFF',
          marginBottom: '20px',
          animation: 'bounce 0.6s ease-in-out'
        }}>
          ✓
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          textAlign: 'center',
          color: '#FFFFFF'
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

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1A1A1A',
    border: '1px solid #333333',
    borderRadius: '8px',
    padding: '16px 20px',
    color: '#FFFFFF',
    fontSize: '16px',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '16px',
    transition: 'opacity 0.2s',
    boxSizing: 'border-box'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '1px solid #333333',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '12px',
    transition: 'background-color 0.2s',
    boxSizing: 'border-box'
  };

  const googleButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '1px solid #333333',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'background-color 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      color: '#FFFFFF'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '48px',
          textAlign: 'center',
          letterSpacing: '-0.5px'
        }}>
          Welcome Back
        </h1>

        {error && (
          <div style={{
            color: '#FF4444',
            backgroundColor: '#1A1A1A',
            border: '1px solid #FF4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          style={googleButtonStyle}
          disabled={isLoggingIn}
          onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.backgroundColor = '#1A1A1A')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
            <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
            <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.192 5.736 7.396 3.977 10 3.977z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333333' }} />
          <span style={{ color: '#666666', fontSize: '14px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333333' }} />
        </div>

        {!useOTP ? (
          <form onSubmit={handleLogin} style={{ marginBottom: '24px' }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              required
            />
            <button
              type="submit"
              style={buttonStyle}
              disabled={isLoggingIn}
              onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setUseOTP(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Use one-time password instead
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} style={{ marginBottom: '24px' }}>
            {!otpSent ? (
              <>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
                  required
                />
                <button
                  type="submit"
                  style={buttonStyle}
                  disabled={isLoggingIn}
                  onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {isLoggingIn ? 'Sending...' : 'Send One-Time Password'}
                </button>
              </>
            ) : (
              <>
                <div style={{
                  color: '#FFFFFF',
                  fontSize: '14px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  We sent a code to <strong>{email}</strong>
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  style={buttonStyle}
                  disabled={isLoggingIn}
                  onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {isLoggingIn ? 'Verifying...' : 'Verify Code'}
                </button>
              </>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setUseOTP(false);
                  setOtpSent(false);
                  setOtp('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Use password instead
              </button>
            </div>
          </form>
        )}

        <button
          onClick={() => navigate('/signup')}
          style={secondaryButtonStyle}
          disabled={isLoggingIn}
          onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.backgroundColor = '#1A1A1A')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Create Account
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              color: '#666666',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0
            }}
            disabled={isLoggingIn}
          >
            Forgot password?
          </button>
        </div>

        {/* App Data Debug Link */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/debug')}
            style={{
              background: 'none',
              border: 'none',
              color: '#666666',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'color 0.2s'
            }}
            disabled={isLoggingIn}
            onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.color = '#999999')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
          >
            App Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;