import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsSigningUp(true);
    setError(null);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setIsSigningUp(false);
    } else {
      setSuccess(true);
      setIsSigningUp(false);
    }
  };

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
    marginBottom: '24px'
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
    width: '100%'
  };

  if (success) {
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
          color: '#00D1FF',
          marginBottom: '16px'
        }}>
          Account Created!
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#B3C5D1',
          marginBottom: '32px'
        }}>
          Please check your email to verify your account before logging in.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          style={buttonStyle}
        >
          Go to Login
        </button>
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
          Sign Up for [APP NAME]
        </h2>

        <form onSubmit={handleSignUp} style={{ marginBottom: '24px' }}>
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
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle} disabled={isSigningUp}>
            {isSigningUp ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => window.location.href = '/login'}
          style={secondaryButtonStyle}
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}

export default SignUp;