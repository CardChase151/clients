import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReportData {
  platform?: {
    userAgent: string;
  };
  localStorage?: {
    totalKeys: number;
    keys: string[];
    data: Record<string, string>;
  } | { note: string } | { error: string };
  sessionStorage?: {
    totalKeys: number;
    keys: string[];
    data: Record<string, string>;
  } | { note: string } | { error: string };
  indexedDB?: {
    count: number;
    databases: Array<{ name: string; version: number }>;
  } | { note: string } | { error: string };
  cacheStorage?: {
    count: number;
    caches: string[];
  } | { note: string } | { error: string };
  serviceWorkers?: {
    count: number;
    workers: Array<{ scope: string; state: string; updateViaCache: string }>;
  } | { note: string } | { error: string };
  cookies?: {
    count: number;
    names: string[];
  } | { note: string };
  error?: string;
}

function PublicAppDataDebug() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleLoadData = async () => {
    console.log('🔍 [PublicAppDataDebug] Starting data load...');
    setIsLoading(true);
    const report: ReportData = {};

    try {
      // Platform info
      console.log('🔍 [PublicAppDataDebug] Gathering platform info...');
      report.platform = {
        userAgent: navigator.userAgent
      };
      console.log('✅ [PublicAppDataDebug] Platform info:', report.platform);

      // localStorage (web/PWA)
      console.log('🔍 [PublicAppDataDebug] Checking localStorage...');
      if (typeof localStorage !== 'undefined') {
        try {
          const localStorageData: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const value = localStorage.getItem(key);
              // Truncate long values
              localStorageData[key] = value && value.length > 100 ? value.substring(0, 100) + '...' : value || '';
            }
          }

          report.localStorage = {
            totalKeys: localStorage.length,
            keys: Object.keys(localStorageData),
            data: localStorageData
          };
          console.log('✅ [PublicAppDataDebug] localStorage:', report.localStorage);
        } catch (err: any) {
          console.error('❌ [PublicAppDataDebug] Error getting localStorage:', err);
          report.localStorage = { error: err.message };
        }
      } else {
        report.localStorage = { note: 'Not available' };
        console.log('ℹ️ [PublicAppDataDebug] localStorage not available');
      }

      // sessionStorage
      console.log('🔍 [PublicAppDataDebug] Checking sessionStorage...');
      if (typeof sessionStorage !== 'undefined') {
        try {
          const sessionStorageData: Record<string, string> = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
              const value = sessionStorage.getItem(key);
              // Truncate long values
              sessionStorageData[key] = value && value.length > 100 ? value.substring(0, 100) + '...' : value || '';
            }
          }

          report.sessionStorage = {
            totalKeys: sessionStorage.length,
            keys: Object.keys(sessionStorageData),
            data: sessionStorageData
          };
          console.log('✅ [PublicAppDataDebug] sessionStorage:', report.sessionStorage);
        } catch (err: any) {
          console.error('❌ [PublicAppDataDebug] Error getting sessionStorage:', err);
          report.sessionStorage = { error: err.message };
        }
      } else {
        report.sessionStorage = { note: 'Not available' };
        console.log('ℹ️ [PublicAppDataDebug] sessionStorage not available');
      }

      // IndexedDB
      console.log('🔍 [PublicAppDataDebug] Checking IndexedDB...');
      if (typeof indexedDB !== 'undefined') {
        try {
          const databases = await indexedDB.databases();
          report.indexedDB = {
            count: databases.length,
            databases: databases.map(db => ({ name: db.name || '', version: db.version || 0 }))
          };
          console.log('✅ [PublicAppDataDebug] IndexedDB:', report.indexedDB);
        } catch (err: any) {
          console.error('❌ [PublicAppDataDebug] Error getting IndexedDB:', err);
          report.indexedDB = { error: err.message };
        }
      } else {
        report.indexedDB = { note: 'Not available' };
        console.log('ℹ️ [PublicAppDataDebug] IndexedDB not available');
      }

      // Cache Storage (Service Worker caches)
      console.log('🔍 [PublicAppDataDebug] Checking Cache Storage...');
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          report.cacheStorage = {
            count: cacheNames.length,
            caches: cacheNames
          };
          console.log('✅ [PublicAppDataDebug] Cache Storage:', report.cacheStorage);
        } catch (err: any) {
          console.error('❌ [PublicAppDataDebug] Error getting Cache Storage:', err);
          report.cacheStorage = { error: err.message };
        }
      } else {
        report.cacheStorage = { note: 'Not available' };
        console.log('ℹ️ [PublicAppDataDebug] Cache Storage not available');
      }

      // Service Workers
      console.log('🔍 [PublicAppDataDebug] Checking Service Workers...');
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          report.serviceWorkers = {
            count: registrations.length,
            workers: registrations.map(reg => ({
              scope: reg.scope,
              state: reg.active?.state || 'unknown',
              updateViaCache: reg.updateViaCache
            }))
          };
          console.log('✅ [PublicAppDataDebug] Service Workers:', report.serviceWorkers);
        } catch (err: any) {
          console.error('❌ [PublicAppDataDebug] Error getting Service Workers:', err);
          report.serviceWorkers = { error: err.message };
        }
      } else {
        report.serviceWorkers = { note: 'Not available' };
        console.log('ℹ️ [PublicAppDataDebug] Service Workers not available');
      }

      // Session cookies (if accessible)
      console.log('🔍 [PublicAppDataDebug] Checking cookies...');
      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';').map(c => c.trim().split('=')[0]);
        report.cookies = {
          count: cookies.length,
          names: cookies
        };
        console.log('✅ [PublicAppDataDebug] Cookies:', report.cookies);
      } else {
        report.cookies = { note: 'No cookies found' };
        console.log('ℹ️ [PublicAppDataDebug] No cookies found');
      }

      console.log('✅ [PublicAppDataDebug] Data load complete!');
      setReportData(report);
    } catch (error: any) {
      console.error('❌ [PublicAppDataDebug] Fatal error during data load:', error);
      setReportData({ error: error.message });
    } finally {
      setIsLoading(false);
      console.log('🔍 [PublicAppDataDebug] Loading state cleared');
    }
  };

  const handleClearData = async () => {
    console.log('🧹 [ClearData] Button clicked!');

    const confirmed = window.confirm('⚠️ WARNING ⚠️\n\nThis will clear ALL app data:\n- Logout from your account\n- Clear all cached data\n- Unregister service workers\n- Reset app to fresh state\n\nYou will need to login again.\n\nAre you sure?');

    console.log('🧹 [ClearData] User confirmation:', confirmed);

    if (!confirmed) {
      console.log('🧹 [ClearData] User cancelled');
      return;
    }

    console.log('🧹 [ClearData] Starting comprehensive data clear...');

    try {
      // 1. Clear localStorage
      console.log('🧹 [ClearData] Clearing localStorage...');
      try {
        localStorage.clear();
        console.log('✅ [ClearData] localStorage cleared');
      } catch (err) {
        console.error('❌ [ClearData] Error clearing localStorage:', err);
      }

      // 2. Clear sessionStorage
      console.log('🧹 [ClearData] Clearing sessionStorage...');
      try {
        sessionStorage.clear();
        console.log('✅ [ClearData] sessionStorage cleared');
      } catch (err) {
        console.error('❌ [ClearData] Error clearing sessionStorage:', err);
      }

      // 3. Clear IndexedDB
      console.log('🧹 [ClearData] Clearing IndexedDB...');
      if (typeof indexedDB !== 'undefined') {
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            console.log(`🧹 [ClearData] Deleting IndexedDB: ${db.name}`);
            await indexedDB.deleteDatabase(db.name || '');
          }
          console.log('✅ [ClearData] IndexedDB cleared');
        } catch (err) {
          console.error('❌ [ClearData] Error clearing IndexedDB:', err);
        }
      }

      // 4. Clear Cache Storage
      console.log('🧹 [ClearData] Clearing Cache Storage...');
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            console.log(`🧹 [ClearData] Deleting cache: ${cacheName}`);
            await caches.delete(cacheName);
          }
          console.log('✅ [ClearData] Cache Storage cleared');
        } catch (err) {
          console.error('❌ [ClearData] Error clearing Cache Storage:', err);
        }
      }

      // 5. Unregister Service Workers
      console.log('🧹 [ClearData] Unregistering Service Workers...');
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            console.log(`🧹 [ClearData] Unregistering service worker: ${registration.scope}`);
            await registration.unregister();
          }
          console.log('✅ [ClearData] Service Workers unregistered');
        } catch (err) {
          console.error('❌ [ClearData] Error unregistering Service Workers:', err);
        }
      }

      console.log('✅ [ClearData] All data cleared successfully!');
      alert('✅ All app data cleared!\n\nThe page will reload now to ensure fresh start.');

      // 6. Reload the page to ensure fresh state
      window.location.href = '/';

    } catch (error: any) {
      console.error('❌ [ClearData] Fatal error during clear:', error);
      alert('Error clearing data: ' + error.message);
    }
  };

  const handleCopy = async () => {
    const reportText = JSON.stringify(reportData, null, 2);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      alert('Failed to copy: ' + err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1623',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '24px',
          paddingTop: '20px'
        }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '900',
            color: '#E2F4FF',
            marginBottom: '0.5rem',
            letterSpacing: '0.05em'
          }}>
            APP DATA DEBUG
          </h1>
          <p style={{
            color: '#7A8CA0',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Inspect and clear all app data (no login required)
          </p>
        </div>

        {/* Back to Login Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: '1px solid #1b2a44',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#00D1FF',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s',
            alignSelf: 'flex-start'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00D1FF';
            e.currentTarget.style.backgroundColor = 'rgba(0, 209, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1b2a44';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ← Back to Login
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {/* Clear App Data Button */}
          <button
            onClick={handleClearData}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(to right, #dc2626, #ef4444)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: '900',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.5)';
            }}
          >
            ⚠️ CLEAR ALL APP DATA
          </button>

          {/* Load App Data Button */}
          <button
            onClick={handleLoadData}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading ? '#6b7280' : '#00D1FF',
              border: 'none',
              borderRadius: '12px',
              color: '#0F1623',
              fontSize: '0.875rem',
              fontWeight: '900',
              letterSpacing: '0.1em',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.5)';
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #0F1623',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                LOADING...
              </>
            ) : (
              '📊 LOAD APP DATA'
            )}
          </button>
        </div>

        {/* Report Display */}
        {reportData && (
          <div style={{
            backgroundColor: '#101A2B',
            border: '1px solid #1b2a44',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px'
          }}>
            {/* Copy Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #1b2a44'
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#E2F4FF',
                margin: 0
              }}>
                Data Report
              </h2>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: copied ? '#10b981' : 'rgba(0, 209, 255, 0.1)',
                  border: copied ? '1px solid #10b981' : '1px solid #00D1FF',
                  borderRadius: '8px',
                  color: copied ? '#ffffff' : '#00D1FF',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* JSON Report */}
            <pre style={{
              fontSize: '0.75rem',
              color: '#E2F4FF',
              backgroundColor: '#0a0e16',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '600px',
              margin: 0,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px 20px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.7rem',
          color: '#666666'
        }}>
          <a
            href="https://appcatalyst.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#666666',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#888888')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
          >
            Built by AppCatalyst
          </a>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default PublicAppDataDebug;
