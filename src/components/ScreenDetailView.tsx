import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import AddTaskModal from './AddTaskModal';
import EditScreenModal from './EditScreenModal';
import EditTaskModal from './EditTaskModal';
import HistoryModal from './HistoryModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'waiting' | 'review' | 'done';
  created_at: string;
  updated_at: string;
  created_by: string;
  sort_order?: number;
  creator?: {
    first_name: string | null;
    last_name: string | null;
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
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface ScreenDetailViewProps {
  screenId: string;
  onBack: () => void;
}

function ScreenDetailView({ screenId, onBack }: ScreenDetailViewProps) {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [historyItem, setHistoryItem] = useState<{ id: string; title: string; type: 'screen' | 'task' } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reorderMode, setReorderMode] = useState<'none' | 'click' | 'drag'>('none');
  const [clickOrder, setClickOrder] = useState<string[]>([]);
  const [priorityMode, setPriorityMode] = useState<'none' | 'red' | 'yellow'>('none');
  const [priorities, setPriorities] = useState<Record<string, 'red' | 'yellow'>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchScreenAndTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenId, refreshTrigger]);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      setIsAdmin(data?.is_admin || false);
    };
    fetchAdminStatus();
  }, [user]);

  const fetchScreenAndTasks = async () => {
    setLoading(true);

    const [screenResult, tasksResult] = await Promise.all([
      supabase.from('screens').select(`
        *,
        creator:users!screens_created_by_fkey(first_name, last_name, email)
      `).eq('id', screenId).single(),
      supabase.from('tasks').select(`
        *,
        creator:users!tasks_created_by_fkey(first_name, last_name, email)
      `).eq('screen_id', screenId).order('sort_order', { ascending: true })
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
    // Find the current task
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    // If clicking the same status, toggle it off to 'not_started'
    const statusToSet = currentTask.status === newStatus ? 'not_started' : newStatus;

    // Optimistically update the UI first
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, status: statusToSet } : t
      )
    );

    // Then update the database
    const { error } = await supabase
      .from('tasks')
      .update({ status: statusToSet })
      .eq('id', taskId);

    // If there was an error, revert the change
    if (error) {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, status: currentTask.status } : t
        )
      );
    }
  };


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newOrder);

      // Update sort_order in database
      const updates = newOrder.map((task, index) => ({
        id: task.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    }
  };

  const handleClickOrderSelect = (taskId: string) => {
    const currentIndex = clickOrder.indexOf(taskId);

    if (currentIndex >= 0) {
      setClickOrder(clickOrder.filter(id => id !== taskId));
    } else {
      setClickOrder([...clickOrder, taskId]);
    }
  };

  const handleSaveClickOrder = async () => {
    // Reorder tasks optimistically
    const reorderedTasks = [
      ...clickOrder.map(id => tasks.find(t => t.id === id)!),
      ...tasks.filter(t => !clickOrder.includes(t.id))
    ];

    // Update UI immediately
    setTasks(reorderedTasks.map((task, index) => ({
      ...task,
      sort_order: index + 1
    })));

    setClickOrder([]);
    setReorderMode('none');

    // Update database in background
    for (let i = 0; i < reorderedTasks.length; i++) {
      supabase
        .from('tasks')
        .update({ sort_order: i + 1 })
        .eq('id', reorderedTasks[i].id);
    }
  };

  const handleCancelReorder = () => {
    setReorderMode('none');
    setClickOrder([]);
  };

  const handlePriorityClick = (taskId: string) => {
    if (priorityMode === 'none') return;

    setPriorities(prev => {
      const current = prev[taskId];

      if (current === priorityMode) {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [taskId]: priorityMode };
    });
  };

  const handleDonePriority = () => {
    setPriorityMode('none');
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
          color: '#CCCCCC',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {screen.creator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="3.5" r="2"/>
                <path d="M2.5 10.5v-1a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v1"/>
              </svg>
              <span>
                Created by {screen.creator.first_name && screen.creator.last_name
                  ? `${screen.creator.first_name} ${screen.creator.last_name}`
                  : screen.creator.email}
              </span>
            </div>
          )}
          {screen.created_at && (
            <>
              {screen.creator && <span>•</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Left Side - Priority */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {priorityMode === 'none' ? (
            <button
              onClick={() => setPriorityMode('red')}
              style={{
                backgroundColor: '#EF444415',
                border: '1px solid #EF444430',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#EF4444',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6"/>
                <line x1="8" y1="5" x2="8" y2="8"/>
                <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
              </svg>
              Priority
            </button>
          ) : (
            <>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setPriorityMode('red')}
                  style={{
                    backgroundColor: priorityMode === 'red' ? '#EF4444' : '#EF444415',
                    border: priorityMode === 'red' ? 'none' : '1px solid #EF444430',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: priorityMode === 'red' ? '#FFFFFF' : '#EF4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔴 Red
                </button>
                <button
                  onClick={() => setPriorityMode('yellow')}
                  style={{
                    backgroundColor: priorityMode === 'yellow' ? '#EAB308' : '#EAB30815',
                    border: priorityMode === 'yellow' ? 'none' : '1px solid #EAB30830',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: priorityMode === 'yellow' ? '#FFFFFF' : '#EAB308',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🟡 Yellow
                </button>
                <button
                  onClick={handleDonePriority}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#999999',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1A1A1A';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#999999';
                  }}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Side - Reorder (Admin Only) */}
        {isAdmin && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {reorderMode === 'none' ? (
              <>
                <button
                  onClick={() => setReorderMode('click')}
                  style={{
                    backgroundColor: '#8B5CF615',
                    border: '1px solid #8B5CF630',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#8B5CF6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#8B5CF625';
                    e.currentTarget.style.borderColor = '#8B5CF6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8B5CF615';
                    e.currentTarget.style.borderColor = '#8B5CF630';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h2m5 0h3M6 4l-2 4 2 4m4-8l2 4-2 4"/>
                  </svg>
                  Click Order
                </button>
                <button
                  onClick={() => setReorderMode('drag')}
                  style={{
                    backgroundColor: '#06B6D415',
                    border: '1px solid #06B6D430',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#06B6D4',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#06B6D425';
                    e.currentTarget.style.borderColor = '#06B6D4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#06B6D415';
                    e.currentTarget.style.borderColor = '#06B6D430';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7h10M3 11h10M7 3l-4 4 4 4m2-8l4 4-4 4"/>
                  </svg>
                  Drag & Drop
                </button>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: reorderMode === 'click' ? '#8B5CF6' : '#06B6D4'
                }}>
                  {reorderMode === 'click' ? '📍 Click tasks in order' : '🖐️ Drag to reorder'}
                </div>
                {reorderMode === 'click' && clickOrder.length > 0 && (
                  <button
                    onClick={handleSaveClickOrder}
                    style={{
                      backgroundColor: '#22C55E',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Save Order
                  </button>
                )}
                <button
                  onClick={handleCancelReorder}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#999999',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1A1A1A';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#999999';
                  }}
                >
                  Done
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tasks grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {tasks.map(task => {
              const clickOrderIndex = clickOrder.indexOf(task.id);
              const priorityColor = priorities[task.id];
              const SortableTask = () => {
                const {
                  attributes,
                  listeners,
                  setNodeRef,
                  transform,
                  transition,
                  isDragging,
                } = useSortable({ id: task.id });

                const style = {
                  transform: CSS.Transform.toString(transform),
                  transition,
                  opacity: isDragging ? 0.5 : 1,
                };

                return (
                  <div
                    ref={setNodeRef}
                    style={style}
                    {...(reorderMode === 'drag' ? attributes : {})}
                    {...(reorderMode === 'drag' ? listeners : {})}
                  >
                    <div
                      onClick={() => {
                        if (priorityMode !== 'none') {
                          handlePriorityClick(task.id);
                        } else if (reorderMode === 'click') {
                          handleClickOrderSelect(task.id);
                        }
                      }}
                      style={{
                        backgroundColor: '#1A1A1A',
                        border: clickOrderIndex >= 0 ? '2px solid #06B6D4' : '1px solid #333333',
                        borderBottom: priorityColor ? `3px solid ${priorityColor === 'red' ? '#EF4444' : '#EAB308'}` : undefined,
                        borderRadius: '8px',
                        padding: '16px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        position: 'relative',
                        cursor: reorderMode === 'drag' ? 'grab' : (priorityMode !== 'none' || reorderMode === 'click' ? 'pointer' : 'default')
                      }}
                      onMouseEnter={(e) => {
                        if (reorderMode === 'none' && priorityMode === 'none') {
                          e.currentTarget.style.borderColor = '#666666';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (reorderMode === 'none' && priorityMode === 'none') {
                          e.currentTarget.style.borderColor = '#333333';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {/* Click order badge */}
                      {clickOrderIndex >= 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: '#06B6D4',
                          color: '#FFFFFF',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          zIndex: 10
                        }}>
                          {clickOrderIndex + 1}
                        </div>
                      )}

                      {/* Action buttons */}
                      {reorderMode === 'none' && (
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
                    )}

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

            {/* Status Toggle Buttons */}
            <div style={{
              marginBottom: '12px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={isAdmin ? () => handleStatusChange(task.id, 'in_progress') : undefined}
                style={{
                  flex: 1,
                  backgroundColor: task.status === 'in_progress' ? '#3B82F6' : '#000000',
                  border: task.status === 'in_progress' ? 'none' : '1px solid #1A1A1A',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: isAdmin ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: task.status === 'in_progress' ? 1 : 0.4
                }}
                onMouseEnter={(e) => {
                  if (isAdmin && task.status !== 'in_progress') {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.borderColor = '#3B82F640';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAdmin && task.status !== 'in_progress') {
                    e.currentTarget.style.opacity = '0.4';
                    e.currentTarget.style.borderColor = '#1A1A1A';
                  }
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={task.status === 'in_progress' ? '#FFFFFF' : '#3B82F6'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: task.status === 'in_progress' ? '#FFFFFF' : '#3B82F6'
                }}>
                  In Progress
                </span>
              </button>

              <button
                onClick={isAdmin ? () => handleStatusChange(task.id, 'review') : undefined}
                style={{
                  flex: 1,
                  backgroundColor: task.status === 'review' ? '#F59E0B' : '#000000',
                  border: task.status === 'review' ? 'none' : '1px solid #1A1A1A',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: isAdmin ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: task.status === 'review' ? 1 : 0.4
                }}
                onMouseEnter={(e) => {
                  if (isAdmin && task.status !== 'review') {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.borderColor = '#F59E0B40';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAdmin && task.status !== 'review') {
                    e.currentTarget.style.opacity = '0.4';
                    e.currentTarget.style.borderColor = '#1A1A1A';
                  }
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={task.status === 'review' ? '#FFFFFF' : '#F59E0B'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: task.status === 'review' ? '#FFFFFF' : '#F59E0B'
                }}>
                  Review
                </span>
              </button>

              <button
                onClick={isAdmin ? () => handleStatusChange(task.id, 'done') : undefined}
                style={{
                  flex: 1,
                  backgroundColor: task.status === 'done' ? '#22C55E' : '#000000',
                  border: task.status === 'done' ? 'none' : '1px solid #1A1A1A',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: isAdmin ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: task.status === 'done' ? 1 : 0.4
                }}
                onMouseEnter={(e) => {
                  if (isAdmin && task.status !== 'done') {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.borderColor = '#22C55E40';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isAdmin && task.status !== 'done') {
                    e.currentTarget.style.opacity = '0.4';
                    e.currentTarget.style.borderColor = '#1A1A1A';
                  }
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={task.status === 'done' ? '#FFFFFF' : '#22C55E'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: task.status === 'done' ? '#FFFFFF' : '#22C55E'
                }}>
                  Done
                </span>
              </button>
            </div>

            {/* Creator and Date */}
            <div style={{
              fontSize: '11px',
              color: '#CCCCCC',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {task.creator && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="3" r="2"/>
                    <path d="M2 9v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span>
                    {task.creator.first_name && task.creator.last_name
                      ? `${task.creator.first_name} ${task.creator.last_name}`
                      : task.creator.email}
                  </span>
                </div>
              )}
              {task.created_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="5" r="4"/>
                    <path d="M5 2.5v2.5l1.5 1"/>
                  </svg>
                  <span>{new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
                    </div>
                    </div>
                  </div>
                );
              };
              return <SortableTask key={task.id} />;
            })}

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
        </SortableContext>
      </DndContext>

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
