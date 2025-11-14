import React, { useState, useEffect } from 'react';
import { getEditHistory, EditHistoryEntry } from '../utils/editTracking';

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'project' | 'screen' | 'task';
  entityId: string;
  entityName: string;
}

function EditHistoryModal({ isOpen, onClose, entityType, entityId, entityName }: EditHistoryModalProps) {
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, entityId]);

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getEditHistory(entityType, entityId);
    setHistory(data);
    setLoading(false);
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
        maxWidth: '700px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid #333333'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: '4px'
            }}>
              Edit History
            </div>
            <div style={{
              fontSize: '14px',
              color: '#999999'
            }}>
              {entityName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#999999',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              lineHeight: 1,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#999999'}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666666'
          }}>
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666666'
          }}>
            No edit history available
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '12px',
              bottom: '12px',
              width: '2px',
              backgroundColor: '#333333'
            }} />

            {history.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  position: 'relative',
                  paddingLeft: '52px',
                  paddingBottom: index === history.length - 1 ? '0' : '24px'
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '6px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: '#1A1A1A',
                  border: '2px solid #FFFFFF'
                }} />

                <div style={{
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#999999',
                    marginBottom: '8px'
                  }}>
                    {formatDate(entry.edited_at)}
                  </div>

                  <div style={{
                    fontSize: '14px',
                    color: '#FFFFFF',
                    fontWeight: '500',
                    marginBottom: '12px'
                  }}>
                    Changed <span style={{ color: '#FFAA00' }}>{entry.field_name}</span>
                  </div>

                  {entry.old_value && (
                    <div style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #FF4444',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#FF4444',
                        fontWeight: '600',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Previous
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#CCCCCC',
                        lineHeight: '1.5'
                      }}>
                        {entry.old_value}
                      </div>
                    </div>
                  )}

                  {entry.new_value && (
                    <div style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #44FF44',
                      borderRadius: '6px',
                      padding: '10px 12px'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#44FF44',
                        fontWeight: '600',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Current
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#CCCCCC',
                        lineHeight: '1.5'
                      }}>
                        {entry.new_value}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EditHistoryModal;
