import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';
import UploadProjectSection from '../components/UploadProjectSection';

interface User {
  id: string;
  email: string;
  approved: boolean;
  is_admin: boolean;
  created_at: string;
}

function Admin() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<'upload' | 'users'>('upload');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!error && data?.is_admin) {
          setIsAdmin(true);
          fetchUsers();
        } else {
          navigate('/');
        }
      } catch (err) {
        navigate('/');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved: !currentStatus })
        .eq('id', userId);

      if (!error) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating approval:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
          color: '#FFFFFF',
          letterSpacing: '-0.02em'
        }}>
          Admin Panel
        </h1>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'transparent',
            color: '#666666',
            border: '1px solid #333333',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1A1A1A';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#666666';
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Side Menu */}
        <div style={{
          width: '240px',
          borderRight: '1px solid #333333',
          padding: '20px',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveSection('upload')}
              style={{
                backgroundColor: activeSection === 'upload' ? '#1A1A1A' : 'transparent',
                color: activeSection === 'upload' ? '#FFFFFF' : '#999999',
                border: activeSection === 'upload' ? '1px solid #333333' : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'upload') {
                  e.currentTarget.style.backgroundColor = '#0A0A0A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'upload') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4v10m-5-5l5-5 5 5M3 13v2h12v-2"/>
              </svg>
              Upload Project
            </button>

            <button
              onClick={() => setActiveSection('users')}
              style={{
                backgroundColor: activeSection === 'users' ? '#1A1A1A' : 'transparent',
                color: activeSection === 'users' ? '#FFFFFF' : '#999999',
                border: activeSection === 'users' ? '1px solid #333333' : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'users') {
                  e.currentTarget.style.backgroundColor = '#0A0A0A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'users') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 13v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1"/>
                <circle cx="7" cy="5" r="3"/>
                <path d="M13 7l2 2 4-4"/>
              </svg>
              User Management
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {activeSection === 'upload' && <UploadProjectSection />}

          {activeSection === 'users' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#FFFFFF'
              }}>
                User Management
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                  No users found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {users.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>
                          {u.email}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666666',
                          display: 'flex',
                          gap: '12px'
                        }}>
                          <span>
                            Status: {u.approved ? (
                              <span style={{ color: '#4ADE80' }}>Approved</span>
                            ) : (
                              <span style={{ color: '#F87171' }}>Pending</span>
                            )}
                          </span>
                          {u.is_admin && (
                            <span style={{ color: '#FFFFFF' }}>• Admin</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleApproval(u.id, u.approved)}
                        style={{
                          backgroundColor: u.approved ? 'transparent' : '#FFFFFF',
                          color: u.approved ? '#666666' : '#000000',
                          border: u.approved ? '1px solid #333333' : 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (u.approved) {
                            e.currentTarget.style.backgroundColor = '#1A1A1A';
                            e.currentTarget.style.color = '#FFFFFF';
                          } else {
                            e.currentTarget.style.opacity = '0.9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (u.approved) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#666666';
                          } else {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                      >
                        {u.approved ? 'Revoke' : 'Approve'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomBar activeTab="admin" />
    </div>
  );
}

export default Admin;
