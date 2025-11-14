import React, { useState } from 'react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setEmailSent(true);
    } else {
      alert('Please enter your email address');
    }
  };

  const inputStyle = {
    backgroundColor: '#1A1A1A',
    border: '1px solid #333333',
    borderRadius: '8px',
    padding: '16px 20px',
    color: '#FFFFFF',
    fontSize: '16px',
    width: '100%',
    marginBottom: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const buttonStyle = {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '16px',
    transition: 'opacity 0.2s'
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '1px solid #333333',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s'
  };

  if (emailSent) {
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
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '24px'
          }}>
            Email Sent!
          </h2>
          <p style={{
            color: '#999999',
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            An email has been sent to <strong style={{ color: '#FFFFFF' }}>{email}</strong> with instructions to reset your password.
          </p>
          <p style={{
            color: '#999999',
            marginBottom: '32px',
            lineHeight: '1.5'
          }}>
            Check your inbox and follow the link to update your password.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={secondaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px',
          textAlign: 'center',
          letterSpacing: '-0.5px'
        }}>
          Forgot Password
        </h2>
        <p style={{
          color: '#999999',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSendEmail} style={{ marginBottom: '16px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#FFFFFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
            required
          />
          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Send Reset Email
          </button>
        </form>

        <button
          onClick={() => window.location.href = '/login'}
          style={secondaryButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;