import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomBar from '../menu/bottombar';

function Home() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // Force page reload to ensure auth state clears properly
    window.location.href = '/';
  };

  const handleReset = () => {
    // Clear all localStorage items for a complete reset
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('demoAuth');
    // Add any other localStorage items that need clearing

    // Sign out if using Supabase
    signOut();

    // Redirect to onboarding
    window.location.href = '/';
  };

  return (
    <div style={{
      backgroundColor: '#0F1623',
      minHeight: '100vh',
      color: '#E2F4FF',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          margin: 0,
          color: '#FFFFFF'
        }}>
          Home
        </h1>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#101A2B',
              color: '#E2F4FF',
              border: '1px solid #1b2a44',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Logout
          </button>

          <button
            onClick={handleReset}
            style={{
              backgroundColor: '#2A1A1A',
              color: '#FF6B6B',
              border: '1px solid #FF6B6B',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Reset for Preview
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        backgroundColor: '#101A2B',
        border: '1px solid #1b2a44',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 20px 0',
          color: '#FFFFFF'
        }}>
          Welcome to Your Template App
        </h2>

        <p style={{
          color: '#9FBAD1',
          fontSize: '18px',
          lineHeight: '1.6',
          margin: '0 0 30px 0'
        }}>
          This is the home screen. You can update it to whatever you want!
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/search')}
            style={{
              backgroundColor: '#00D1FF',
              color: '#0F1623',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Go to Search
          </button>

          <button
            onClick={() => navigate('/profile')}
            style={{
              backgroundColor: 'transparent',
              color: '#00D1FF',
              border: '2px solid #00D1FF',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Navigation hint */}
      <div style={{
        marginTop: '40px',
        marginBottom: '80px',
        textAlign: 'center'
      }}>
        <p style={{
          color: '#9FBAD1',
          fontSize: '14px',
          margin: 0
        }}>
          Navigate to other screens using the buttons above or the bottom navigation
        </p>
      </div>

      <BottomBar activeTab="home" />
    </div>
  );
}

export default Home;