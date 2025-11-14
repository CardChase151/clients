import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'waiting' | 'done';
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  task: Task;
}

function EditTaskModal({ isOpen, onClose, onTaskUpdated, task }: EditTaskModalProps) {
  const { user, isAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('not_started');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setError('');
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // First, save current version to history
      const { error: historyError } = await supabase
        .from('task_history')
        .insert({
          task_id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          edited_by: user?.id
        });

      if (historyError) {
        console.error('Error saving to history:', historyError);
        setError('Failed to save edit history');
        setSaving(false);
        return;
      }

      // Then update the task
      const updateData: any = {
        title: title.trim(),
        description: description.trim() || null
      };

      // Only update status if user is admin
      if (isAdmin) {
        updateData.status = status;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id);

      if (updateError) {
        console.error('Error updating task:', updateError);
        setError('Failed to update task');
        setSaving(false);
        return;
      }

      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'not_started': return '#64748B';
      case 'in_progress': return '#3B82F6';
      case 'waiting': return '#F59E0B';
      case 'done': return '#22C55E';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid #333333'
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#FFFFFF',
                margin: 0
              }}
            >
              Edit Task
            </h2>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#FF000015',
                  border: '1px solid #FF000030',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  color: '#FF6B6B',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}
              >
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                disabled={saving}
                style={{
                  width: '100%',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FFFFFF'}
                onBlur={(e) => e.target.style.borderColor = '#333333'}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                disabled={saving}
                rows={4}
                style={{
                  width: '100%',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#FFFFFF',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FFFFFF'}
                onBlur={(e) => e.target.style.borderColor = '#333333'}
              />
            </div>

            {/* Status - Only visible for admins */}
            {isAdmin && (
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: '8px'
                  }}
                >
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                  disabled={saving}
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: getStatusColor(status),
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FFFFFF'}
                  onBlur={(e) => e.target.style.borderColor = '#333333'}
                >
                  <option value="not_started" style={{ color: '#64748B' }}>Not Started</option>
                  <option value="in_progress" style={{ color: '#3B82F6' }}>In Progress</option>
                  <option value="waiting" style={{ color: '#F59E0B' }}>Waiting</option>
                  <option value="done" style={{ color: '#22C55E' }}>Done</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid #333333',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                backgroundColor: 'transparent',
                color: '#999999',
                border: '1px solid #333333',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: saving ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = '#1A1A1A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              style={{
                backgroundColor: saving || !title.trim() ? '#64748B' : '#06B6D4',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!saving && title.trim()) {
                  e.currentTarget.style.backgroundColor = '#0891B2';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && title.trim()) {
                  e.currentTarget.style.backgroundColor = '#06B6D4';
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal;
