import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Project {
  id: string;
  name: string;
  created_by: string;
}

interface ChangesSummary {
  reviewTasks: Array<{ title: string; screen_title: string; task_id: string }>;
  reviewToDone: Array<{ title: string; screen_title: string; task_id: string }>;
  reviewToProgress: Array<{ title: string; screen_title: string; task_id: string }>;
  completedTasks: Array<{ title: string; edited_at: string; screen_title?: string }>;
  newScreens: Array<{ title: string; created_at: string }>;
  updatedScreens: Array<{ title: string; description: string; edited_at: string }>;
  newTasks: Array<{ title: string; created_at: string; screen_title?: string }>;
}

function SendUpdatesSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [changes, setChanges] = useState<ChangesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastEmailDate, setLastEmailDate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch projects when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchProjects(selectedUserId);
    } else {
      setProjects([]);
      setSelectedProjectId('');
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('is_admin', false)
      .order('first_name', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, created_by')
      .eq('created_by', userId)
      .order('name', { ascending: true });

    if (!error && data) {
      setProjects(data);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  const handleCheckChanges = async () => {
    if (!selectedProjectId) {
      alert('Please select a user and project first');
      return;
    }

    setLoading(true);

    try {
      // Get last email date for this project
      const { data: lastEmail } = await supabase
        .from('email_history')
        .select('sent_at')
        .eq('project_id', selectedProjectId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      const lastSentDate = lastEmail?.sent_at || null;
      setLastEmailDate(lastSentDate);

      if (!lastSentDate) {
        // First time - show initial message
        setChanges({
          reviewTasks: [],
          reviewToDone: [],
          reviewToProgress: [],
          completedTasks: [],
          newScreens: [],
          updatedScreens: [],
          newTasks: []
        });
      } else {
        // Fetch changes since last email
        await fetchChangesSinceDate(lastSentDate);
      }
    } catch (err) {
      console.error('Error checking changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangesSinceDate = async (sinceDate: string) => {
    console.log('🔍 [EMAIL] Checking for changes since:', sinceDate);
    console.log('🔍 [EMAIL] Project ID:', selectedProjectId);

    // Get last email's task status snapshot
    const { data: lastEmail } = await supabase
      .from('email_history')
      .select('changes_snapshot')
      .eq('project_id', selectedProjectId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    const lastTaskStatuses: Record<string, string> = lastEmail?.changes_snapshot?.taskStatuses || {};
    console.log('📸 [EMAIL] Last email task statuses:', lastTaskStatuses);

    // Get all screens for this project
    const { data: screens } = await supabase
      .from('screens')
      .select('id, title, created_at')
      .eq('project_id', selectedProjectId);

    if (!screens) {
      console.log('⚠️ [EMAIL] No screens found for this project');
      return;
    }

    const screenIds = screens.map(s => s.id);
    console.log('📋 [EMAIL] Found', screens.length, 'screens:', screenIds);

    // Get all tasks with their screen info and current status
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('id, title, screen_id, status')
      .in('screen_id', screenIds);

    const taskIds = allTasks?.map(t => t.id) || [];
    console.log('📋 [EMAIL] Found', taskIds.length, 'total tasks');

    // Get completed tasks (status changed to done)
    const { data: completedTasksData } = await supabase
      .from('task_history')
      .select('task_id, title, edited_at, status')
      .in('task_id', taskIds)
      .eq('status', 'done')
      .gt('edited_at', sinceDate)
      .order('edited_at', { ascending: false });

    // Map completed tasks to their screens
    const completedTasksWithScreens = completedTasksData?.map(task => {
      const taskInfo = allTasks?.find(t => t.id === task.task_id);
      const screen = screens.find(s => s.id === taskInfo?.screen_id);
      return {
        ...task,
        screen_id: taskInfo?.screen_id,
        screen_title: screen?.title || 'Unknown Screen'
      };
    }) || [];

    console.log('✅ [EMAIL] Completed tasks found:', completedTasksWithScreens.length, completedTasksWithScreens);

    // Get new screens (created after last email)
    const newScreens = screens.filter(s => new Date(s.created_at) > new Date(sinceDate));
    console.log('🆕 [EMAIL] New screens found:', newScreens.length, newScreens);

    // Get updated screens
    const { data: updatedScreensData } = await supabase
      .from('screen_history')
      .select('screen_id, title, description, edited_at')
      .in('screen_id', screenIds)
      .gt('edited_at', sinceDate)
      .order('edited_at', { ascending: false });

    console.log('📝 [EMAIL] Updated screens found:', updatedScreensData?.length || 0, updatedScreensData);

    // Get new tasks (created after last email)
    const { data: newTasksData } = await supabase
      .from('tasks')
      .select('id, title, created_at, screen_id')
      .in('screen_id', screenIds)
      .gt('created_at', sinceDate)
      .order('created_at', { ascending: false });

    // Map new tasks to their screens
    const newTasksWithScreens = newTasksData?.map(task => {
      const screen = screens.find(s => s.id === task.screen_id);
      return {
        ...task,
        screen_title: screen?.title || 'Unknown Screen'
      };
    }) || [];

    console.log('🆕 [EMAIL] New tasks found:', newTasksWithScreens.length, newTasksWithScreens);

    // Categorize tasks based on status transitions
    const reviewTasks: Array<{ title: string; screen_title: string; task_id: string }> = [];
    const reviewToDone: Array<{ title: string; screen_title: string; task_id: string }> = [];
    const reviewToProgress: Array<{ title: string; screen_title: string; task_id: string }> = [];
    const newlyCompletedTasks: Array<{ title: string; edited_at: string; screen_title: string }> = [];

    allTasks?.forEach(task => {
      const screen = screens.find(s => s.id === task.screen_id);
      const screenTitle = screen?.title || 'Unknown Screen';
      const lastStatus = lastTaskStatuses[task.id];
      const currentStatus = task.status;

      // Tasks currently in review (including those that stayed in review)
      if (currentStatus === 'review') {
        reviewTasks.push({
          title: task.title,
          screen_title: screenTitle,
          task_id: task.id
        });
      }

      // Tasks that moved from review to done
      if (lastStatus === 'review' && currentStatus === 'done') {
        reviewToDone.push({
          title: task.title,
          screen_title: screenTitle,
          task_id: task.id
        });
      }

      // Tasks that moved from review back to in_progress
      if (lastStatus === 'review' && currentStatus === 'in_progress') {
        reviewToProgress.push({
          title: task.title,
          screen_title: screenTitle,
          task_id: task.id
        });
      }

      // Tasks that are newly completed (not from review)
      if (currentStatus === 'done' && lastStatus !== 'review' && lastStatus !== 'done') {
        const historyItem = completedTasksWithScreens.find((t: any) => t.task_id === task.id);
        if (historyItem) {
          newlyCompletedTasks.push({
            title: task.title,
            edited_at: historyItem.edited_at,
            screen_title: screenTitle
          });
        }
      }
    });

    console.log('📊 [EMAIL] Review tasks:', reviewTasks.length);
    console.log('📊 [EMAIL] Review → Done:', reviewToDone.length);
    console.log('📊 [EMAIL] Review → In Progress:', reviewToProgress.length);
    console.log('📊 [EMAIL] Newly completed:', newlyCompletedTasks.length);

    const changes = {
      reviewTasks,
      reviewToDone,
      reviewToProgress,
      completedTasks: newlyCompletedTasks,
      newScreens: newScreens.map(s => ({ title: s.title, created_at: s.created_at })),
      updatedScreens: updatedScreensData || [],
      newTasks: newTasksWithScreens
    };

    console.log('📊 [EMAIL] Total changes summary:', {
      reviewTasks: changes.reviewTasks.length,
      reviewToDone: changes.reviewToDone.length,
      reviewToProgress: changes.reviewToProgress.length,
      completedTasks: changes.completedTasks.length,
      newScreens: changes.newScreens.length,
      updatedScreens: changes.updatedScreens.length,
      newTasks: changes.newTasks.length
    });

    setChanges(changes);
  };

  const handleSendEmail = async () => {
    if (!selectedUserId || !selectedProjectId || !personalMessage.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSending(true);

    try {
      const projectName = projects.find(p => p.id === selectedProjectId)?.name;
      const userEmail = users.find(u => u.id === selectedUserId)?.email;

      // Send email via Netlify Function
      const response = await fetch('/.netlify/functions/send-update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: 'Project Update',
          personalMessage: personalMessage,
          changes: changes,
          projectName: projectName
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Get current task statuses to snapshot
      const { data: screens } = await supabase
        .from('screens')
        .select('id')
        .eq('project_id', selectedProjectId);

      const screenIds = screens?.map(s => s.id) || [];

      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, status')
        .in('screen_id', screenIds);

      const taskStatuses: Record<string, string> = {};
      allTasks?.forEach(task => {
        taskStatuses[task.id] = task.status;
      });

      // Save to email_history after successful send
      const { error } = await supabase
        .from('email_history')
        .insert({
          user_id: selectedUserId,
          project_id: selectedProjectId,
          sent_by: (await supabase.auth.getUser()).data.user?.id,
          personal_message: personalMessage,
          changes_snapshot: {
            ...changes,
            taskStatuses // Store current task statuses for next email comparison
          },
          email_subject: 'Project Update',
          email_sent_successfully: true
        });

      if (error) throw error;

      // Reset form
      setPersonalMessage('');
      setChanges(null);
      setShowPreview(false);
      setLastEmailDate(null);

    } catch (err: any) {
      console.error('Error sending email:', err);
      alert('Failed to send email: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const formatChangesForDisplay = () => {
    if (!changes) return null;

    const hasChanges =
      changes.reviewTasks.length > 0 ||
      changes.reviewToDone.length > 0 ||
      changes.reviewToProgress.length > 0 ||
      changes.completedTasks.length > 0 ||
      changes.newScreens.length > 0 ||
      changes.updatedScreens.length > 0 ||
      changes.newTasks.length > 0;

    if (!lastEmailDate) {
      return (
        <div style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '16px',
          color: '#999999',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Project was set up successfully, emails with updates will be sent as changes are made
        </div>
      );
    }

    if (!hasChanges) {
      return (
        <div style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '16px',
          color: '#999999',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          No changes since last email on {new Date(lastEmailDate).toLocaleDateString()}
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#0A0A0A',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#FFFFFF',
          marginBottom: '16px'
        }}>
          Changes Since Last Email ({new Date(lastEmailDate).toLocaleDateString()})
        </div>

        {changes.reviewTasks.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F59E0B', marginBottom: '8px' }}>
              ITEMS FOR YOUR REVIEW ({changes.reviewTasks.length})
            </div>
            {(() => {
              const tasksByScreen: { [key: string]: any[] } = {};
              changes.reviewTasks.forEach((task: any) => {
                const screenTitle = task.screen_title || 'Unknown Screen';
                if (!tasksByScreen[screenTitle]) {
                  tasksByScreen[screenTitle] = [];
                }
                tasksByScreen[screenTitle].push(task);
              });

              return Object.keys(tasksByScreen).map((screenTitle, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px', paddingLeft: '8px' }}>
                    {screenTitle}
                  </div>
                  {tasksByScreen[screenTitle].map((task: any, taskIdx: number) => (
                    <div key={taskIdx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3C4 3 2 7 2 7s2 4 5 4 5-4 5-4-2-4-5-4z"/>
                        <circle cx="7" cy="7" r="1.5"/>
                      </svg>
                      {task.title}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {changes.reviewToDone.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ADE80', marginBottom: '8px' }}>
              APPROVED & COMPLETE ({changes.reviewToDone.length})
            </div>
            {(() => {
              const tasksByScreen: { [key: string]: any[] } = {};
              changes.reviewToDone.forEach((task: any) => {
                const screenTitle = task.screen_title || 'Unknown Screen';
                if (!tasksByScreen[screenTitle]) {
                  tasksByScreen[screenTitle] = [];
                }
                tasksByScreen[screenTitle].push(task);
              });

              return Object.keys(tasksByScreen).map((screenTitle, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px', paddingLeft: '8px' }}>
                    {screenTitle}
                  </div>
                  {tasksByScreen[screenTitle].map((task: any, taskIdx: number) => (
                    <div key={taskIdx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 7 6 10 11 4"/>
                      </svg>
                      {task.title}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {changes.reviewToProgress.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6', marginBottom: '8px' }}>
              BACK IN DEVELOPMENT ({changes.reviewToProgress.length})
            </div>
            {(() => {
              const tasksByScreen: { [key: string]: any[] } = {};
              changes.reviewToProgress.forEach((task: any) => {
                const screenTitle = task.screen_title || 'Unknown Screen';
                if (!tasksByScreen[screenTitle]) {
                  tasksByScreen[screenTitle] = [];
                }
                tasksByScreen[screenTitle].push(task);
              });

              return Object.keys(tasksByScreen).map((screenTitle, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px', paddingLeft: '8px' }}>
                    {screenTitle}
                  </div>
                  {tasksByScreen[screenTitle].map((task: any, taskIdx: number) => (
                    <div key={taskIdx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4l-8 8M4 4l8 8"/>
                        <circle cx="7" cy="7" r="5"/>
                      </svg>
                      {task.title}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {changes.completedTasks.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#22C55E', marginBottom: '8px' }}>
              NEWLY COMPLETED TASKS ({changes.completedTasks.length})
            </div>
            {(() => {
              const tasksByScreen: { [key: string]: any[] } = {};
              changes.completedTasks.forEach((task: any) => {
                const screenTitle = task.screen_title || 'Unknown Screen';
                if (!tasksByScreen[screenTitle]) {
                  tasksByScreen[screenTitle] = [];
                }
                tasksByScreen[screenTitle].push(task);
              });

              return Object.keys(tasksByScreen).map((screenTitle, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px', paddingLeft: '8px' }}>
                    {screenTitle}
                  </div>
                  {tasksByScreen[screenTitle].map((task: any, taskIdx: number) => (
                    <div key={taskIdx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '24px' }}>
                      ✓ {task.title}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {changes.newScreens.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6', marginBottom: '8px' }}>
              NEW SCREENS ({changes.newScreens.length})
            </div>
            {changes.newScreens.map((screen, idx) => (
              <div key={idx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '8px' }}>
                + {screen.title}
              </div>
            ))}
          </div>
        )}

        {changes.updatedScreens.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#EAB308', marginBottom: '8px' }}>
              SCREENS UPDATED ({changes.updatedScreens.length})
            </div>
            {changes.updatedScreens.map((screen, idx) => (
              <div key={idx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '8px' }}>
                • {screen.title}
                {screen.description && (
                  <span style={{ color: '#666666' }}> - {screen.description}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {changes.newTasks.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#999999', marginBottom: '8px' }}>
              NEW TASKS ({changes.newTasks.length})
            </div>
            {(() => {
              const tasksByScreen: { [key: string]: any[] } = {};
              changes.newTasks.forEach((task: any) => {
                const screenTitle = task.screen_title || 'Unknown Screen';
                if (!tasksByScreen[screenTitle]) {
                  tasksByScreen[screenTitle] = [];
                }
                tasksByScreen[screenTitle].push(task);
              });

              return Object.keys(tasksByScreen).map((screenTitle, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px', paddingLeft: '8px' }}>
                    {screenTitle}
                  </div>
                  {tasksByScreen[screenTitle].map((task: any, taskIdx: number) => (
                    <div key={taskIdx} style={{ fontSize: '13px', color: '#CCCCCC', marginBottom: '4px', paddingLeft: '24px' }}>
                      • {task.title}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    );
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#FFFFFF'
      }}>
        Send Updates
      </h2>

      {/* User Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '500',
          color: '#999999',
          marginBottom: '6px'
        }}>
          Select User
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#0A0A0A',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
            color: '#FFFFFF',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">Select a user...</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {getUserDisplayName(user)}
            </option>
          ))}
        </select>
      </div>

      {/* Project Selection */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '500',
          color: '#999999',
          marginBottom: '6px'
        }}>
          Select Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          disabled={!selectedUserId}
          style={{
            width: '100%',
            backgroundColor: '#0A0A0A',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
            color: '#FFFFFF',
            outline: 'none',
            cursor: selectedUserId ? 'pointer' : 'not-allowed',
            opacity: selectedUserId ? 1 : 0.5
          }}
        >
          <option value="">Select a project...</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Personal Message */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '500',
          color: '#999999',
          marginBottom: '6px'
        }}>
          Personal Message
        </label>
        <textarea
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          placeholder="Type your message to the client..."
          rows={6}
          style={{
            width: '100%',
            backgroundColor: '#0A0A0A',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            color: '#FFFFFF',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={handleCheckChanges}
          disabled={!selectedProjectId || loading}
          style={{
            backgroundColor: 'transparent',
            color: selectedProjectId ? '#FFFFFF' : '#666666',
            border: '1px solid #333333',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: selectedProjectId && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Checking...' : 'Check Changes'}
        </button>

        {changes && (
          <button
            onClick={() => setShowPreview(true)}
            disabled={!personalMessage.trim()}
            style={{
              backgroundColor: personalMessage.trim() ? '#FFFFFF' : 'transparent',
              color: personalMessage.trim() ? '#000000' : '#666666',
              border: '1px solid #333333',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: personalMessage.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            Preview Email
          </button>
        )}
      </div>

      {/* Changes Display */}
      {changes && formatChangesForDisplay()}

      {/* Preview Modal */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 20px 0'
            }}>
              Email Preview
            </h3>

            <div style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: '#666666', marginBottom: '4px' }}>
                To: {selectedUser?.email}
              </div>
              <div style={{ fontSize: '13px', color: '#666666', marginBottom: '16px' }}>
                Subject: Project Update - {selectedProject?.name}
              </div>

              <div style={{ fontSize: '14px', color: '#FFFFFF', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {personalMessage}
              </div>

              {lastEmailDate && (
                <>
                  <div style={{ margin: '20px 0', borderTop: '1px solid #333333' }} />
                  {formatChangesForDisplay()}
                </>
              )}

              <div style={{ marginTop: '20px', fontSize: '13px', color: '#666666' }}>
                Best regards,
                <br />
                AppCatalyst Team
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  flex: 1,
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
                Back
              </button>

              <button
                onClick={handleSendEmail}
                disabled={sending}
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.7 : 1
                }}
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SendUpdatesSection;
