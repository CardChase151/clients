import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  email: string;
}

interface UserDropdownProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
  refreshTrigger?: number;
}

function UserDropdown({ selectedUserId, onUserSelect, refreshTrigger }: UserDropdownProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .order('email', { ascending: true });

    if (!error && data) {
      // Filter out current user (admin)
      const filteredUsers = data.filter(u => u.id !== user?.id);
      setUsers(filteredUsers);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'border-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333333'}
      >
        <span>{selectedUser ? selectedUser.email : 'Select a user'}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 4 6 8 10 4"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '8px',
          overflow: 'hidden',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => {
                onUserSelect(user.id);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: user.id === selectedUserId ? '#2A2A2A' : 'transparent',
                color: '#FFFFFF',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2A2A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = user.id === selectedUserId ? '#2A2A2A' : 'transparent'}
            >
              {user.email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDropdown;
