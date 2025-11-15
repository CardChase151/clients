import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface BottomBarProps {
  activeTab: string;
}

// Icons as SVG components (iOS style)
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AdminIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function BottomBar({ activeTab }: BottomBarProps) {
  const { isAdmin } = useAuth();

  const baseTabs = [
    { id: 'home', path: '/', label: 'Home', icon: <HomeIcon /> },
    { id: 'search', path: '/search', label: 'Search', icon: <SearchIcon /> },
    { id: 'profile', path: '/profile', label: 'Profile', icon: <ProfileIcon /> }
  ];

  const tabs = isAdmin
    ? [...baseTabs, { id: 'admin', path: '/admin', label: 'Admin', icon: <AdminIcon /> }]
    : baseTabs;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: 0,
    right: 0,
    height: 'auto',
    zIndex: 1000,
    background: 'transparent',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '0 20px'
  };

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1A1A1A',
    border: 'none',
    color: isActive ? '#FFFFFF' : '#666666',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    textDecoration: 'none'
  });

  return (
    <div className="bottom-bar" style={containerStyle}>
      {tabs.map(tab => (
        <NavLink
          key={tab.id}
          to={tab.path}
          style={linkStyle(activeTab === tab.id)}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = '#999999';
            }
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = '#666666';
            }
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)';
          }}
        >
          {tab.icon}
        </NavLink>
      ))}
    </div>
  );
}

export default BottomBar;