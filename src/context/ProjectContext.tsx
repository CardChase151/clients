import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';

interface ProjectContextType {
  selectedUserId: string | null;
  selectedProjectId: string | null;
  setSelectedUserId: (userId: string | null) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  isAdmin: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize user selection based on admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setSelectedUserId(null);
        setSelectedProjectId(null);
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      const adminStatus = data?.is_admin || false;
      setIsAdmin(adminStatus);

      // If not admin, always use current user
      if (!adminStatus) {
        setSelectedUserId(user.id);
      } else {
        // If admin and no user selected, default to self
        if (!selectedUserId) {
          setSelectedUserId(user.id);
        }
      }
    };

    checkAdminStatus();
  }, [user, selectedUserId]);

  // When selected user changes, reset project selection
  const handleSetSelectedUserId = (userId: string | null) => {
    setSelectedUserId(userId);
    setSelectedProjectId(null); // Reset project when user changes
  };

  return (
    <ProjectContext.Provider
      value={{
        selectedUserId,
        selectedProjectId,
        setSelectedUserId: handleSetSelectedUserId,
        setSelectedProjectId,
        isAdmin,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
