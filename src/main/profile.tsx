import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';

function Profile() {
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUserInfo = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserInfo(data);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setResetting(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordReset(false);

      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update password');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const getUserDisplayName = () => {
    if (userInfo?.first_name && userInfo?.last_name) {
      return `${userInfo.first_name} ${userInfo.last_name}`;
    }
    return userInfo?.email || 'User';
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '100px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="mobile-safe-header" style={{
        padding: '20px',
        borderBottom: '1px solid #333333',
        position: 'sticky',
        top: 0,
        backgroundColor: '#000000',
        zIndex: 100
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Profile
        </h1>
      </header>

      <div style={{ padding: '20px' }}>
        {/* User Info Card */}
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          {/* Avatar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#0A0A0A',
              border: '2px solid #333333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 4px 0',
                color: '#FFFFFF'
              }}>
                {getUserDisplayName()}
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666666',
                margin: 0
              }}>
                {userInfo?.email}
              </p>
              {userInfo?.is_admin && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  backgroundColor: '#3B82F615',
                  color: '#3B82F6',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid #3B82F630'
                }}>
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #333333'
          }}>
            {userInfo?.first_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>First Name</span>
                <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>{userInfo.first_name}</span>
              </div>
            )}
            {userInfo?.last_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>Last Name</span>
                <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>{userInfo.last_name}</span>
              </div>
            )}
            {userInfo?.phone_number && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>Phone</span>
                <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>{userInfo.phone_number}</span>
              </div>
            )}
            {userInfo?.company_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>Company</span>
                <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>{userInfo.company_name}</span>
              </div>
            )}
            {userInfo?.app_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666666', fontSize: '14px' }}>App Name</span>
                <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>{userInfo.app_name}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666666', fontSize: '14px' }}>Member Since</span>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '500' }}>
                {new Date(userInfo?.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Password Reset Section */}
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            color: '#FFFFFF'
          }}>
            Security
          </h3>

          {!showPasswordReset ? (
            <button
              onClick={() => setShowPasswordReset(true)}
              style={{
                backgroundColor: '#0A0A0A',
                color: '#FFFFFF',
                border: '1px solid #333333',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A';
                e.currentTarget.style.borderColor = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0A0A0A';
                e.currentTarget.style.borderColor = '#333333';
              }}
            >
              Change Password
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#999999',
                  marginBottom: '6px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#999999',
                  marginBottom: '6px'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {message && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: message.includes('success') ? '#22C55E15' : '#EF444415',
                  border: message.includes('success') ? '1px solid #22C55E30' : '1px solid #EF444430',
                  color: message.includes('success') ? '#22C55E' : '#EF4444',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setMessage('');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#666666',
                    border: '1px solid #333333',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={resetting || !newPassword || !confirmPassword}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: resetting ? 'not-allowed' : 'pointer',
                    opacity: (resetting || !newPassword || !confirmPassword) ? 0.5 : 1
                  }}
                >
                  {resetting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* App Documentation */}
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              // TODO: Navigate to documentation
              console.log('App Documentation clicked');
            }}
            style={{
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              border: '1px solid #333333',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A1A';
              e.currentTarget.style.borderColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0A0A0A';
              e.currentTarget.style.borderColor = '#333333';
            }}
          >
            App Documentation
          </button>
        </div>

        {/* Actions */}
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#EF444415',
              color: '#EF4444',
              border: '1px solid #EF444430',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EF444425';
              e.currentTarget.style.borderColor = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#EF444415';
              e.currentTarget.style.borderColor = '#EF444430';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <BottomBar activeTab="profile" />
    </div>
  );
}

export default Profile;
