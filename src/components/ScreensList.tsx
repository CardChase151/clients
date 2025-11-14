import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import EditScreenModal from './EditScreenModal';
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

interface Screen {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string;
  sort_order: number;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  tasks?: Array<{
    id: string;
    status: string;
  }>;
}

interface ScreensListProps {
  projectId: string;
  onScreenClick: (screenId: string) => void;
  onAddScreen: () => void;
  refreshTrigger?: number;
  isAdmin?: boolean;
}

interface SortableScreenCardProps {
  screen: Screen;
  onScreenClick: (screenId: string) => void;
  onEdit: (screen: Screen) => void;
  onHistory: (id: string, title: string) => void;
  clickOrderIndex?: number;
  onClickSelect?: (screenId: string) => void;
  reorderMode: 'none' | 'click' | 'drag';
  priorityColor?: 'red' | 'yellow';
  onPriorityClick?: (screenId: string) => void;
  priorityMode: 'none' | 'red' | 'yellow';
}

function SortableScreenCard({
  screen,
  onScreenClick,
  onEdit,
  onHistory,
  clickOrderIndex,
  onClickSelect,
  reorderMode,
  priorityColor,
  onPriorityClick,
  priorityMode
}: SortableScreenCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTaskProgress = () => {
    if (!screen.tasks || screen.tasks.length === 0) {
      return { completed: 0, total: 0 };
    }
    const completed = screen.tasks.filter(t => t.status === 'done').length;
    const total = screen.tasks.length;
    return { completed, total };
  };

  const { completed, total } = getTaskProgress();
  const allDone = total > 0 && completed === total;
  const someProgress = total > 0 && completed > 0 && completed < total;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(reorderMode === 'drag' ? attributes : {})}
      {...(reorderMode === 'drag' ? listeners : {})}
    >
      <div
        onClick={() => {
          if (priorityMode !== 'none' && onPriorityClick) {
            onPriorityClick(screen.id);
          } else if (reorderMode === 'click' && onClickSelect) {
            onClickSelect(screen.id);
          } else if (reorderMode === 'none') {
            onScreenClick(screen.id);
          }
        }}
        style={{
          backgroundColor: '#1A1A1A',
          border: clickOrderIndex !== undefined ? '2px solid #06B6D4' : '1px solid #333333',
          borderBottom: priorityColor ? `3px solid ${priorityColor === 'red' ? '#EF4444' : '#EAB308'}` : undefined,
          borderRadius: '10px',
          padding: '20px',
          cursor: reorderMode === 'drag' ? 'grab' : (priorityMode !== 'none' ? 'pointer' : (reorderMode === 'click' ? 'pointer' : 'pointer')),
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          height: '180px',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          if (reorderMode === 'none' && priorityMode === 'none') {
            e.currentTarget.style.borderColor = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (reorderMode === 'none' && priorityMode === 'none') {
            e.currentTarget.style.borderColor = '#333333';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            // Restore priority border if it exists
            if (priorityColor) {
              e.currentTarget.style.borderBottom = `3px solid ${priorityColor === 'red' ? '#EF4444' : '#EAB308'}`;
            }
          }
        }}
      >
        {/* Click order badge */}
        {clickOrderIndex !== undefined && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: '#06B6D4',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
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
            gap: '4px',
            zIndex: 10
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHistory(screen.id, screen.title);
              }}
              style={{
                backgroundColor: '#8B5CF615',
                border: '1px solid #8B5CF630',
                borderRadius: '6px',
                padding: '6px',
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
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="5.5"/>
                <polyline points="7 3 7 7 9 9"/>
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(screen);
              }}
              style={{
                backgroundColor: '#06B6D415',
                border: '1px solid #06B6D430',
                borderRadius: '6px',
                padding: '6px',
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
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 1.5l2.5 2.5L5 11.5H2.5V9z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Header with title and progress */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
          paddingRight: reorderMode === 'none' ? '64px' : '0',
          paddingLeft: clickOrderIndex !== undefined ? '48px' : '0'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFFFFF',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {screen.title}
          </div>

          {/* Progress indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
            color: allDone ? '#22C55E' : (someProgress ? '#999999' : '#666666'),
            marginLeft: '12px',
            whiteSpace: 'nowrap'
          }}>
            {allDone && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 7 6 10 11 4"/>
              </svg>
            )}
            {someProgress && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="6"/>
                <polyline points="7 3 7 7 9 9"/>
              </svg>
            )}
            {completed}/{total}
          </div>
        </div>

        {/* Description - fixed height area */}
        <div style={{
          fontSize: '13px',
          color: '#999999',
          lineHeight: '1.5',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          marginBottom: '8px',
          flex: 1,
          minHeight: '60px'
        }}>
          {screen.description || ''}
        </div>

        {/* Footer - always at bottom */}
        <div style={{
          fontSize: '11px',
          color: '#666666',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: 'auto'
        }}>
          {screen.creator && (
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              by {screen.creator.first_name && screen.creator.last_name
                ? `${screen.creator.first_name} ${screen.creator.last_name}`
                : screen.creator.email}
            </span>
          )}
          {screen.creator && screen.created_at && (
            <span>•</span>
          )}
          {screen.created_at && (
            <span style={{ whiteSpace: 'nowrap' }}>{new Date(screen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ScreensList({ projectId, onScreenClick, onAddScreen, refreshTrigger, isAdmin = false }: ScreensListProps) {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [historyScreen, setHistoryScreen] = useState<{ id: string; title: string } | null>(null);
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
    fetchScreens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshTrigger]);

  const fetchScreens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('screens')
      .select(`
        *,
        creator:users!screens_created_by_fkey(first_name, last_name, email),
        tasks(id, status)
      `)
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setScreens(data);
    }
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = screens.findIndex((s) => s.id === active.id);
      const newIndex = screens.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(screens, oldIndex, newIndex);
      setScreens(newOrder);

      // Update sort_order in database
      const updates = newOrder.map((screen, index) => ({
        id: screen.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('screens')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    }
  };

  const handleClickOrderSelect = (screenId: string) => {
    const currentIndex = clickOrder.indexOf(screenId);

    if (currentIndex >= 0) {
      // Already selected, remove it
      setClickOrder(clickOrder.filter(id => id !== screenId));
    } else {
      // Add to order
      setClickOrder([...clickOrder, screenId]);
    }
  };

  const handleSaveClickOrder = async () => {
    // Reorder screens optimistically
    const reorderedScreens = [
      ...clickOrder.map(id => screens.find(s => s.id === id)!),
      ...screens.filter(s => !clickOrder.includes(s.id))
    ];

    // Update UI immediately
    setScreens(reorderedScreens.map((screen, index) => ({
      ...screen,
      sort_order: index + 1
    })));

    setClickOrder([]);
    setReorderMode('none');

    // Update database in background
    for (let i = 0; i < reorderedScreens.length; i++) {
      supabase
        .from('screens')
        .update({ sort_order: i + 1 })
        .eq('id', reorderedScreens[i].id);
    }
  };

  const handleCancelReorder = () => {
    setReorderMode('none');
    setClickOrder([]);
  };

  const handlePriorityClick = (screenId: string) => {
    if (priorityMode === 'none') return;

    setPriorities(prev => {
      const current = prev[screenId];

      // If clicking the same color, remove it
      if (current === priorityMode) {
        const { [screenId]: _, ...rest } = prev;
        return rest;
      }

      // Otherwise set the new color
      return { ...prev, [screenId]: priorityMode };
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
        Loading screens...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
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
                  {reorderMode === 'click' ? '📍 Click screens in order' : '🖐️ Drag to reorder'}
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={screens.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {screens.map(screen => {
              const clickOrderIndex = clickOrder.indexOf(screen.id);
              return (
                <SortableScreenCard
                  key={screen.id}
                  screen={screen}
                  onScreenClick={onScreenClick}
                  onEdit={setEditingScreen}
                  onHistory={(id, title) => setHistoryScreen({ id, title })}
                  clickOrderIndex={clickOrderIndex >= 0 ? clickOrderIndex : undefined}
                  onClickSelect={handleClickOrderSelect}
                  reorderMode={reorderMode}
                  priorityColor={priorities[screen.id]}
                  onPriorityClick={handlePriorityClick}
                  priorityMode={priorityMode}
                />
              );
            })}

            <div
              onClick={onAddScreen}
              style={{
                backgroundColor: 'transparent',
                border: '2px dashed #333333',
                borderRadius: '10px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '120px',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FFFFFF';
                e.currentTarget.style.backgroundColor = '#1A1A1A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16" y1="8" x2="16" y2="24"/>
                <line x1="8" y1="16" x2="24" y2="16"/>
              </svg>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#666666'
              }}>
                Add Screen/Component
              </div>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Modals */}
      {editingScreen && (
        <EditScreenModal
          isOpen={!!editingScreen}
          onClose={() => setEditingScreen(null)}
          onScreenUpdated={fetchScreens}
          screen={editingScreen}
        />
      )}

      {historyScreen && (
        <HistoryModal
          isOpen={!!historyScreen}
          onClose={() => setHistoryScreen(null)}
          itemId={historyScreen.id}
          itemType="screen"
          itemTitle={historyScreen.title}
        />
      )}
    </div>
  );
}

export default ScreensList;
