import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectAdded: () => void;
  userId?: string | null;
}

function AddProjectModal({ isOpen, onClose, onProjectAdded, userId }: AddProjectModalProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleContinue = () => {
    setShowWarning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Use provided userId if admin is creating for another user, otherwise use current user
    const creatorId = userId || user.id;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('projects')
      .insert([
        {
          name,
          tagline: tagline || null,
          description,
          created_by: creatorId
        }
      ]);

    setIsSubmitting(false);

    if (!error) {
      setName('');
      setTagline('');
      setDescription('');
      setShowWarning(true);
      onProjectAdded();
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setTagline('');
    setDescription('');
    setShowWarning(true);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #333333'
      }}>
        {showWarning ? (
          <>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#FFFFFF'
            }}>
              Add New Project
            </div>

            <div style={{
              backgroundColor: '#2A2A2A',
              border: '1px solid #FFAA00',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFAA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path d="M10 2L2 18h16L10 2z"/>
                  <line x1="10" y1="8" x2="10" y2="12"/>
                  <circle cx="10" cy="15" r="0.5" fill="#FFAA00"/>
                </svg>
                <div>
                  <div style={{ color: '#FFAA00', fontWeight: '600', marginBottom: '8px' }}>
                    Important Notice
                  </div>
                  <div style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.5' }}>
                    This will create an entirely new app project and is not related to any previous projects. Do you want to continue?
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#999999',
                  border: '1px solid #333333',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2A2A2A';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              color: '#FFFFFF'
            }}>
              Create New Project
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  width: '100%',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Tagline (optional)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={{
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  width: '100%',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#CCCCCC',
                marginBottom: '8px'
              }}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                style={{
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  width: '100%',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'transparent',
                  color: '#999999',
                  border: '1px solid #333333',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#2A2A2A';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: isSubmitting ? 0.5 : 1
                }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = isSubmitting ? '0.5' : '1')}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddProjectModal;
