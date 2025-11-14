import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Onboarding screens
import Welcome from './onboarding/welcome';
import Login from './onboarding/login';
import SignUp from './onboarding/signup';
import ForgotPassword from './onboarding/forgotpassword';

// Debug screens
import PublicAppDataDebug from './debug/PublicAppDataDebug';

// Main screens
import Home from './main/home';
import Search from './main/search';
import Saved from './main/saved';
import Calendar from './main/calendar';
import Profile from './main/profile';
import Admin from './main/admin';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#0F1623',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#E2F4FF'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Check if onboarding has been completed
  const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';

  return (
    <div style={{
      backgroundColor: '#0F1623',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Routes>
        {/* Public routes (no auth required) */}
        <Route path="/debug" element={<PublicAppDataDebug />} />

        {/* Auth routes (show only when not authenticated) */}
        {!user && (
          <>
            <Route path="/" element={hasCompletedOnboarding ? <Navigate to="/login" replace /> : <Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </>
        )}

        {/* Protected routes (show only when authenticated) */}
        {user && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </>
        )}

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to={user ? "/" : hasCompletedOnboarding ? "/login" : "/"} replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;