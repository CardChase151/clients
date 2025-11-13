import React, { useState } from 'react';

function Welcome() {
  const [step, setStep] = useState(1);

  if (step === 1) {
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
            backgroundColor: '#00D1FF',
            color: '#0F1623',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '900',
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      </div>
    );
  }

  if (step === 2) {
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
            backgroundColor: '#00D1FF',
            color: '#0F1623',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '900',
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      </div>
    );
  }

  if (step === 3) {
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
            backgroundColor: '#00D1FF',
            color: '#0F1623',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '900',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return null;
}

export default Welcome;