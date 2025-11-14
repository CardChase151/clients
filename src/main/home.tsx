import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';
import ProjectDropdown from '../components/ProjectDropdown';
import AddProjectModal from '../components/AddProjectModal';
import ScreensList from '../components/ScreensList';
import AddScreenModal from '../components/AddScreenModal';
import ScreenDetailView from '../components/ScreenDetailView';
import UserDropdown from '../components/UserDropdown';
import CompleteProfileModal from '../components/CompleteProfileModal';

interface OnboardingMilestones {
  discovery_payment_type: 'sent' | 'paid' | 'waived' | null;
  discovery_complete_date: string | null;
  proposal_status: 'sent' | 'reviewed' | null;
  proposal_reviewed_date: string | null;
  invoice_payment_type: 'sent' | 'paid' | 'waived' | null;
  invoice_fulfilled_date: string | null;
}

function Home() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { selectedUserId, selectedProjectId, setSelectedUserId, setSelectedProjectId, isAdmin } = useProject();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(0);
  const [screenRefreshTrigger, setScreenRefreshTrigger] = useState(0);
  const [milestones, setMilestones] = useState<OnboardingMilestones>({
    discovery_payment_type: null,
    discovery_complete_date: null,
    proposal_status: null,
    proposal_reviewed_date: null,
    invoice_payment_type: null,
    invoice_fulfilled_date: null
  });

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!user) return;

      console.log('Home: Fetching approval status for user:', user.id);

      try {
        const { data, error} = await supabase
          .from('users')
          .select('approved, is_admin, profile_complete, discovery_payment_type, discovery_complete_date, proposal_status, proposal_reviewed_date, invoice_payment_type, invoice_fulfilled_date')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Home: Error fetching approval status:', error);
          setApproved(false);
          setProfileComplete(false);
        } else {
          console.log('Home: User data:', data);
          setApproved(data?.approved || false);
          setProfileComplete(data?.profile_complete || false);

          // Set milestones
          setMilestones({
            discovery_payment_type: data?.discovery_payment_type || null,
            discovery_complete_date: data?.discovery_complete_date || null,
            proposal_status: data?.proposal_status || null,
            proposal_reviewed_date: data?.proposal_reviewed_date || null,
            invoice_payment_type: data?.invoice_payment_type || null,
            invoice_fulfilled_date: data?.invoice_fulfilled_date || null
          });
        }
      } catch (err) {
        console.error('Home: Error:', err);
        setApproved(false);
        setProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalStatus();
  }, [user]);

  // Handle navigation from search results
  useEffect(() => {
    const state = location.state as { openProject?: string; openScreen?: string; openTask?: string } | null;

    if (state?.openProject) {
      setSelectedProjectId(state.openProject);

      if (state.openScreen) {
        setSelectedScreenId(state.openScreen);
      }

      // Clear the navigation state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, setSelectedProjectId]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
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

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#FFFFFF'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Profile incomplete - show profile completion modal
  if (!profileComplete && user) {
    return <CompleteProfileModal
      userId={user.id}
      userEmail={user.email || ''}
      onComplete={() => setProfileComplete(true)}
    />;
  }

  // Waiting for approval screen
  if (!approved) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        color: '#FFFFFF',
        padding: '20px',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}>
            AppCatalyst
          </div>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              color: '#666666',
              border: '1px solid #333333',
              padding: '10px 20px',
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

        {/* Main Content - Centered */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          {/* Animated Clock Icon */}
          <div style={{
            marginBottom: '32px'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" opacity="0.2"/>
              <polyline points="12 6 12 12 16 14" style={{ animation: 'pulse 2s ease-in-out infinite' }}/>
            </svg>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            lineHeight: '1.3'
          }}>
            Waiting to start your app with AppCatalyst
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#999999',
            lineHeight: '1.5',
            margin: '0 0 40px 0',
            fontWeight: '400'
          }}>
            You will receive communication once you are able to work on your app
          </p>

          {/* Onboarding Milestones - Horizontal Cards */}
          <div style={{
            width: '100%',
            maxWidth: '900px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#FFFFFF',
              textAlign: 'center'
            }}>
              Progress Milestones
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              width: '100%'
            }}>
              {/* Discovery Card */}
              {(() => {
                const discovery = getMilestoneDisplay('discovery');
                return (
                  <div style={{
                    backgroundColor: '#0A0A0A',
                    border: `1px solid ${discovery.completed ? discovery.color : '#333333'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `2px solid ${discovery.completed ? discovery.color : '#666666'}`,
                      backgroundColor: discovery.completed ? discovery.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {discovery.completed && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '4px'
                      }}>
                        Discovery Period
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: discovery.color
                      }}>
                        {discovery.text}
                      </div>
                      {milestones.discovery_complete_date && (
                        <div style={{
                          fontSize: '11px',
                          color: '#666666',
                          marginTop: '4px'
                        }}>
                          {new Date(milestones.discovery_complete_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Proposal Card */}
              {(() => {
                const proposal = getMilestoneDisplay('proposal');
                return (
                  <div style={{
                    backgroundColor: '#0A0A0A',
                    border: `1px solid ${proposal.completed ? proposal.color : '#333333'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `2px solid ${proposal.completed ? proposal.color : '#666666'}`,
                      backgroundColor: proposal.completed ? proposal.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {proposal.completed && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '4px'
                      }}>
                        Proposal
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: proposal.color
                      }}>
                        {proposal.text}
                      </div>
                      {milestones.proposal_reviewed_date && (
                        <div style={{
                          fontSize: '11px',
                          color: '#666666',
                          marginTop: '4px'
                        }}>
                          {new Date(milestones.proposal_reviewed_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Invoice Card */}
              {(() => {
                const invoice = getMilestoneDisplay('invoice');
                return (
                  <div style={{
                    backgroundColor: '#0A0A0A',
                    border: `1px solid ${invoice.completed ? invoice.color : '#333333'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `2px solid ${invoice.completed ? invoice.color : '#666666'}`,
                      backgroundColor: invoice.completed ? invoice.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {invoice.completed && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '4px'
                      }}>
                        Invoice
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: invoice.color
                      }}>
                        {invoice.text}
                      </div>
                      {milestones.invoice_fulfilled_date && (
                        <div style={{
                          fontSize: '11px',
                          color: '#666666',
                          marginTop: '4px'
                        }}>
                          {new Date(milestones.invoice_fulfilled_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '40px',
          paddingTop: '20px',
          color: '#666666',
          fontSize: '13px',
          fontWeight: '400'
        }}>
          Questions? Contact support@appcatalyst.com
        </div>
      </div>
    );
  }

  // Approved user home screen - Project Management
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
        <div style={{
          fontSize: '20px',
          fontWeight: '600',
          letterSpacing: '-0.02em'
        }}>
          AppCatalyst
        </div>

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

      {/* User & Project Selector */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #333333',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {isAdmin && (
          <UserDropdown
            selectedUserId={selectedUserId}
            onUserSelect={(userId) => {
              setSelectedUserId(userId);
              setSelectedProjectId(null); // Reset project when user changes
            }}
          />
        )}
        <ProjectDropdown
          selectedProjectId={selectedProjectId}
          onProjectSelect={setSelectedProjectId}
          onAddProject={() => setShowAddProjectModal(true)}
          refreshTrigger={projectRefreshTrigger}
        />
      </div>

      {/* Main Content */}
      {selectedScreenId ? (
        <ScreenDetailView
          screenId={selectedScreenId}
          onBack={() => setSelectedScreenId(null)}
        />
      ) : selectedProjectId ? (
        <ScreensList
          projectId={selectedProjectId}
          onScreenClick={setSelectedScreenId}
          onAddScreen={() => setShowAddScreenModal(true)}
          refreshTrigger={screenRefreshTrigger}
          isAdmin={isAdmin}
        />
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 20px',
          color: '#666666',
          fontSize: '14px'
        }}>
          Select or create a project to get started
        </div>
      )}

      {/* Modals */}
      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onProjectAdded={() => setProjectRefreshTrigger(prev => prev + 1)}
        userId={selectedUserId}
      />

      {selectedProjectId && (
        <AddScreenModal
          isOpen={showAddScreenModal}
          onClose={() => setShowAddScreenModal(false)}
          onScreenAdded={() => setScreenRefreshTrigger(prev => prev + 1)}
          projectId={selectedProjectId}
        />
      )}

      <BottomBar activeTab="home" />
    </div>
  );
}

export default Home;