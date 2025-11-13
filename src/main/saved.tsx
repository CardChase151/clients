import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomBar from '../menu/bottombar';

function Saved() {
  const navigate = useNavigate();

  // Mock saved items
  const savedItems = [
    { id: 1, title: 'Saved Item 1', description: 'This is a description for saved item 1', date: '2024-01-15' },
    { id: 2, title: 'Saved Item 2', description: 'This is a description for saved item 2', date: '2024-01-14' },
    { id: 3, title: 'Saved Item 3', description: 'This is a description for saved item 3', date: '2024-01-13' },
  ];

  return (
    <div style={{
      backgroundColor: '#0F1623',
      minHeight: '100vh',
      color: '#E2F4FF',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          margin: 0,
          color: '#FFFFFF'
        }}>
          Saved
        </h1>

        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#101A2B',
            color: '#E2F4FF',
            border: '1px solid #1b2a44',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Home
        </button>
      </header>

      {/* Main Content */}
      <div style={{
        backgroundColor: '#101A2B',
        border: '1px solid #1b2a44',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '30px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 20px 0',
          color: '#FFFFFF',
          textAlign: 'center'
        }}>
          Your Saved Items
        </h2>

        <p style={{
          color: '#9FBAD1',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 30px 0',
          textAlign: 'center'
        }}>
          Here are all your saved items and favorites
        </p>

        {/* Saved Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {savedItems.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#0F1623',
                border: '1px solid #1b2a44',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00D1FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1b2a44';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#FFFFFF'
                }}>
                  {item.title}
                </h3>
                <span style={{
                  fontSize: '12px',
                  color: '#9FBAD1'
                }}>
                  {item.date}
                </span>
              </div>
              <p style={{
                color: '#B3C5D1',
                fontSize: '14px',
                lineHeight: '1.5',
                margin: 0
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State Message */}
      <div style={{
        textAlign: 'center',
        marginBottom: '80px'
      }}>
        <p style={{
          color: '#9FBAD1',
          fontSize: '14px',
          margin: 0
        }}>
          This is the saved screen. Implement your favorites/bookmarks functionality here!
        </p>
      </div>

      <BottomBar activeTab="saved" />
    </div>
  );
}

export default Saved;