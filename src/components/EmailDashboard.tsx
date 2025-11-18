import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface EmailRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  sent_by: string;
  email_subject: string;
  personal_message: string;
  sent_at: string;
  email_sent_successfully: boolean;
  recipient_email?: string;
  recipient_name?: string;
  project_name?: string;
  status?: 'sent' | 'delivered' | 'opened' | 'clicked';
}

function EmailDashboard() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      // Fetch emails from email_history with user and project info
      const { data: emailsData, error } = await supabase
        .from('email_history')
        .select(`
          *,
          users!email_history_user_id_fkey (
            email,
            first_name,
            last_name,
            last_email_status
          ),
          projects (
            name
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Map the data to include recipient info
      const mappedEmails = emailsData?.map((email: any) => ({
        ...email,
        recipient_email: email.users?.email,
        recipient_name: email.users?.first_name && email.users?.last_name
          ? `${email.users.first_name} ${email.users.last_name}`
          : email.users?.email,
        project_name: email.projects?.name || 'No Project',
        status: email.users?.last_email_status || 'sent'
      })) || [];

      setEmails(mappedEmails);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'sent': return '#4CAF50';
      case 'opened': return '#2196F3';
      case 'clicked': return '#9C27B0';
      default: return '#666666';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'delivered': return 'rgba(76, 175, 80, 0.15)';
      case 'sent': return 'rgba(76, 175, 80, 0.15)';
      case 'opened': return 'rgba(33, 150, 243, 0.15)';
      case 'clicked': return 'rgba(156, 39, 176, 0.15)';
      default: return 'rgba(102, 102, 102, 0.15)';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `about ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.recipient_email?.toLowerCase().includes(query) ||
      email.recipient_name?.toLowerCase().includes(query) ||
      email.email_subject?.toLowerCase().includes(query) ||
      email.project_name?.toLowerCase().includes(query)
    );
  });

  const searchInputStyle = {
    flex: 1,
    minWidth: '250px',
    padding: '12px 16px',
    backgroundColor: '#000000',
    border: '1px solid #333333',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none'
  };

  const tableContainerStyle = {
    backgroundColor: '#000000',
    border: '1px solid #1a1a1a',
    borderRadius: '12px',
    overflow: 'hidden'
  };

  const tableHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 2fr 1.5fr',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#0a0a0a',
    borderBottom: '1px solid #1a1a1a',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#666666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  const tableRowStyle = (isClickable: boolean) => ({
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 2fr 1.5fr',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #1a1a1a',
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'background-color 0.2s ease'
  });

  const statusBadgeStyle = (status: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: getStatusColor(status),
    backgroundColor: getStatusBg(status),
    textTransform: 'capitalize' as const
  });

  const modalOverlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const modalContentStyle = {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto'
  };

  if (selectedEmail) {
    return (
      <div style={modalOverlayStyle} onClick={() => setSelectedEmail(null)}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              Email Details
            </h2>
            <button
              onClick={() => setSelectedEmail(null)}
              style={{
                backgroundColor: 'transparent',
                color: '#666666',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>To</div>
            <div style={{ fontSize: '16px', color: '#FFFFFF' }}>
              {selectedEmail.recipient_name} ({selectedEmail.recipient_email})
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>Project</div>
            <div style={{ fontSize: '16px', color: '#FFFFFF' }}>{selectedEmail.project_name}</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>Subject</div>
            <div style={{ fontSize: '16px', color: '#FFFFFF' }}>{selectedEmail.email_subject}</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>Status</div>
            <div>
              <span style={statusBadgeStyle(selectedEmail.status || 'sent')}>{selectedEmail.status || 'sent'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>Sent</div>
            <div style={{ fontSize: '16px', color: '#FFFFFF' }}>{formatTime(selectedEmail.sent_at)}</div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '12px', color: '#666666', marginBottom: '12px' }}>Personal Message</div>
            <div style={{
              backgroundColor: '#000000',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              padding: '16px',
              color: '#CCCCCC',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedEmail.personal_message || 'No message'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Search and Refresh */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by recipient, subject, or project..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...searchInputStyle, flex: 1 }}
        />
        <button
          onClick={loadEmails}
          disabled={loading}
          style={{
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            border: '1px solid #333333',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#1A1A1A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={tableContainerStyle}>
        <div style={tableHeaderStyle}>
          <div>To</div>
          <div>Project</div>
          <div>Status</div>
          <div>Subject</div>
          <div>Sent</div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666666' }}>
            Loading emails...
          </div>
        ) : filteredEmails.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666666' }}>
            {searchQuery ? 'No emails found matching your search' : 'No emails sent yet'}
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              style={tableRowStyle(true)}
              onClick={() => setSelectedEmail(email)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#0a0a0a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ color: '#FFFFFF', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>{email.recipient_name}</div>
                <div style={{ fontSize: '12px', color: '#666666' }}>{email.recipient_email}</div>
              </div>
              <div style={{ color: '#CCCCCC', fontSize: '14px' }}>
                {email.project_name}
              </div>
              <div>
                <span style={statusBadgeStyle(email.status || 'sent')}>{email.status || 'sent'}</span>
              </div>
              <div style={{ color: '#FFFFFF', fontSize: '14px' }}>
                {email.email_subject}
              </div>
              <div style={{ color: '#999999', fontSize: '14px' }}>
                {formatTime(email.sent_at)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center', color: '#666666', fontSize: '14px' }}>
        Showing {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default EmailDashboard;
