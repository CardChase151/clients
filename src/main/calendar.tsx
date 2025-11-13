import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomBar from '../menu/bottombar';

function Calendar() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock calendar events
  const events = [
    { id: 1, title: 'Team Meeting', time: '9:00 AM', date: '2024-01-15', type: 'meeting' },
    { id: 2, title: 'Project Deadline', time: '5:00 PM', date: '2024-01-15', type: 'deadline' },
    { id: 3, title: 'Client Call', time: '2:00 PM', date: '2024-01-16', type: 'call' },
    { id: 4, title: 'Design Review', time: '11:00 AM', date: '2024-01-17', type: 'review' },
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return '#00D1FF';
      case 'deadline': return '#FF6B6B';
      case 'call': return '#4ECDC4';
      case 'review': return '#FFE66D';
      default: return '#00D1FF';
    }
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
          Calendar
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
          Your Schedule
        </h2>

        <p style={{
          color: '#9FBAD1',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 30px 0',
          textAlign: 'center'
        }}>
          Manage your events and appointments
        </p>

        {/* Current Date Display */}
        <div style={{
          backgroundColor: '#0F1623',
          border: '1px solid #1b2a44',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            color: '#00D1FF'
          }}>
            Today
          </h3>
          <p style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: 0,
            color: '#FFFFFF'
          }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Events List */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            color: '#FFFFFF'
          }}>
            Upcoming Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  backgroundColor: '#0F1623',
                  border: '1px solid #1b2a44',
                  borderLeft: `4px solid ${getEventColor(event.type)}`,
                  borderRadius: '8px',
                  padding: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                    color: '#FFFFFF'
                  }}>
                    {event.title}
                  </h4>
                  <span style={{
                    fontSize: '12px',
                    color: '#9FBAD1'
                  }}>
                    {event.date}
                  </span>
                </div>
                <p style={{
                  color: getEventColor(event.type),
                  fontSize: '14px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  {event.time}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Event Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
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
            Add New Event
          </button>
        </div>
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
          This is the calendar screen. Integrate with calendar APIs or build your own scheduling system!
        </p>
      </div>

      <BottomBar activeTab="calendar" />
    </div>
  );
}

export default Calendar;