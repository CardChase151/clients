import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';
import UploadProjectSection from '../components/UploadProjectSection';
import SendUpdatesSection from '../components/SendUpdatesSection';
import EmailDashboard from '../components/EmailDashboard';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  approved: boolean;
  is_admin: boolean;
  created_at: string;
  profile_complete: boolean;
  discovery_payment_type: 'paid' | 'waived' | null;
  proposal_status: 'sent' | 'reviewed' | null;
  invoice_payment_type: 'paid' | 'waived' | null;
  last_email_sent_date: string | null;
  last_email_opened_date: string | null;
  last_email_status: 'sent' | 'delivered' | 'opened' | 'clicked' | null;
}

function Admin() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<'upload' | 'users' | 'emails' | 'history'>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [milestoneModal, setMilestoneModal] = useState<{
    userId: string;
    type: 'discovery' | 'proposal' | 'invoice';
  } | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sendMilestoneEmail, setSendMilestoneEmail] = useState(false);
  const [updatingMilestone, setUpdatingMilestone] = useState(false);
  const [selectedMilestoneValue, setSelectedMilestoneValue] = useState<string | null>(null);
  const [milestoneUrl, setMilestoneUrl] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [proposalPdf, setProposalPdf] = useState<File | null>(null);
  const [showSendNowModal, setShowSendNowModal] = useState<{ type: 'proposal' | 'invoice'; userId: string } | null>(null);
  const [sendNowUrl, setSendNowUrl] = useState('');
  const [sendNowFile, setSendNowFile] = useState<File | null>(null);
  const [sendingNow, setSendingNow] = useState(false);
  const [approvalModal, setApprovalModal] = useState<{ userId: string; userEmail: string; userName: string } | null>(null);
  const [sendingApprovalEmail, setSendingApprovalEmail] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ userId: string; userName: string } | null>(null);
  const [payments, setPayments] = useState<Array<{ id: string; name: string; amount: number; paid: boolean }>>([]);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!error && data?.is_admin) {
          setIsAdmin(true);
          fetchUsers();
        } else {
          navigate('/');
        }
      } catch (err) {
        navigate('/');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean, userEmail: string, userName: string) => {
    // If approving (currentStatus is false), show email confirmation modal
    if (!currentStatus) {
      setApprovalModal({ userId, userEmail, userName });
      return;
    }

    // If unapproving, just do it without email
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved: false })
        .eq('id', userId);

      if (!error) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating approval:', err);
    }
  };

  const handleApprovalConfirm = async (sendEmail: boolean) => {
    if (!approvalModal) return;

    try {
      // Update user approval status
      const { error } = await supabase
        .from('users')
        .update({ approved: true })
        .eq('id', approvalModal.userId);

      if (error) throw error;

      // Send email if requested
      if (sendEmail) {
        setSendingApprovalEmail(true);
        try {
          await fetch('/.netlify/functions/send-approval-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: approvalModal.userEmail,
              firstName: approvalModal.userName.split(' ')[0]
            })
          });
        } catch (emailErr) {
          console.error('Failed to send approval email:', emailErr);
        }
        setSendingApprovalEmail(false);
      }

      fetchUsers();
      setApprovalModal(null);
    } catch (err) {
      console.error('Error approving user:', err);
      setSendingApprovalEmail(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      setError('Email and password are required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          firstName: newUserFirstName,
          lastName: newUserLastName
        })
      });

      const data = await response.json();

      console.log('Create user response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Create user error:', data.error);
        throw new Error(data.error || 'Failed to create user');
      }

      // Send welcome email if checkbox is checked
      if (sendWelcomeEmail) {
        const welcomeResponse = await fetch('/.netlify/functions/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: newUserEmail,
            firstName: newUserFirstName,
            password: newUserPassword
          })
        });

        if (!welcomeResponse.ok) {
          console.error('Welcome email failed to send');
          // Don't fail the whole operation if email fails
        }
      }

      // Success - refresh user list and close modal
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setSendWelcomeEmail(false);
      fetchUsers();

    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Success - refresh user list
      fetchUsers();

    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const getMilestoneEmailContent = (type: 'discovery' | 'proposal' | 'invoice', value: string, url?: string) => {
    const messages: { [key: string]: { subject: string; message: string | ((url?: string) => string) } } = {
      'discovery-sent': {
        subject: 'Discovery Period Information',
        message: (url?: string) => {
          const baseMessage = 'Generally, we charge for a discovery period to ensure we fully understand your goals, industry, user interactions, and how your company and team work together. This helps us create the best possible solution for you.';
          if (url) {
            return `${baseMessage}\n\nBelow is a link to your invoice for the discovery period:\n${url}\n\nPlease let us know if you have any questions.`;
          }
          return `${baseMessage}\n\nWe'll be in touch if that's necessary for this app.`;
        }
      },
      'discovery-paid': {
        subject: 'Account Update - Discovery Period',
        message: 'Your account has been updated. Discovery period status has been marked as paid.'
      },
      'discovery-waived': {
        subject: 'Account Update - Discovery Period',
        message: 'Your account has been updated. Discovery period fee has been waived.'
      },
      'proposal-sent': {
        subject: 'Your Project Proposal',
        message: "Here's your project proposal! Let's talk soon about when we can review it together. Looking forward to discussing the details with you."
      },
      'proposal-reviewed': {
        subject: 'Thank You - Proposal Review',
        message: 'Thank you for taking the time to review the proposal together. We hope we are continuing to earn your trust and exceed your expectations.'
      },
      'invoice-sent': {
        subject: 'Project Invoice',
        message: (url?: string) => {
          if (url) {
            return `Included below is a link to the invoice directly:\n\n${url}\n\nPlease let us know if you have any questions.`;
          }
          return 'An invoice has been sent to you.';
        }
      },
      'invoice-paid': {
        subject: 'Thank You - Payment Received',
        message: 'Thank you! Your payment has been received. We look forward to being the spark to your purpose and bringing your vision to life.'
      },
      'invoice-waived': {
        subject: 'Account Update - Invoice',
        message: 'Your account has been updated. Invoice has been waived.'
      }
    };

    const content = messages[`${type}-${value}`];
    if (typeof content.message === 'function') {
      return { subject: content.subject, message: content.message(url) };
    }
    return { subject: content.subject, message: content.message };
  };

  const handleConfirmMilestone = async () => {
    if (!milestoneModal || !selectedMilestoneValue) return;

    setUpdatingMilestone(true);

    try {
      const updateData: any = {};
      const { userId, type } = milestoneModal;
      const value = selectedMilestoneValue;

      if (type === 'discovery') {
        updateData.discovery_payment_type = value;
        if (value === 'sent') {
          updateData.discovery_complete = false; // Sent but not complete
          updateData.discovery_complete_date = null;
        } else if (value) {
          updateData.discovery_complete = true;
          updateData.discovery_complete_date = new Date().toISOString();
        } else {
          updateData.discovery_complete = false;
          updateData.discovery_complete_date = null;
        }
      } else if (type === 'proposal') {
        updateData.proposal_status = value;
        if (value === 'reviewed') {
          updateData.proposal_reviewed = true;
          updateData.proposal_reviewed_date = new Date().toISOString();
        } else if (!value) {
          updateData.proposal_reviewed = false;
          updateData.proposal_reviewed_date = null;
        }
      } else if (type === 'invoice') {
        updateData.invoice_payment_type = value;
        if (value) {
          updateData.invoice_fulfilled = true;
          updateData.invoice_fulfilled_date = new Date().toISOString();
        } else {
          updateData.invoice_fulfilled = false;
          updateData.invoice_fulfilled_date = null;
        }
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Send email if checkbox is checked and value is not null
      if (sendMilestoneEmail && value) {
        const userToEmail = users.find(u => u.id === userId);
        const emailContent = getMilestoneEmailContent(type, value, milestoneUrl || undefined);

        if (userToEmail && emailContent) {
          // Convert PDF to base64 if present
          let pdfBase64 = null;
          let pdfFilename = null;
          if (proposalPdf) {
            const reader = new FileReader();
            pdfBase64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const base64 = reader.result as string;
                // Remove the data:application/pdf;base64, prefix
                resolve(base64.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(proposalPdf);
            });
            pdfFilename = proposalPdf.name;
          }

          const response = await fetch('/.netlify/functions/send-milestone-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: userToEmail.email,
              firstName: userToEmail.first_name,
              subject: emailContent.subject,
              message: emailContent.message,
              pdfBase64: pdfBase64,
              pdfFilename: pdfFilename,
              userId: userId
            })
          });

          if (!response.ok) {
            const data = await response.json();
            console.error('Email send error:', data.error);
            // Don't fail the whole operation if email fails
            alert('Milestone updated but email failed to send: ' + (data.error || 'Unknown error'));
          }
        }
      }

      fetchUsers();
      setMilestoneModal(null);
      setSendMilestoneEmail(false);
      setSelectedMilestoneValue(null);
      setMilestoneUrl('');
      setProposalPdf(null);

    } catch (err: any) {
      console.error('Error updating milestone:', err);
      alert('Failed to update milestone: ' + err.message);
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const handleClearMilestone = async () => {
    if (!milestoneModal) return;

    setUpdatingMilestone(true);

    try {
      const updateData: any = {};
      const { userId, type } = milestoneModal;

      if (type === 'discovery') {
        updateData.discovery_payment_type = null;
        updateData.discovery_complete = false;
        updateData.discovery_complete_date = null;
      } else if (type === 'proposal') {
        updateData.proposal_status = null;
        updateData.proposal_reviewed = false;
        updateData.proposal_reviewed_date = null;
      } else if (type === 'invoice') {
        updateData.invoice_payment_type = null;
        updateData.invoice_fulfilled = false;
        updateData.invoice_fulfilled_date = null;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
      setMilestoneModal(null);
      setSendMilestoneEmail(false);
      setSelectedMilestoneValue(null);
      setMilestoneUrl('');
      setProposalPdf(null);

    } catch (err: any) {
      console.error('Error clearing milestone:', err);
      alert('Failed to clear milestone: ' + err.message);
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const handleSendNow = async (userId: string, type: 'proposal' | 'invoice') => {
    setSendingNow(true);

    try {
      const userToEmail = users.find(u => u.id === userId);
      if (!userToEmail) throw new Error('User not found');

      // Convert PDF to base64 if present
      let pdfBase64 = null;
      let pdfFilename = null;
      if (sendNowFile) {
        const reader = new FileReader();
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove the data:application/pdf;base64, prefix
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(sendNowFile);
        });
        pdfFilename = sendNowFile.name;
      }

      // Send the email
      const response = await fetch('/.netlify/functions/send-proposal-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userToEmail.email,
          firstName: userToEmail.first_name,
          type: type,
          fileUrl: sendNowUrl || undefined,
          pdfBase64: pdfBase64,
          pdfFilename: pdfFilename,
          userId: userId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      // Update database to mark as "sent" + track email
      const updateData: any = {
        last_email_sent_date: new Date().toISOString(),
        last_email_status: 'sent',
        last_email_opened_date: null // Reset opened date for new email
      };

      if (type === 'proposal') {
        updateData.proposal_status = 'sent';
      } else {
        // For invoice, we don't update invoice_payment_type (that's for paid/waived)
        // Just track that we sent the invoice email
        updateData.invoice_fulfilled = false; // Not yet paid/fulfilled
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Success
      fetchUsers();
      setShowSendNowModal(null);
      setSendNowUrl('');
      setSendNowFile(null);
      alert(`${type === 'proposal' ? 'Proposal' : 'Invoice'} sent successfully!`);

    } catch (err: any) {
      console.error('Error sending:', err);
      alert(`Failed to send ${type}: ` + err.message);
    } finally {
      setSendingNow(false);
    }
  };

  const fetchPayments = async (userId: string) => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const addPayment = async (userId: string, name: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          name: name,
          amount: amount,
          paid: false
        });

      if (!error) {
        fetchPayments(userId);
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      alert('Failed to add payment');
    }
  };

  const togglePaymentPaid = async (paymentId: string, currentPaidStatus: boolean, userId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ paid: !currentPaidStatus })
        .eq('id', paymentId);

      if (!error) {
        fetchPayments(userId);
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment');
    }
  };

  const deletePayment = async (paymentId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (!error) {
        fetchPayments(userId);
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('Failed to delete payment');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="admin-header mobile-safe-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #333333',
        position: 'sticky',
        top: 0,
        backgroundColor: '#000000',
        zIndex: 100
      }}>
        <h1 className="admin-header-title" style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: 0,
          color: '#FFFFFF',
          letterSpacing: '-0.02em'
        }}>
          Admin Panel
        </h1>

        <button
          onClick={handleLogout}
          className="admin-logout-btn"
          style={{
            backgroundColor: 'transparent',
            color: '#666666',
            border: '1px solid #333333',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
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
      </header>

      {/* Mobile Section Selector */}
      <div className="admin-mobile-selector" style={{
        display: 'none',
        padding: '16px 20px',
        borderBottom: '1px solid #333333',
        backgroundColor: '#0A0A0A'
      }}>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            width: '100%',
            backgroundColor: '#1A1A1A',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '14px 16px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeSection === 'users' && (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 13v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1"/>
                  <circle cx="7" cy="5" r="3"/>
                  <path d="M13 7l2 2 4-4"/>
                </svg>
                User Management
              </>
            )}
            {activeSection === 'upload' && (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 4v10m-5-5l5-5 5 5M3 13v2h12v-2"/>
                </svg>
                Upload Project
              </>
            )}
            {activeSection === 'emails' && (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h12M3 5l6 4 6-4M3 5v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5"/>
                </svg>
                Send Updates
              </>
            )}
            {activeSection === 'history' && (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="14" height="11" rx="2"/>
                  <path d="M2 7h14M6 4v-2M12 4v-2"/>
                </svg>
                Email History
              </>
            )}
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="#999999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showMobileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <polyline points="6 8 10 12 14 8"/>
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMobileMenu && (
          <div style={{
            marginTop: '8px',
            backgroundColor: '#1A1A1A',
            border: '1px solid #333333',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => {
                setActiveSection('users');
                setShowMobileMenu(false);
              }}
              style={{
                width: '100%',
                backgroundColor: activeSection === 'users' ? '#0A0A0A' : 'transparent',
                color: activeSection === 'users' ? '#FFFFFF' : '#999999',
                border: 'none',
                borderBottom: '1px solid #333333',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 13v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1"/>
                <circle cx="7" cy="5" r="3"/>
                <path d="M13 7l2 2 4-4"/>
              </svg>
              User Management
            </button>

            <button
              onClick={() => {
                setActiveSection('upload');
                setShowMobileMenu(false);
              }}
              style={{
                width: '100%',
                backgroundColor: activeSection === 'upload' ? '#0A0A0A' : 'transparent',
                color: activeSection === 'upload' ? '#FFFFFF' : '#999999',
                border: 'none',
                borderBottom: '1px solid #333333',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4v10m-5-5l5-5 5 5M3 13v2h12v-2"/>
              </svg>
              Upload Project
            </button>

            <button
              onClick={() => {
                setActiveSection('emails');
                setShowMobileMenu(false);
              }}
              style={{
                width: '100%',
                backgroundColor: activeSection === 'emails' ? '#0A0A0A' : 'transparent',
                color: activeSection === 'emails' ? '#FFFFFF' : '#999999',
                border: 'none',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h12M3 5l6 4 6-4M3 5v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5"/>
              </svg>
              Send Updates
            </button>

            <button
              onClick={() => {
                setActiveSection('history');
                setShowMobileMenu(false);
              }}
              style={{
                width: '100%',
                backgroundColor: activeSection === 'history' ? '#0A0A0A' : 'transparent',
                color: activeSection === 'history' ? '#FFFFFF' : '#999999',
                border: 'none',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="14" height="11" rx="2"/>
                <path d="M2 7h14M6 4v-2M12 4v-2"/>
              </svg>
              Email History
            </button>
          </div>
        )}
      </div>

      <div className="admin-layout" style={{ display: 'flex' }}>
        {/* Side Menu */}
        <div className="admin-sidebar" style={{
          width: '240px',
          borderRight: '1px solid #333333',
          padding: '20px',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveSection('users')}
              style={{
                backgroundColor: activeSection === 'users' ? '#1A1A1A' : 'transparent',
                color: activeSection === 'users' ? '#FFFFFF' : '#999999',
                border: activeSection === 'users' ? '1px solid #333333' : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'users') {
                  e.currentTarget.style.backgroundColor = '#0A0A0A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'users') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 13v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1"/>
                <circle cx="7" cy="5" r="3"/>
                <path d="M13 7l2 2 4-4"/>
              </svg>
              User Management
            </button>

            <button
              onClick={() => setActiveSection('upload')}
              style={{
                backgroundColor: activeSection === 'upload' ? '#1A1A1A' : 'transparent',
                color: activeSection === 'upload' ? '#FFFFFF' : '#999999',
                border: activeSection === 'upload' ? '1px solid #333333' : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'upload') {
                  e.currentTarget.style.backgroundColor = '#0A0A0A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'upload') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4v10m-5-5l5-5 5 5M3 13v2h12v-2"/>
              </svg>
              Upload Project
            </button>

            <button
              onClick={() => setActiveSection('emails')}
              style={{
                backgroundColor: activeSection === 'emails' ? '#1A1A1A' : 'transparent',
                color: activeSection === 'emails' ? '#FFFFFF' : '#999999',
                border: activeSection === 'emails' ? '1px solid #333333' : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'emails') {
                  e.currentTarget.style.backgroundColor = '#0A0A0A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'emails') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h12M3 5l6 4 6-4M3 5v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5"/>
              </svg>
              Send Updates
            </button>

            <button
              onClick={() => setActiveSection('history')}
              style={{
                backgroundColor: activeSection === 'history' ? '#1A1A1A' : 'transparent',
                color: activeSection === 'history' ? '#FFFFFF' : '#999999',
                border: activeSection === 'history' ? '1px solid #333333' : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'history') {
                  e.currentTarget.style.backgroundColor = '#0A0A0A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'history') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999999';
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="14" height="11" rx="2"/>
                <path d="M2 7h14M6 4v-2M12 4v-2"/>
              </svg>
              Email History
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main-content" style={{ flex: 1 }}>
          {activeSection === 'upload' && <UploadProjectSection />}

          {activeSection === 'emails' && <SendUpdatesSection />}

          {activeSection === 'history' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 20px 0',
                color: '#FFFFFF'
              }}>
                Email History
              </h2>
              <EmailDashboard />
            </div>
          )}

          {activeSection === 'users' && (
            <div className="admin-users-section" style={{ padding: '20px' }}>
              <div className="admin-users-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#FFFFFF'
                }}>
                  User Management
                </h2>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={fetchUsers}
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
                      gap: '8px'
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

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    + Add User
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                  No users found
                </div>
              ) : (
                <div className="admin-users-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="admin-user-card"
                      style={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}>
                          {getUserDisplayName(u)}
                        </div>
                        {u.first_name && u.last_name && (
                          <div style={{
                            fontSize: '12px',
                            color: '#666666',
                            marginBottom: '4px'
                          }}>
                            {u.email}
                          </div>
                        )}
                        <div style={{
                          fontSize: '12px',
                          color: '#666666',
                          display: 'flex',
                          gap: '12px'
                        }}>
                          <span>
                            Status: {u.approved ? (
                              <span style={{ color: '#4ADE80' }}>Approved</span>
                            ) : (
                              <span style={{ color: '#F87171' }}>Pending</span>
                            )}
                          </span>
                          {u.is_admin && (
                            <span style={{ color: '#FFFFFF' }}>• Admin</span>
                          )}
                        </div>
                      </div>

                      <div className="admin-user-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Email Status */}
                        {!u.is_admin && u.last_email_sent_date && (
                          <div style={{ fontSize: '12px', color: '#666666', marginRight: '12px', whiteSpace: 'nowrap' }}>
                            Sent: {new Date(u.last_email_sent_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                            {u.last_email_opened_date ? (
                              <span style={{ color: '#4ADE80', marginLeft: '8px' }}>
                                Opened: {new Date(u.last_email_opened_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                              </span>
                            ) : (
                              <span style={{ color: '#F59E0B', marginLeft: '8px' }}>Not opened</span>
                            )}
                          </div>
                        )}

                        {/* Milestone Icons */}
                        {!u.is_admin && (
                          <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
                            {/* Profile Completion Status Icon */}
                            <div
                              title={u.profile_complete ? "Profile Complete" : "Profile Incomplete"}
                              style={{
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: u.profile_complete ? 1 : 0.4,
                                position: 'relative'
                              }}
                            >
                              {u.profile_complete ? (
                                // Profile complete - user icon with checkmark
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                  <polyline points="9 11 11 13 15 9" strokeWidth="2.5"/>
                                </svg>
                              ) : (
                                // Profile incomplete - user icon with X
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                  <line x1="10" y1="10" x2="14" y2="14" strokeWidth="2.5"/>
                                  <line x1="14" y1="10" x2="10" y2="14" strokeWidth="2.5"/>
                                </svg>
                              )}
                            </div>

                            {/* Discovery Icon */}
                            <button
                              onClick={() => setMilestoneModal({ userId: u.id, type: 'discovery' })}
                              title="Discovery"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={u.discovery_payment_type ? '#FFFFFF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                              </svg>
                            </button>

                            {/* Proposal Icon */}
                            <button
                              onClick={() => setMilestoneModal({ userId: u.id, type: 'proposal' })}
                              title="Proposal"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={u.proposal_status ? '#FFFFFF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                              </svg>
                            </button>

                            {/* Invoice Icon */}
                            <button
                              onClick={() => setMilestoneModal({ userId: u.id, type: 'invoice' })}
                              title="Invoice"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={u.invoice_payment_type ? '#FFFFFF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"/>
                                <line x1="2" y1="10" x2="22" y2="10"/>
                              </svg>
                            </button>

                            {/* Payment Breakdown Icon */}
                            <button
                              onClick={() => {
                                setPaymentModal({
                                  userId: u.id,
                                  userName: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email
                                });
                                fetchPayments(u.id);
                              }}
                              title="Payment Breakdown"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => toggleApproval(
                            u.id,
                            u.approved,
                            u.email,
                            u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email
                          )}
                          style={{
                            backgroundColor: u.approved ? 'transparent' : '#FFFFFF',
                            color: u.approved ? '#666666' : '#000000',
                            border: u.approved ? '1px solid #333333' : 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (u.approved) {
                              e.currentTarget.style.backgroundColor = '#1A1A1A';
                              e.currentTarget.style.color = '#FFFFFF';
                            } else {
                              e.currentTarget.style.opacity = '0.9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (u.approved) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#666666';
                            } else {
                              e.currentTarget.style.opacity = '1';
                            }
                          }}
                        >
                          {u.approved ? 'Revoke' : 'Approve'}
                        </button>

                        {!u.is_admin && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#F87171',
                              border: '1px solid #F87171',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F87171';
                              e.currentTarget.style.color = '#000000';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#F87171';
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomBar activeTab="admin" />

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          onClick={() => {
            setShowAddUserModal(false);
            setError('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 20px 0'
            }}>
              Add New User
            </h3>

            {error && (
              <div style={{
                backgroundColor: '#F87171',
                color: '#000000',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#999999',
                  marginBottom: '6px'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#999999',
                  marginBottom: '6px'
                }}>
                  Password *
                </label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#999999',
                  marginBottom: '6px'
                }}>
                  First Name (Optional)
                </label>
                <input
                  type="text"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder="John"
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#999999',
                  marginBottom: '6px'
                }}>
                  Last Name (Optional)
                </label>
                <input
                  type="text"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder="Doe"
                  style={{
                    width: '100%',
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                backgroundColor: '#0A0A0A',
                borderRadius: '8px',
                border: '1px solid #333333'
              }}>
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <label style={{
                  fontSize: '13px',
                  color: '#999999',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => setSendWelcomeEmail(!sendWelcomeEmail)}
                >
                  Send welcome email with login details
                </label>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setError('');
                  }}
                  disabled={creating}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#666666',
                    border: '1px solid #333333',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateUser}
                  disabled={creating}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1
                  }}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {milestoneModal && (
        <div
          onClick={() => setMilestoneModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 20px 0'
            }}>
              {milestoneModal.type === 'discovery' && 'Discovery Period'}
              {milestoneModal.type === 'proposal' && 'Proposal'}
              {milestoneModal.type === 'invoice' && 'Invoice'}
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#999999',
              marginBottom: '20px'
            }}>
              {milestoneModal.type === 'discovery' && 'Select discovery period status:'}
              {milestoneModal.type === 'proposal' && 'Select proposal status:'}
              {milestoneModal.type === 'invoice' && 'Select invoice status:'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {milestoneModal.type === 'discovery' && (
                <>
                  <button
                    onClick={() => setSelectedMilestoneValue('sent')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'sent' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'sent' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Sent
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('paid')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'paid' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'paid' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('waived')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'waived' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'waived' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Waived
                  </button>
                </>
              )}

              {milestoneModal.type === 'proposal' && (
                <>
                  <button
                    onClick={() => {
                      const userId = milestoneModal.userId;
                      setMilestoneModal(null);
                      setShowSendNowModal({ type: 'proposal', userId });
                    }}
                    style={{
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Send Now
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('sent')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'sent' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'sent' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Sent
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('reviewed')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'reviewed' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'reviewed' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Reviewed
                  </button>
                </>
              )}

              {milestoneModal.type === 'invoice' && (
                <>
                  <button
                    onClick={() => {
                      const userId = milestoneModal.userId;
                      setMilestoneModal(null);
                      setShowSendNowModal({ type: 'invoice', userId });
                    }}
                    style={{
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Send Now
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('sent')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'sent' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'sent' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Sent
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('paid')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'paid' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'paid' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => setSelectedMilestoneValue('waived')}
                    style={{
                      backgroundColor: selectedMilestoneValue === 'waived' ? '#FFFFFF' : 'transparent',
                      color: selectedMilestoneValue === 'waived' ? '#000000' : '#FFFFFF',
                      border: '1px solid #FFFFFF',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Waived
                  </button>
                </>
              )}

              {/* Optional URL field for Discovery/Invoice Sent */}
              {((milestoneModal.type === 'discovery' && selectedMilestoneValue === 'sent') ||
                (milestoneModal.type === 'invoice' && selectedMilestoneValue === 'sent')) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#999999',
                    marginBottom: '6px'
                  }}>
                    Invoice URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={milestoneUrl}
                    onChange={(e) => setMilestoneUrl(e.target.value)}
                    placeholder="https://square.link/..."
                    style={{
                      width: '100%',
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Optional PDF upload for Proposal Sent */}
              {milestoneModal.type === 'proposal' && selectedMilestoneValue === 'sent' && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#999999',
                    marginBottom: '6px'
                  }}>
                    Proposal PDF (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setProposalPdf(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                  {proposalPdf && (
                    <p style={{ fontSize: '12px', color: '#999999', marginTop: '6px' }}>
                      Selected: {proposalPdf.name}
                    </p>
                  )}
                </div>
              )}

              {/* Email Notification Checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                backgroundColor: '#0A0A0A',
                borderRadius: '8px',
                border: '1px solid #333333',
                marginTop: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={sendMilestoneEmail}
                  onChange={(e) => setSendMilestoneEmail(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <label style={{
                  fontSize: '13px',
                  color: '#999999',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => setSendMilestoneEmail(!sendMilestoneEmail)}
                >
                  Send email notification to user
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    setMilestoneModal(null);
                    setSelectedMilestoneValue(null);
                    setSendMilestoneEmail(false);
                    setMilestoneUrl('');
                    setProposalPdf(null);
                  }}
                  disabled={updatingMilestone}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#666666',
                    border: '1px solid #333333',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: updatingMilestone ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: updatingMilestone ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>

                {selectedMilestoneValue && (
                  <button
                    onClick={handleConfirmMilestone}
                    disabled={updatingMilestone}
                    style={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: updatingMilestone ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: updatingMilestone ? 0.5 : 1
                    }}
                  >
                    {updatingMilestone ? 'Updating...' : 'Confirm'}
                  </button>
                )}

                {!selectedMilestoneValue && (
                  <button
                    onClick={handleClearMilestone}
                    disabled={updatingMilestone}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      color: '#F87171',
                      border: '1px solid #F87171',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: updatingMilestone ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: updatingMilestone ? 0.5 : 1
                    }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {approvalModal && (
        <div
          onClick={() => setApprovalModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 16px 0'
            }}>
              Approve User
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#CCCCCC',
              margin: '0 0 24px 0',
              lineHeight: '1.6'
            }}>
              You're about to approve <strong style={{ color: '#FFFFFF' }}>{approvalModal.userName}</strong>.
            </p>

            <p style={{
              fontSize: '14px',
              color: '#CCCCCC',
              margin: '0 0 24px 0',
              lineHeight: '1.6'
            }}>
              Would you like to send them an email notification?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleApprovalConfirm(false)}
                disabled={sendingApprovalEmail}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#FFFFFF',
                  border: '1px solid #333333',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sendingApprovalEmail ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: sendingApprovalEmail ? 0.5 : 1
                }}
              >
                No Email
              </button>

              <button
                onClick={() => handleApprovalConfirm(true)}
                disabled={sendingApprovalEmail}
                style={{
                  flex: 1,
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sendingApprovalEmail ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: sendingApprovalEmail ? 0.5 : 1
                }}
              >
                {sendingApprovalEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Now Modal */}
      {showSendNowModal && (
        <div
          onClick={() => setShowSendNowModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 8px 0'
            }}>
              Send {showSendNowModal.type === 'proposal' ? 'Proposal' : 'Invoice'} Now
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#999999',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              This will send a professional email with your {showSendNowModal.type === 'proposal' ? 'proposal' : 'invoice'} and mark it as "Sent" in the system.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#999999',
                marginBottom: '6px'
              }}>
                {showSendNowModal.type === 'proposal' ? 'Proposal' : 'Invoice'} URL
              </label>
              <input
                type="url"
                value={sendNowUrl}
                onChange={(e) => setSendNowUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '12px', color: '#666666', marginTop: '6px' }}>
                Optional: Add a link to view the {showSendNowModal.type === 'proposal' ? 'proposal' : 'invoice'} online
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#999999',
                marginBottom: '6px'
              }}>
                Or Upload PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSendNowFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              />
              {sendNowFile && (
                <p style={{ fontSize: '12px', color: '#10B981', marginTop: '6px' }}>
                  ✓ Selected: {sendNowFile.name}
                </p>
              )}
              <p style={{ fontSize: '12px', color: '#666666', marginTop: '6px' }}>
                Optional: Attach a PDF file to the email
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSendNowModal(null);
                  setSendNowUrl('');
                  setSendNowFile(null);
                }}
                disabled={sendingNow}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#666666',
                  border: '1px solid #333333',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sendingNow ? 'not-allowed' : 'pointer',
                  opacity: sendingNow ? 0.5 : 1
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleSendNow(showSendNowModal.userId, showSendNowModal.type);
                }}
                disabled={sendingNow}
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sendingNow ? 'not-allowed' : 'pointer',
                  opacity: sendingNow ? 0.7 : 1
                }}
              >
                {sendingNow ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Breakdown Modal */}
      {paymentModal && (
        <div
          onClick={() => {
            setPaymentModal(null);
            setPayments([]);
            setNewPaymentName('');
            setNewPaymentAmount('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 8px 0'
            }}>
              Payment Breakdown
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#666666',
              marginBottom: '24px'
            }}>
              {paymentModal.userName}
            </p>

            {/* Existing Payments List */}
            {loadingPayments ? (
              <div style={{ textAlign: 'center', color: '#666666', padding: '40px' }}>
                Loading payments...
              </div>
            ) : payments.length > 0 ? (
              <div style={{ marginBottom: '24px' }}>
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    style={{
                      backgroundColor: payment.paid ? '#22C55E15' : '#0A0A0A',
                      border: payment.paid ? '1px solid #22C55E30' : '1px solid #333333',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: '4px'
                      }}>
                        {payment.name}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#FFFFFF',
                        fontWeight: '500'
                      }}>
                        ${payment.amount.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={payment.paid}
                        onChange={() => {
                          if (paymentModal) {
                            togglePaymentPaid(payment.id, payment.paid, paymentModal.userId);
                          }
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: '#22C55E'
                        }}
                        title={payment.paid ? 'Mark as unpaid' : 'Mark as paid'}
                      />
                      <button
                        onClick={() => {
                          if (paymentModal && window.confirm('Delete this payment?')) {
                            deletePayment(payment.id, paymentModal.userId);
                          }
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#F87171',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '18px',
                          lineHeight: '1'
                        }}
                        title="Delete payment"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  borderTop: '1px solid #333333',
                  paddingTop: '16px',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                    Total
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                    ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px'
                }}>
                  <div style={{ fontSize: '14px', color: '#22C55E' }}>
                    Paid
                  </div>
                  <div style={{ fontSize: '14px', color: '#22C55E' }}>
                    ${payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px'
                }}>
                  <div style={{ fontSize: '14px', color: '#F87171' }}>
                    Outstanding
                  </div>
                  <div style={{ fontSize: '14px', color: '#F87171' }}>
                    ${payments.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Add New Payment */}
            <div style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFFFFF',
                margin: '0 0 16px 0'
              }}>
                Add Payment
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#999999',
                    marginBottom: '6px'
                  }}>
                    Name / Description
                  </label>
                  <input
                    type="text"
                    value={newPaymentName}
                    onChange={(e) => setNewPaymentName(e.target.value)}
                    placeholder="e.g., Discovery Fee, Invoice Payment"
                    style={{
                      width: '100%',
                      backgroundColor: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#999999',
                    marginBottom: '6px'
                  }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      backgroundColor: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (newPaymentName && newPaymentAmount && paymentModal) {
                      await addPayment(paymentModal.userId, newPaymentName, parseFloat(newPaymentAmount));
                      setNewPaymentName('');
                      setNewPaymentAmount('');
                    }
                  }}
                  disabled={!newPaymentName || !newPaymentAmount}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!newPaymentName || !newPaymentAmount) ? 'not-allowed' : 'pointer',
                    opacity: (!newPaymentName || !newPaymentAmount) ? 0.5 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  Add Payment
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setPaymentModal(null);
                setPayments([]);
                setNewPaymentName('');
                setNewPaymentAmount('');
              }}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#666666',
                border: '1px solid #333333',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
