import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';

interface Payment {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface OnboardingMilestones {
  discovery_payment_type: 'sent' | 'paid' | 'waived' | null;
  discovery_complete_date: string | null;
  proposal_status: 'sent' | 'reviewed' | null;
  proposal_reviewed_date: string | null;
  invoice_payment_type: 'sent' | 'paid' | 'waived' | null;
  invoice_fulfilled_date: string | null;
}

function Profile() {
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [firstProjectId, setFirstProjectId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [milestones, setMilestones] = useState<OnboardingMilestones>({
    discovery_payment_type: null,
    discovery_complete_date: null,
    proposal_status: null,
    proposal_reviewed_date: null,
    invoice_payment_type: null,
    invoice_fulfilled_date: null
  });
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

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

  const fetchUserProjects = async () => {
    if (!user) return;

    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setUserProjects(data);
        setFirstProjectId(data[0].id); // First project created
        setSelectedProject(data[0].id);

        // Fetch milestones and payments for first project
        fetchMilestones();
        fetchPayments(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchMilestones = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('discovery_payment_type, discovery_complete_date, proposal_status, proposal_reviewed_date, invoice_payment_type, invoice_fulfilled_date')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setMilestones({
          discovery_payment_type: data.discovery_payment_type,
          discovery_complete_date: data.discovery_complete_date,
          proposal_status: data.proposal_status,
          proposal_reviewed_date: data.proposal_reviewed_date,
          invoice_payment_type: data.invoice_payment_type,
          invoice_fulfilled_date: data.invoice_fulfilled_date
        });
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    }
  };

  const fetchPayments = async (projectId: string) => {
    if (!user) return;

    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const getMilestoneDisplay = (type: 'discovery' | 'proposal' | 'invoice') => {
    if (type === 'discovery') {
      const status = milestones.discovery_payment_type;
      if (!status) return { text: 'Pending', color: '#666666', completed: false };
      if (status === 'sent') return { text: 'Sent', color: '#EAB308', completed: true };
      if (status === 'paid') return { text: 'Paid', color: '#4ADE80', completed: true };
      if (status === 'waived') return { text: 'Waived', color: '#3B82F6', completed: true };
    } else if (type === 'proposal') {
      const status = milestones.proposal_status;
      if (!status) return { text: 'Pending', color: '#666666', completed: false };
      if (status === 'sent') return { text: 'Sent', color: '#EAB308', completed: true };
      if (status === 'reviewed') return { text: 'Reviewed', color: '#3B82F6', completed: true };
    } else if (type === 'invoice') {
      const status = milestones.invoice_payment_type;
      if (!status) return { text: 'Pending', color: '#666666', completed: false };
      if (status === 'sent') return { text: 'Sent', color: '#EAB308', completed: true };
      if (status === 'paid') return { text: 'Paid', color: '#4ADE80', completed: true };
      if (status === 'waived') return { text: 'Waived', color: '#3B82F6', completed: true };
    }
    return { text: 'Pending', color: '#666666', completed: false };
  };

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
              setShowDocModal(true);
              fetchUserProjects();
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

      {/* App Documentation Modal */}
      {showDocModal && (
        <div
          onClick={() => setShowDocModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#FFFFFF'
              }}>
                App Documentation
              </h2>
              <button
                onClick={() => setShowDocModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#666666',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* Project Selector */}
            {loadingProjects ? (
              <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                Loading your apps...
              </div>
            ) : userProjects.length > 0 ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#999999',
                    marginBottom: '8px'
                  }}>
                    Select App / Project
                  </label>
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      fetchPayments(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {userProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show milestones only for first/initial app */}
                {selectedProject === firstProjectId && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }}>
                      Initial App Progress
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      marginBottom: '24px'
                    }}>
                      {/* Discovery */}
                      {(() => {
                        const discovery = getMilestoneDisplay('discovery');
                        return (
                          <div style={{
                            backgroundColor: '#0A0A0A',
                            border: `1px solid ${discovery.completed ? discovery.color : '#333333'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: `2px solid ${discovery.completed ? discovery.color : '#666666'}`,
                              backgroundColor: discovery.completed ? discovery.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {discovery.completed && (
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M3 8L6 11L13 4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#FFFFFF',
                                marginBottom: '2px'
                              }}>
                                Discovery
                              </div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: discovery.color
                              }}>
                                {discovery.text}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Proposal */}
                      {(() => {
                        const proposal = getMilestoneDisplay('proposal');
                        return (
                          <div style={{
                            backgroundColor: '#0A0A0A',
                            border: `1px solid ${proposal.completed ? proposal.color : '#333333'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: `2px solid ${proposal.completed ? proposal.color : '#666666'}`,
                              backgroundColor: proposal.completed ? proposal.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {proposal.completed && (
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M3 8L6 11L13 4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#FFFFFF',
                                marginBottom: '2px'
                              }}>
                                Proposal
                              </div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: proposal.color
                              }}>
                                {proposal.text}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Invoice */}
                      {(() => {
                        const invoice = getMilestoneDisplay('invoice');
                        return (
                          <div style={{
                            backgroundColor: '#0A0A0A',
                            border: `1px solid ${invoice.completed ? invoice.color : '#333333'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: `2px solid ${invoice.completed ? invoice.color : '#666666'}`,
                              backgroundColor: invoice.completed ? invoice.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {invoice.completed && (
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M3 8L6 11L13 4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#FFFFFF',
                                marginBottom: '2px'
                              }}>
                                Invoice
                              </div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: invoice.color
                              }}>
                                {invoice.text}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Payment Breakdown */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#FFFFFF'
                  }}>
                    Payment Breakdown
                  </h3>

                  {loadingPayments ? (
                    <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                      Loading payments...
                    </div>
                  ) : payments.length > 0 ? (
                    <>
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          style={{
                            backgroundColor: payment.paid ? '#22C55E15' : '#0A0A0A',
                            border: payment.paid ? '1px solid #22C55E30' : '1px solid #333333',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#FFFFFF',
                              marginBottom: '4px'
                            }}>
                              {payment.name}
                            </div>
                            <div style={{
                              fontSize: '14px',
                              color: '#FFFFFF',
                              fontWeight: '500'
                            }}>
                              ${payment.amount.toFixed(2)}
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: payment.paid ? '#22C55E' : '#666666'
                          }}>
                            {payment.paid ? (
                              <>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M3 8L6 11L13 4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Paid
                              </>
                            ) : (
                              'Pending'
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Totals */}
                      <div style={{
                        borderTop: '1px solid #333333',
                        paddingTop: '16px',
                        marginTop: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                            Total
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                            ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#22C55E' }}>
                            Paid
                          </div>
                          <div style={{ fontSize: '14px', color: '#22C55E' }}>
                            ${payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontSize: '14px', color: '#F87171' }}>
                            Outstanding
                          </div>
                          <div style={{ fontSize: '14px', color: '#F87171' }}>
                            ${payments.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#666666',
                      padding: '40px',
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333333',
                      borderRadius: '8px'
                    }}>
                      No payments found for this app
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666666',
                padding: '40px',
                backgroundColor: '#0A0A0A',
                border: '1px solid #333333',
                borderRadius: '8px'
              }}>
                No apps found. Create an app to get started!
              </div>
            )}
          </div>
        </div>
      )}

      <BottomBar activeTab="profile" />
    </div>
  );
}

export default Profile;
