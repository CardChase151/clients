import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface HistoryEntry {
  id: string;
  title: string;
  description: string | null;
  status?: string;
  edited_by: string;
  edited_at: string;
  editor?: {
    email: string;
  };
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'screen' | 'task';
  itemTitle: string;
}

function HistoryModal({ isOpen, onClose, itemId, itemType, itemTitle }: HistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, itemId, itemType]);

  const fetchHistory = async () => {
    setLoading(true);

    const tableName = itemType === 'screen' ? 'screen_history' : 'task_history';
    const idColumn = itemType === 'screen' ? 'screen_id' : 'task_id';

    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        editor:users!edited_by(email)
      `)
      .eq(idColumn, itemId)
      .order('edited_at', { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#64748B';
    switch (status) {
      case 'not_started': return '#64748B';
      case 'in_progress': return '#3B82F6';
      case 'waiting': return '#F59E0B';
      case 'done': return '#22C55E';
      default: return '#64748B';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'waiting': return 'Waiting';
      case 'done': return 'Done';
      default: return status;
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
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #333333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div style={{ flex: 1, marginRight: '16px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#FFFFFF',
                margin: '0 0 8px 0'
              }}
            >
              Edit History
            </h2>
            <div
              style={{
                fontSize: '14px',
                color: '#999999',
                wordBreak: 'break-word'
              }}
            >
              {itemTitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#999999',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#999999';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: '#666666'
              }}
            >
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: '#666666',
                textAlign: 'center'
              }}
            >
              No edit history yet
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '16px',
                  bottom: '16px',
                  width: '2px',
                  backgroundColor: '#333333'
                }}
              />

              {/* Timeline entries */}
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    position: 'relative',
                    paddingLeft: '40px',
                    paddingBottom: index === history.length - 1 ? '0' : '24px'
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#1A1A1A',
                      border: '2px solid #FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 2h6M2 5h4M2 8h5" />
                    </svg>
                  </div>

                  {/* Entry content */}
                  <div
                    style={{
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '16px'
                    }}
                  >
                    {/* Timestamp and editor */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#999999',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="#999999"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="6" cy="6" r="4.5" />
                          <path d="M6 3v3l2 1" />
                        </svg>
                        {formatDateTime(entry.edited_at)}
                      </div>
                      {entry.editor && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999999',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="#999999"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="6" cy="3.5" r="2" />
                            <path d="M2.5 10.5v-1a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5v1" />
                          </svg>
                          {entry.editor.email}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '8px',
                        wordBreak: 'break-word'
                      }}
                    >
                      {entry.title}
                    </div>

                    {/* Description */}
                    {entry.description && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#999999',
                          lineHeight: '1.5',
                          marginBottom: '8px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {entry.description}
                      </div>
                    )}

                    {/* Status (for tasks only) */}
                    {entry.status && (
                      <div
                        style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: getStatusColor(entry.status),
                          backgroundColor: `${getStatusColor(entry.status)}15`,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${getStatusColor(entry.status)}30`
                        }}
                      >
                        {getStatusLabel(entry.status)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;
