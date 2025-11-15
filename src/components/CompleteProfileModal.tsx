import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface CompleteProfileModalProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

function CompleteProfileModal({ userId, userEmail, onComplete }: CompleteProfileModalProps) {
  const { signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [appName, setAppName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !appName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          company_name: companyName.trim() || null,
          app_name: appName.trim(),
          profile_complete: true
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Send notification email to admin
      try {
        await fetch('/.netlify/functions/send-profile-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phoneNumber.trim(),
            company: companyName.trim() || null,
            appName: appName.trim()
          })
        });
      } catch (emailErr) {
        // Don't fail the whole operation if email fails
        console.error('Failed to send notification email:', emailErr);
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        backgroundColor: '#0A0A0A',
        border: '1px solid #333333',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em'
            }}>
              Complete Your Profile
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#999999',
              margin: 0
            }}>
              We need a few details to get started
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              color: '#666666',
              border: '1px solid #333333',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginLeft: '16px'
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
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              backgroundColor: '#F87171',
              color: '#000000',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* First Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                First Name <span style={{ color: '#F87171' }}>*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1A1A1A',
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

            {/* Last Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Last Name <span style={{ color: '#F87171' }}>*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1A1A1A',
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

            {/* Email (read-only) */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                readOnly
                style={{
                  width: '100%',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#666666',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Phone Number <span style={{ color: '#F87171' }}>*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1A1A1A',
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

            {/* Company Name (Optional) */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Company Name <span style={{ color: '#666666', fontSize: '12px' }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                style={{
                  width: '100%',
                  backgroundColor: '#1A1A1A',
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

            {/* App Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                App Name <span style={{ color: '#F87171' }}>*</span>
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Awesome App"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: '#666666',
                marginTop: '6px',
                marginBottom: 0
              }}>
                Don't worry, you can change this later
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              marginTop: '28px',
              opacity: saving ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {saving ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfileModal;
