import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { supabase } from '../config/supabase';
import BottomBar from '../menu/bottombar';
import UserDropdown from '../components/UserDropdown';
import ProjectDropdown from '../components/ProjectDropdown';

interface Project {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
}

interface Screen {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  created_at: string;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  project?: {
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  screen_id: string;
  status: 'not_started' | 'in_progress' | 'waiting' | 'done';
  created_at: string;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  screen?: {
    title: string;
    project_id: string;
    project?: {
      name: string;
    };
  };
}

type SearchResult = {
  id: string;
  type: 'project' | 'screen' | 'task';
  title: string;
  description: string | null;
  score: number;
  metadata: {
    projectId?: string;
    projectName?: string;
    screenId?: string;
    screenName?: string;
    taskStatus?: string;
    creatorName?: string;
    creatorEmail?: string;
    createdAt?: string;
  };
};

function Search() {
  const navigate = useNavigate();
  const { selectedUserId, selectedProjectId, setSelectedProjectId, isAdmin } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!selectedUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('created_by', selectedUserId);

        setProjects(projectsData || []);

        // Get all project IDs
        const projectIds = (projectsData || []).map(p => p.id);

        if (projectIds.length > 0) {
          // Fetch screens for these projects
          const { data: screensData } = await supabase
            .from('screens')
            .select(`
              *,
              creator:users!screens_created_by_fkey(first_name, last_name, email),
              project:projects(name)
            `)
            .in('project_id', projectIds);

          setScreens(screensData || []);

          // Get all screen IDs
          const screenIds = (screensData || []).map(s => s.id);

          if (screenIds.length > 0) {
            // Fetch tasks for these screens
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select(`
                *,
                creator:users!tasks_created_by_fkey(first_name, last_name, email),
                screen:screens(
                  title,
                  project_id,
                  project:projects(name)
                )
              `)
              .in('screen_id', screenIds);

            if (tasksError) {
              console.error('Error fetching tasks:', tasksError);
            }

            setTasks(tasksData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching search data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedUserId) {
      fetchAllData();
    }
  }, [selectedUserId]);

  // Fuzzy search with scoring
  const calculateScore = (text: string, query: string): number => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Exact match - highest score
    if (lowerText === lowerQuery) return 100;

    // Starts with query - high score
    if (lowerText.startsWith(lowerQuery)) return 80;

    // Contains query - medium score
    if (lowerText.includes(lowerQuery)) return 60;

    // Fuzzy match - character by character
    let score = 0;
    let queryIndex = 0;
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        score += 1;
        queryIndex++;
      }
    }

    if (queryIndex === lowerQuery.length) {
      return (score / lowerQuery.length) * 40;
    }

    return 0;
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    const query = searchQuery.trim();

    // Filter data by selected project if one is selected
    const filteredProjects = selectedProjectId
      ? projects.filter(p => p.id === selectedProjectId)
      : projects;

    const filteredScreens = selectedProjectId
      ? screens.filter(s => s.project_id === selectedProjectId)
      : screens;

    const filteredTasks = selectedProjectId
      ? tasks.filter(t => t.screen?.project_id === selectedProjectId)
      : tasks;

    // Search projects
    filteredProjects.forEach(project => {
      const titleScore = calculateScore(project.name, query);
      const descScore = project.description ? calculateScore(project.description, query) : 0;
      const maxScore = Math.max(titleScore, descScore);

      if (maxScore > 0) {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          description: project.description,
          score: maxScore,
          metadata: {
            projectId: project.id,
            projectName: project.name
          }
        });
      }
    });

    // Search screens
    filteredScreens.forEach(screen => {
      const titleScore = calculateScore(screen.title, query);
      const descScore = screen.description ? calculateScore(screen.description, query) : 0;
      const maxScore = Math.max(titleScore, descScore);

      if (maxScore > 0) {
        const creatorName = screen.creator?.first_name && screen.creator?.last_name
          ? `${screen.creator.first_name} ${screen.creator.last_name}`
          : undefined;

        results.push({
          id: screen.id,
          type: 'screen',
          title: screen.title,
          description: screen.description,
          score: maxScore,
          metadata: {
            projectId: screen.project_id,
            projectName: screen.project?.name,
            screenId: screen.id,
            screenName: screen.title,
            creatorName: creatorName,
            creatorEmail: screen.creator?.email,
            createdAt: screen.created_at
          }
        });
      }
    });

    // Search tasks
    filteredTasks.forEach(task => {
      const titleScore = calculateScore(task.title, query);
      const descScore = task.description ? calculateScore(task.description, query) : 0;
      const maxScore = Math.max(titleScore, descScore);

      if (maxScore > 0) {
        const creatorName = task.creator?.first_name && task.creator?.last_name
          ? `${task.creator.first_name} ${task.creator.last_name}`
          : undefined;

        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          score: maxScore,
          metadata: {
            projectId: task.screen?.project_id,
            projectName: task.screen?.project?.name,
            screenId: task.screen_id,
            screenName: task.screen?.title,
            taskStatus: task.status,
            creatorName: creatorName,
            creatorEmail: task.creator?.email,
            createdAt: task.created_at
          }
        });
      }
    });

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, projects, screens, tasks, selectedProjectId]);

  const handleResultClick = (result: SearchResult) => {
    // Navigate to home with state to open the correct view
    navigate('/', {
      state: {
        openProject: result.metadata.projectId,
        openScreen: result.metadata.screenId,
        openTask: result.type === 'task' ? result.id : undefined
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#22C55E';
      case 'in_progress': return '#3B82F6';
      case 'waiting': return '#F59E0B';
      default: return '#666666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Done';
      case 'in_progress': return 'In Progress';
      case 'waiting': return 'Waiting';
      default: return 'Not Started';
    }
  };

  // Highlight matching text in search results
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const beforeMatch = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const afterMatch = text.slice(index + query.length);

    return (
      <>
        {beforeMatch}
        <span style={{
          backgroundColor: '#EAB308',
          color: '#000000',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: '600'
        }}>
          {match}
        </span>
        {highlightText(afterMatch, query)}
      </>
    );
  };

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      color: '#FFFFFF',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '100px'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="search-header mobile-safe-header" style={{
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
        <div className="search-header-title" style={{
          fontSize: '20px',
          fontWeight: '600',
          letterSpacing: '-0.02em'
        }}>
          Search
        </div>

        <button
          onClick={() => navigate('/')}
          className="search-back-btn"
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
          Back to Home
        </button>
      </header>

      {/* User & Project Selector */}
      <div className="selector-container mobile-safe-tabs" style={{
        padding: '20px',
        borderBottom: '1px solid #333333',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {isAdmin && (
          <UserDropdown
            selectedUserId={selectedUserId}
            onUserSelect={(userId) => {
              // Context handles this through setSelectedUserId, but we don't have direct access
              // The UserDropdown should trigger context updates
            }}
          />
        )}
        <ProjectDropdown
          selectedProjectId={selectedProjectId}
          onProjectSelect={(projectId) => {
            console.log('Search: Project selected:', projectId);
            setSelectedProjectId(projectId);
          }}
          onAddProject={() => {
            // Could open add project modal if needed
          }}
        />
      </div>

      {/* Search Input */}
      <div className="search-container" style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div className="search-input-wrapper" style={{
          position: 'relative',
          marginBottom: '30px'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, screens, tasks..."
            autoFocus
            className="search-input"
            style={{
              width: '100%',
              backgroundColor: '#1A1A1A',
              border: '1px solid #333333',
              borderRadius: '12px',
              padding: '16px 50px 16px 20px',
              color: '#FFFFFF',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#666666'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#333333'}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          >
            <circle cx="9" cy="9" r="6" stroke="#666666" strokeWidth="2"/>
            <path d="M17 17L13.5 13.5" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666666',
            fontSize: '14px'
          }}>
            Loading search data...
          </div>
        )}

        {/* Empty State - No Query */}
        {!loading && !searchQuery.trim() && (
          <div className="search-empty-state" style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <svg className="search-empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <h3 className="search-empty-title" style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 12px 0'
            }}>
              Search your projects
            </h3>
            <p className="search-empty-description" style={{
              fontSize: '14px',
              color: '#666666',
              lineHeight: '1.6',
              margin: 0
            }}>
              Find projects, screens, and tasks by typing in the search box above
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {!loading && searchQuery.trim() && searchResults.length === 0 && (
          <div className="search-empty-state" style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <svg className="search-empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11" stroke="#666666"/>
            </svg>
            <h3 className="search-empty-title" style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: '0 0 12px 0'
            }}>
              No results found
            </h3>
            <p className="search-empty-description" style={{
              fontSize: '14px',
              color: '#666666',
              lineHeight: '1.6',
              margin: 0
            }}>
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Search Results */}
        {!loading && searchResults.length > 0 && (
          <div>
            <div style={{
              fontSize: '13px',
              color: '#666666',
              marginBottom: '16px',
              fontWeight: '500'
            }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </div>

            <div className="search-results-container" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="search-result-card"
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #333333',
                    borderRadius: '10px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333333';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                >
                  {/* Type Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: result.type === 'project' ? '#8B5CF615' : result.type === 'screen' ? '#06B6D415' : '#22C55E15',
                    border: `1px solid ${result.type === 'project' ? '#8B5CF630' : result.type === 'screen' ? '#06B6D430' : '#22C55E30'}`,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: result.type === 'project' ? '#8B5CF6' : result.type === 'screen' ? '#06B6D4' : '#22C55E',
                    marginBottom: '12px'
                  }}>
                    {result.type === 'project' && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="10" height="10" rx="2"/>
                        <line x1="1" y1="4" x2="11" y2="4"/>
                      </svg>
                    )}
                    {result.type === 'screen' && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1.5" y="2" width="9" height="8" rx="1"/>
                        <line x1="1.5" y1="4.5" x2="10.5" y2="4.5"/>
                      </svg>
                    )}
                    {result.type === 'task' && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 6l2.5 2.5L10 3"/>
                      </svg>
                    )}
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </div>

                  {/* Title */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: '8px'
                  }}>
                    {highlightText(result.title, searchQuery)}
                  </div>

                  {/* Description */}
                  {result.description && (
                    <div style={{
                      fontSize: '13px',
                      color: '#999999',
                      lineHeight: '1.5',
                      marginBottom: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {highlightText(result.description, searchQuery)}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="search-result-metadata" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    fontSize: '12px',
                    color: '#666666'
                  }}>
                    {/* Breadcrumb */}
                    {result.type !== 'project' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {result.metadata.projectName}
                        {result.type === 'task' && (
                          <>
                            <span>›</span>
                            {result.metadata.screenName}
                          </>
                        )}
                      </div>
                    )}

                    {/* Task Status */}
                    {result.type === 'task' && result.metadata.taskStatus && (
                      <>
                        <span>•</span>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: getStatusColor(result.metadata.taskStatus),
                          fontWeight: '600'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(result.metadata.taskStatus)
                          }} />
                          {getStatusLabel(result.metadata.taskStatus)}
                        </div>
                      </>
                    )}

                    {/* Creator */}
                    {result.metadata.creatorEmail && (
                      <>
                        <span>•</span>
                        <span>by {result.metadata.creatorName || result.metadata.creatorEmail}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomBar activeTab="search" />

      <style>{`
        input::placeholder {
          color: #666666;
        }
      `}</style>
    </div>
  );
}

export default Search;