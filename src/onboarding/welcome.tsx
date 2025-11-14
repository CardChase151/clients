import React, { useState } from 'react';

function Welcome() {
  const [step, setStep] = useState(1);

  if (step === 1) {
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
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Welcome to your app!
        </h2>
        <button
          onClick={() => setStep(2)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Next
        </button>
      </div>
    );
  }

  if (step === 2) {
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
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Here is all the information to start users on their journey!
        </h2>
        <button
          onClick={() => setStep(3)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Next
        </button>
      </div>
    );
  }

  if (step === 3) {
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
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Let's get you logged in!
        </h2>
        <button
          onClick={() => {
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.href = '/login';
          }}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Login
        </button>
      </div>
    );
  }

  return null;
}

export default Welcome;