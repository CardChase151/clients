import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

interface ParsedProject {
  name: string;
  tagline: string | null;
  description: string;
  screens: {
    title: string;
    description: string | null;
    tasks: {
      title: string;
      description: string | null;
    }[];
  }[];
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface Project {
  id: string;
  name: string;
  tagline: string | null;
}

function UploadProjectSection() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ParsedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // New state for user and project selection
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch approved users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('approved', true)
          .order('email');

        if (!error && data) {
          setUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch projects when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setProjects([]);
      setSelectedProjectId('new');
      return;
    }

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, tagline')
          .eq('created_by', selectedUserId)
          .order('name');

        if (!error && data) {
          setProjects(data);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [selectedUserId]);

  const parseMarkdown = (text: string): ParsedProject | null => {
    try {
      const lines = text.split('\n');
      let name = '';
      let tagline: string | null = null;
      let description = '';
      const screens: ParsedProject['screens'] = [];
      let currentScreen: ParsedProject['screens'][0] | null = null;
      let inDescription = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // H1 = Project name
        if (line.startsWith('# ')) {
          name = line.replace('# ', '');
          inDescription = true;
          continue;
        }

        // Blockquote = Tagline
        if (line.startsWith('> ')) {
          tagline = line.replace('> ', '');
          continue;
        }

        // H2 = Screen/Component
        if (line.startsWith('## ')) {
          if (currentScreen) {
            screens.push(currentScreen);
          }
          currentScreen = {
            title: line.replace('## ', ''),
            description: null,
            tasks: []
          };
          inDescription = false;
          continue;
        }

        // Checkbox = Task
        if (line.match(/^-\s*\[[ x]\]\s*/)) {
          const taskText = line.replace(/^-\s*\[[ x]\]\s*/, '');
          if (currentScreen) {
            currentScreen.tasks.push({
              title: taskText,
              description: null
            });
          }
          continue;
        }

        // Regular text
        if (line && !line.startsWith('#')) {
          if (inDescription && !currentScreen) {
            description += (description ? ' ' : '') + line;
          } else if (currentScreen && !currentScreen.description) {
            currentScreen.description = line;
          }
        }
      }

      if (currentScreen) {
        screens.push(currentScreen);
      }

      if (!name) {
        return null;
      }

      return {
        name,
        tagline,
        description: description || 'No description provided',
        screens
      };
    } catch (err) {
      console.error('Parse error:', err);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.md')) {
      setError('Please upload a markdown (.md) file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseMarkdown(text);

      if (parsed) {
        setPreview(parsed);
      } else {
        setError('Failed to parse markdown file. Please check the format.');
      }
      setParsing(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!preview || !selectedUserId || !user) return;

    setUploading(true);
    setError(null);

    try {
      let projectId: string;

      // Check if creating new or updating existing
      if (selectedProjectId === 'new') {
        // Create new project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert([
            {
              name: preview.name,
              tagline: preview.tagline,
              description: preview.description,
              created_by: selectedUserId
            }
          ])
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = projectData.id;

        // Create all screens and tasks (created by admin who uploaded)
        for (const screen of preview.screens) {
          const { data: screenData, error: screenError } = await supabase
            .from('screens')
            .insert([
              {
                project_id: projectId,
                title: screen.title,
                description: screen.description,
                created_by: user.id
              }
            ])
            .select()
            .single();

          if (screenError) throw screenError;

          // Create tasks for this screen
          if (screen.tasks.length > 0) {
            const tasksToInsert = screen.tasks.map(task => ({
              screen_id: screenData.id,
              title: task.title,
              description: task.description,
              status: 'not_started',
              created_by: user.id
            }));

            const { error: tasksError } = await supabase
              .from('tasks')
              .insert(tasksToInsert);

            if (tasksError) throw tasksError;
          }
        }

        alert('Project created successfully!');
      } else {
        // Update existing project
        projectId = selectedProjectId;

        // Update project details (optional - can be toggled)
        await supabase
          .from('projects')
          .update({
            tagline: preview.tagline,
            description: preview.description
          })
          .eq('id', projectId);

        // Fetch existing screens with tasks
        const { data: existingScreens, error: fetchError } = await supabase
          .from('screens')
          .select('id, title, tasks(id, title)')
          .eq('project_id', projectId);

        if (fetchError) throw fetchError;

        // Create a map of existing screens
        const existingScreensMap = new Map(
          (existingScreens || []).map(s => [s.title.toLowerCase().trim(), s])
        );

        let screensAdded = 0;
        let tasksAdded = 0;

        // Process each screen from markdown
        for (const screen of preview.screens) {
          const existingScreen = existingScreensMap.get(screen.title.toLowerCase().trim());

          if (!existingScreen) {
            // Screen doesn't exist, create it with all tasks (created by admin who uploaded)
            const { data: screenData, error: screenError } = await supabase
              .from('screens')
              .insert([
                {
                  project_id: projectId,
                  title: screen.title,
                  description: screen.description,
                  created_by: user.id
                }
              ])
              .select()
              .single();

            if (screenError) throw screenError;
            screensAdded++;

            // Create all tasks for this new screen
            if (screen.tasks.length > 0) {
              const tasksToInsert = screen.tasks.map(task => ({
                screen_id: screenData.id,
                title: task.title,
                description: task.description,
                status: 'not_started',
                created_by: user.id
              }));

              const { error: tasksError } = await supabase
                .from('tasks')
                .insert(tasksToInsert);

              if (tasksError) throw tasksError;
              tasksAdded += screen.tasks.length;
            }
          } else {
            // Screen exists, check for new tasks
            const existingTaskTitles = new Set(
              (existingScreen.tasks || []).map((t: any) => t.title.toLowerCase().trim())
            );

            const newTasks = screen.tasks.filter(
              task => !existingTaskTitles.has(task.title.toLowerCase().trim())
            );

            if (newTasks.length > 0) {
              const tasksToInsert = newTasks.map(task => ({
                screen_id: existingScreen.id,
                title: task.title,
                description: task.description,
                status: 'not_started',
                created_by: user.id
              }));

              const { error: tasksError } = await supabase
                .from('tasks')
                .insert(tasksToInsert);

              if (tasksError) throw tasksError;
              tasksAdded += newTasks.length;
            }
          }
        }

        alert(`Project updated! Added ${screensAdded} new screen(s) and ${tasksAdded} new task(s).`);
      }

      // Success! Reset state
      setPreview(null);
      setFile(null);
      setSelectedProjectId('new');
    } catch (err: any) {
      setError(err.message || 'Failed to upload project');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '16px',
        color: '#FFFFFF'
      }}>
        Upload Project from Markdown
      </h2>

      <p style={{
        fontSize: '14px',
        color: '#999999',
        marginBottom: '24px',
        lineHeight: '1.6'
      }}>
        Upload a markdown file to automatically create a project with screens and tasks.
      </p>

      {/* User Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#FFFFFF',
          marginBottom: '8px'
        }}>
          1. Select User
        </label>
        {loadingUsers ? (
          <div style={{ color: '#666666', fontSize: '14px' }}>Loading users...</div>
        ) : (
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value || null)}
            style={{
              width: '100%',
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '12px',
              color: '#FFFFFF',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Select a user --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email} ({u.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Project Selection */}
      {selectedUserId && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            2. Select Project
          </label>
          {loadingProjects ? (
            <div style={{ color: '#666666', fontSize: '14px' }}>Loading projects...</div>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#1A1A1A',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '12px',
                color: '#FFFFFF',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="new">➕ Create New Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.tagline ? `- ${p.tagline}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* File upload */}
      {selectedUserId && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            3. Upload Markdown File
          </label>
          <div style={{
            backgroundColor: '#1A1A1A',
            border: '2px dashed #333333',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            transition: 'border-color 0.2s'
          }}>
            <input
              type="file"
              accept=".md"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="md-upload"
            />
            <label
              htmlFor="md-upload"
              style={{
                cursor: 'pointer',
                display: 'inline-block'
              }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <path d="M24 16v16m-8-8l8-8 8 8M8 32v8h32v-8"/>
              </svg>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#FFFFFF',
                marginBottom: '8px'
              }}>
                {file ? file.name : 'Click to upload markdown file'}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#666666'
              }}>
                Supports .md files only
              </div>
            </label>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #FF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          color: '#FF4444',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {parsing && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666666'
        }}>
          Parsing markdown...
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#FFFFFF'
          }}>
            Preview
          </h3>

          {/* Project info */}
          <div style={{
            backgroundColor: '#000000',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
              {preview.name}
            </div>
            {preview.tagline && (
              <div style={{ fontSize: '13px', color: '#999999', marginBottom: '8px' }}>
                {preview.tagline}
              </div>
            )}
            <div style={{ fontSize: '14px', color: '#CCCCCC' }}>
              {preview.description}
            </div>
          </div>

          {/* Screens */}
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#FFFFFF' }}>
            Screens ({preview.screens.length})
          </div>
          {preview.screens.map((screen, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#000000',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                {screen.title}
              </div>
              {screen.description && (
                <div style={{ fontSize: '13px', color: '#999999', marginBottom: '8px' }}>
                  {screen.description}
                </div>
              )}
              {screen.tasks.length > 0 && (
                <div style={{ fontSize: '12px', color: '#666666' }}>
                  {screen.tasks.length} task{screen.tasks.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedUserId}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#000000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (uploading || !selectedUserId) ? 'not-allowed' : 'pointer',
              width: '100%',
              marginTop: '16px',
              transition: 'opacity 0.2s',
              opacity: (uploading || !selectedUserId) ? 0.5 : 1
            }}
            onMouseEnter={(e) => !(uploading || !selectedUserId) && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = (uploading || !selectedUserId) ? '0.5' : '1')}
          >
            {uploading
              ? (selectedProjectId === 'new' ? 'Creating Project...' : 'Updating Project...')
              : (selectedProjectId === 'new' ? 'Create Project' : 'Update Project')}
          </button>
        </div>
      )}

      {/* Format guide */}
      <div style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid #333333',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '24px'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#FFFFFF'
        }}>
          Markdown Format Guide
        </h4>
        <pre style={{
          fontSize: '12px',
          color: '#CCCCCC',
          lineHeight: '1.6',
          margin: 0,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
{`# Project Name
> Optional tagline

Project description goes here...

## Screen Name
Screen description

- [ ] Task 1
- [ ] Task 2

## Another Screen
Description here

- [ ] Task 1`}
        </pre>
      </div>
    </div>
  );
}

export default UploadProjectSection;
