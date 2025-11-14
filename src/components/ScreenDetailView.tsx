import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import AddTaskModal from './AddTaskModal';
import EditScreenModal from './EditScreenModal';
import EditTaskModal from './EditTaskModal';
import HistoryModal from './HistoryModal';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'waiting' | 'done';
  created_at: string;
  updated_at: string;
  created_by: string;
  creator?: {
    email: string;
  };
}

interface Screen {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string;
  creator?: {
    email: string;
  };
}

interface ScreenDetailViewProps {
  screenId: string;
  onBack: () => void;
}

function ScreenDetailView({ screenId, onBack }: ScreenDetailViewProps) {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [historyItem, setHistoryItem] = useState<{ id: string; title: string; type: 'screen' | 'task' } | null>(null);

  useEffect(() => {
    fetchScreenAndTasks();
  }, [screenId, refreshTrigger]);

  const fetchScreenAndTasks = async () => {
    setLoading(true);

    const [screenResult, tasksResult] = await Promise.all([
      supabase.from('screens').select(`
        *,
        creator:users!created_by(email)
      `).eq('id', screenId).single(),
      supabase.from('tasks').select(`
        *,
        creator:users!created_by(email)
      `).eq('screen_id', screenId).order('created_at', { ascending: false })
    ]);

    if (!screenResult.error && screenResult.data) {
      setScreen(screenResult.data);
    }

    if (!tasksResult.error && tasksResult.data) {
      setTasks(tasksResult.data);
    }

    setLoading(false);
  };

  const handleTaskAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'waiting': return 'Waiting';
      case 'done': return 'Done';
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        color: '#666666'
      }}>
        Loading...
      </div>
    );
  }

  if (!screen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        color: '#666666'
      }}>
        Screen not found
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: '#999999',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: '8px 0',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#999999'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="8" x2="4" y2="8"/>
          <polyline points="8 12 4 8 8 4"/>
        </svg>
        Back to Screens
      </button>

      {/* Screen header */}
      <div style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid #333333',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative'
      }}>
        {/* Action buttons */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setHistoryItem({ id: screen.id, title: screen.title, type: 'screen' })}
            style={{
              backgroundColor: '#8B5CF615',
              border: '1px solid #8B5CF630',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8B5CF625';
              e.currentTarget.style.borderColor = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#8B5CF615';
              e.currentTarget.style.borderColor = '#8B5CF630';
            }}
            title="View history"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6"/>
              <polyline points="8 4 8 8 10 10"/>
            </svg>
          </button>
          <button
            onClick={() => setEditingScreen(screen)}
            style={{
              backgroundColor: '#06B6D415',
              border: '1px solid #06B6D430',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#06B6D425';
              e.currentTarget.style.borderColor = '#06B6D4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#06B6D415';
              e.currentTarget.style.borderColor = '#06B6D430';
            }}
            title="Edit screen"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 2l3 3L5 14H2v-3z"/>
            </svg>
          </button>
        </div>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#FFFFFF',
          margin: '0 0 12px 0',
          paddingRight: '80px'
        }}>
          {screen.title}
        </h2>
        {screen.description && (
          <p style={{
            fontSize: '14px',
            color: '#999999',
            lineHeight: '1.6',
            margin: '0 0 12px 0'
          }}>
            {screen.description}
          </p>
        )}
        <div style={{
          fontSize: '12px',
          color: '#666666',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {screen.creator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="3.5" r="2"/>
                <path d="M2.5 10.5v-1a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v1"/>
              </svg>
              <span>Created by {screen.creator.email}</span>
            </div>
          )}
          {screen.created_at && (
            <>
              {screen.creator && <span>•</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="4.5"/>
                  <path d="M6 3v3l2 1"/>
                </svg>
                <span>{new Date(screen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tasks section header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#FFFFFF',
          margin: 0
        }}>
          Tasks ({tasks.length})
        </h3>
        <button
          onClick={() => setShowAddTaskModal(true)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="4" x2="8" y2="12"/>
            <line x1="4" y1="8" x2="12" y2="8"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Tasks grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '16px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#666666';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333333';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Action buttons */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '4px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHistoryItem({ id: task.id, title: task.title, type: 'task' });
                }}
                style={{
                  backgroundColor: '#8B5CF615',
                  border: '1px solid #8B5CF630',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B5CF625';
                  e.currentTarget.style.borderColor = '#8B5CF6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B5CF615';
                  e.currentTarget.style.borderColor = '#8B5CF630';
                }}
                title="View history"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="4.5"/>
                  <polyline points="6 3 6 6 7.5 7.5"/>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTask(task);
                }}
                style={{
                  backgroundColor: '#06B6D415',
                  border: '1px solid #06B6D430',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#06B6D425';
                  e.currentTarget.style.borderColor = '#06B6D4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#06B6D415';
                  e.currentTarget.style.borderColor = '#06B6D430';
                }}
                title="Edit task"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 1.5l2 2L4 10H2v-2z"/>
                </svg>
              </button>
            </div>

            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: '12px',
              paddingRight: '56px'
            }}>
              {task.title}
            </div>
            {task.description && (
              <div style={{
                fontSize: '13px',
                color: '#999999',
                lineHeight: '1.5',
                marginBottom: '12px'
              }}>
                {task.description}
              </div>
            )}

            {/* Status Dropdown */}
            <div style={{ marginBottom: '12px' }}>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                style={{
                  width: '100%',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: getStatusColor(task.status),
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="not_started" style={{ color: '#666666' }}>Not Started</option>
                <option value="in_progress" style={{ color: '#3B82F6' }}>In Progress</option>
                <option value="waiting" style={{ color: '#F59E0B' }}>Waiting</option>
                <option value="done" style={{ color: '#10B981' }}>Done</option>
              </select>
            </div>

            {/* Creator and Date */}
            <div style={{
              fontSize: '11px',
              color: '#666666',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {task.creator && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="3" r="2"/>
                    <path d="M2 9v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span>{task.creator.email}</span>
                </div>
              )}
              {task.created_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="5" r="4"/>
                    <path d="M5 2.5v2.5l1.5 1"/>
                  </svg>
                  <span>{new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666666',
            fontSize: '14px'
          }}>
            No tasks yet. Click "Add Task" to get started.
          </div>
        )}
      </div>

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onTaskAdded={handleTaskAdded}
        screenId={screenId}
      />

      {editingScreen && (
        <EditScreenModal
          isOpen={!!editingScreen}
          onClose={() => setEditingScreen(null)}
          onScreenUpdated={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
          screen={editingScreen}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
          task={editingTask}
        />
      )}

      {historyItem && (
        <HistoryModal
          isOpen={!!historyItem}
          onClose={() => setHistoryItem(null)}
          itemId={historyItem.id}
          itemType={historyItem.type}
          itemTitle={historyItem.title}
        />
      )}
    </div>
  );
}

export default ScreenDetailView;
