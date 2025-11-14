import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';
import ProjectDropdown from '../components/ProjectDropdown';
import AddProjectModal from '../components/AddProjectModal';
import ScreensList from '../components/ScreensList';
import AddScreenModal from '../components/AddScreenModal';
import ScreenDetailView from '../components/ScreenDetailView';
import UserDropdown from '../components/UserDropdown';

function Home() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(0);
  const [screenRefreshTrigger, setScreenRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!user) return;

      console.log('Home: Fetching approval status for user:', user.id);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('approved, is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Home: Error fetching approval status:', error);
          setApproved(false);
          setIsAdmin(false);
        } else {
          console.log('Home: User data:', data);
          setApproved(data?.approved || false);
          setIsAdmin(data?.is_admin || false);
          // If not admin, set selectedUserId to current user
          if (!data?.is_admin) {
            console.log('Home: Not admin, setting selectedUserId to:', user.id);
            setSelectedUserId(user.id);
          } else {
            console.log('Home: Is admin, selectedUserId will be set by user selection');
          }
        }
      } catch (err) {
        console.error('Home: Error:', err);
        setApproved(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalStatus();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
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
            margin: 0,
            fontWeight: '400'
          }}>
            You will receive communication once you are able to work on your app
          </p>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '40px',
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
          userId={selectedUserId}
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