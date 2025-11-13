import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomBar from '../menu/bottombar';

function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Mock search results
    const mockResults = [
      `Results for "${searchQuery}": Item 1`,
      `Results for "${searchQuery}": Item 2`,
      `Results for "${searchQuery}": Item 3`,
    ];

    setSearchResults(mockResults);
  };

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
          Search
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

      {/* Search Interface */}
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
          Search Functionality
        </h2>

        <p style={{
          color: '#9FBAD1',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 30px 0',
          textAlign: 'center'
        }}>
          This is the search screen. You can implement your search functionality here!
        </p>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '30px'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter your search query..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              backgroundColor: '#0F1623',
              border: '1px solid #1b2a44',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#FFFFFF',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              backgroundColor: '#00D1FF',
              color: '#0F1623',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 15px 0',
              color: '#FFFFFF'
            }}>
              Search Results:
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#0F1623',
                    border: '1px solid #1b2a44',
                    borderRadius: '8px',
                    padding: '15px',
                    color: '#E2F4FF'
                  }}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div style={{
        textAlign: 'center',
        marginBottom: '80px'
      }}>
        <p style={{
          color: '#9FBAD1',
          fontSize: '14px',
          margin: 0
        }}>
          Replace this with your actual search implementation (API calls, database queries, etc.)
        </p>
      </div>

      <BottomBar activeTab="search" />

      <style>{`
        input::placeholder {
          color: #9FBAD1;
        }
      `}</style>
    </div>
  );
}

export default Search;