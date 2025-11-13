import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomBar from '../menu/bottombar';

function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Check if it's demo user
  const isDemoUser = user?.email === 'viewer@gmail.com' || localStorage.getItem('demoAuth') === 'true';

  // User info - demo or real
  const userInfo = isDemoUser ? {
    name: 'Demo User',
    email: 'viewer@gmail.com',
    joinDate: 'January 1, 2024',
    accountType: 'Demo Account',
    avatar: '👤',
    stats: {
      savedItems: 12,
      searchHistory: 45,
      eventsCreated: 8
    }
  } : {
    name: user?.user_metadata?.full_name || 'User',
    email: user?.email || '',
    joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Recently',
    accountType: 'Standard Account',
    avatar: '👤',
    stats: {
      savedItems: 0,
      searchHistory: 0,
      eventsCreated: 0
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleReset = () => {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('demoAuth');
    signOut();
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
          Profile
        </h1>

        <button
          onClick={() => navigate('/')}
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
          Home
        </button>
      </header>

      {/* Profile Card */}
      <div style={{
        backgroundColor: '#101A2B',
        border: '1px solid #1b2a44',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '24px'
      }}>
        {/* Avatar and Basic Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '16px',
            backgroundColor: '#0F1623',
            border: '2px solid #00D1FF',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {userInfo.avatar}
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#FFFFFF'
          }}>
            {userInfo.name}
          </h2>

          <p style={{
            color: '#00D1FF',
            fontSize: '16px',
            margin: '0 0 4px 0',
            fontWeight: '500'
          }}>
            {userInfo.email}
          </p>

          <p style={{
            color: '#9FBAD1',
            fontSize: '14px',
            margin: 0
          }}>
            Member since {userInfo.joinDate}
          </p>

          {isDemoUser && (
            <span style={{
              backgroundColor: '#FFE66D',
              color: '#0F1623',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              marginTop: '8px'
            }}>
              {userInfo.accountType}
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: '#0F1623',
            border: '1px solid #1b2a44',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#00D1FF',
              marginBottom: '4px'
            }}>
              {userInfo.stats.savedItems}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9FBAD1'
            }}>
              Saved Items
            </div>
          </div>

          <div style={{
            backgroundColor: '#0F1623',
            border: '1px solid #1b2a44',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#4ECDC4',
              marginBottom: '4px'
            }}>
              {userInfo.stats.searchHistory}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9FBAD1'
            }}>
              Searches
            </div>
          </div>

          <div style={{
            backgroundColor: '#0F1623',
            border: '1px solid #1b2a44',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#FFE66D',
              marginBottom: '4px'
            }}>
              {userInfo.stats.eventsCreated}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9FBAD1'
            }}>
              Events
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            style={{
              backgroundColor: '#0F1623',
              color: '#E2F4FF',
              border: '1px solid #1b2a44',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Edit Profile
          </button>

          <button
            style={{
              backgroundColor: '#0F1623',
              color: '#E2F4FF',
              border: '1px solid #1b2a44',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Settings
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                backgroundColor: '#101A2B',
                color: '#E2F4FF',
                border: '1px solid #1b2a44',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Logout
            </button>

            {isDemoUser && (
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  backgroundColor: '#2A1A1A',
                  color: '#FF6B6B',
                  border: '1px solid #FF6B6B',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Reset Demo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div style={{
        textAlign: 'center',
        marginBottom: '80px'
      }}>
        <p style={{
          color: '#9FBAD1',
          fontSize: '14px',
          margin: 0
        }}>
          {isDemoUser
            ? 'This is demo profile data. In a real app, this would show actual user information.'
            : 'Your profile information from Supabase authentication.'
          }
        </p>
      </div>

      <BottomBar activeTab="profile" />
    </div>
  );
}

export default Profile;