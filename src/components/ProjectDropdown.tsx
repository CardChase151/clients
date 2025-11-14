import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface Project {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  created_at: string;
  created_by: string;
  creator?: {
    email: string;
  };
}

interface ProjectDropdownProps {
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onAddProject: () => void;
  refreshTrigger?: number;
  userId?: string | null;
}

function ProjectDropdown({ selectedProjectId, onProjectSelect, onAddProject, refreshTrigger, userId }: ProjectDropdownProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProjects();
    } else {
      setProjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, userId]);

  const fetchProjects = async () => {
    if (!userId) {
      console.log('ProjectDropdown: No userId provided');
      return;
    }

    console.log('ProjectDropdown: Fetching projects for userId:', userId);

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:users!created_by(email)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('ProjectDropdown: Error fetching projects:', error);
      console.error('ProjectDropdown: Error details:', JSON.stringify(error, null, 2));
    }

    if (data) {
      console.log('ProjectDropdown: Fetched projects:', data);
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        onProjectSelect(data[0].id);
      }
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
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
        <span>{selectedProject ? selectedProject.name : 'Select a project'}</span>
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
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => {
                onProjectSelect(project.id);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: project.id === selectedProjectId ? '#2A2A2A' : 'transparent',
                color: '#FFFFFF',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2A2A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = project.id === selectedProjectId ? '#2A2A2A' : 'transparent'}
            >
              <div style={{ fontWeight: '500' }}>{project.name}</div>
              {project.tagline && (
                <div style={{ fontSize: '12px', color: '#999999', marginTop: '4px' }}>
                  {project.tagline}
                </div>
              )}
              {project.creator && (
                <div style={{ fontSize: '11px', color: '#666666', marginTop: '4px' }}>
                  by {project.creator.email}
                </div>
              )}
            </div>
          ))}

          <div
            onClick={() => {
              onAddProject();
              setIsOpen(false);
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600',
              borderTop: '1px solid #333333',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2A2A'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="4" x2="8" y2="12"/>
              <line x1="4" y1="8" x2="12" y2="8"/>
            </svg>
            Add New Project
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDropdown;
