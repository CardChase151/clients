import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface AddScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScreenAdded: () => void;
  projectId: string;
}

function AddScreenModal({ isOpen, onClose, onScreenAdded, projectId }: AddScreenModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('screens')
      .insert([
        {
          project_id: projectId,
          title,
          description: description || null,
          created_by: user.id
        }
      ]);

    setIsSubmitting(false);

    if (!error) {
      setTitle('');
      setDescription('');
      onScreenAdded();
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
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
        <form onSubmit={handleSubmit}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '24px',
            color: '#FFFFFF'
          }}>
            Add Screen/Component
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#CCCCCC',
              marginBottom: '8px'
            }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Home Screen"
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
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what this screen/component does..."
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
              {isSubmitting ? 'Adding...' : 'Add Screen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddScreenModal;
