import React, { useState, useEffect } from 'react'
import { FaCog, FaInfoCircle, FaShieldAlt, FaDatabase, FaUser, FaClock } from 'react-icons/fa'
import UpdateChecker from '../components/UpdateChecker'

export default function Settings() {
  const [appVersion, setAppVersion] = useState<string>('1.0.0')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const getVersion = async () => {
      try {
        const version = await window.api.getAppVersion()
        setAppVersion(version)
      } catch (error) {
        console.error('Failed to get app version:', error)
        setAppVersion('1.0.0')
      }
    }
    getVersion()

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  const getUserRole = () => {
    const role = sessionStorage.getItem('role')
    return role === 'cashier' ? 'Cashier' : 'Owner/Administrator'
  }

  const getUserName = () => {
    return sessionStorage.getItem('userName') || 'Unknown User'
  }

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 32 
      }}>
        <FaCog style={{ fontSize: 32, marginRight: 16, color: '#3B82F6' }} />
        <h2 style={{ 
          fontSize: 32, 
          fontWeight: 800, 
          letterSpacing: '-0.02em', 
          color: '#223',
          margin: 0
        }}>
          System Settings
        </h2>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 32 
      }}>
        {/* Update Section */}
        <div>
          <h3 style={{ 
            marginBottom: 16, 
            fontSize: 24, 
            fontWeight: 600, 
            color: '#374151',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaShieldAlt style={{ marginRight: 8, color: '#10B981' }} />
            System Updates
          </h3>
          <UpdateChecker />
        </div>

        {/* Application Information */}
        <div>
          <h3 style={{ 
            marginBottom: 16, 
            fontSize: 24, 
            fontWeight: 600, 
            color: '#374151',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaInfoCircle style={{ marginRight: 8, color: '#3B82F6' }} />
            Application Information
          </h3>
          <div style={{ 
            background: '#f9fafb', 
            borderRadius: 12, 
            padding: 24, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Version:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>{appVersion}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Electron:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {window.electron?.process?.versions?.electron || 'Unknown'}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Node.js:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {window.electron?.process?.versions?.node || 'Unknown'}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Chrome:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {window.electron?.process?.versions?.chrome || 'Unknown'}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Platform:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {navigator.platform}
              </span>
            </div>
            <div>
              <strong style={{ color: '#374151' }}>User Agent:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280', fontSize: '0.875rem' }}>
                {navigator.userAgent.substring(0, 50)}...
              </span>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div>
          <h3 style={{ 
            marginBottom: 16, 
            fontSize: 24, 
            fontWeight: 600, 
            color: '#374151',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaUser style={{ marginRight: 8, color: '#8B5CF6' }} />
            User Information
          </h3>
          <div style={{ 
            background: '#f9fafb', 
            borderRadius: 12, 
            padding: 24, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Name:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>{getUserName()}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Role:</strong>
              <span style={{ 
                marginLeft: 8, 
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: getUserRole() === 'Cashier' ? '#FEF3C7' : '#DBEAFE',
                color: getUserRole() === 'Cashier' ? '#92400E' : '#1E40AF'
              }}>
                {getUserRole()}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Session ID:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280', fontFamily: 'monospace' }}>
                {Math.random().toString(36).substring(2, 15)}
              </span>
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Login Time:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div>
          <h3 style={{ 
            marginBottom: 16, 
            fontSize: 24, 
            fontWeight: 600, 
            color: '#374151',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaClock style={{ marginRight: 8, color: '#F59E0B' }} />
            System Status
          </h3>
          <div style={{ 
            background: '#f9fafb', 
            borderRadius: 12, 
            padding: 24, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Current Time:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280', fontFamily: 'monospace' }}>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Date:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {currentTime.toLocaleDateString()}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Timezone:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Online Status:</strong>
              <span style={{ 
                marginLeft: 8, 
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: navigator.onLine ? '#D1FAE5' : '#FEE2E2',
                color: navigator.onLine ? '#065F46' : '#991B1B'
              }}>
                {navigator.onLine ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <strong style={{ color: '#374151' }}>Memory Usage:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {(performance as any).memory ? 
                  `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB` : 
                  'Not available'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 style={{ 
            marginBottom: 16, 
            fontSize: 24, 
            fontWeight: 600, 
            color: '#374151',
            display: 'flex',
            alignItems: 'center'
          }}>
            <FaDatabase style={{ marginRight: 8, color: '#EF4444' }} />
            Data Management
          </h3>
          <div style={{ 
            background: '#f9fafb', 
            borderRadius: 12, 
            padding: 24, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Local Storage:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {localStorage.length} items stored
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Session Storage:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {sessionStorage.length} items stored
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: '#374151' }}>Available Storage:</strong>
              <span style={{ marginLeft: 8, color: '#6B7280' }}>
                {navigator.storage ? 'Available' : 'Not available'}
              </span>
            </div>
            <button 
              style={{
                background: '#EF4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
              onClick={() => {
                if (confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
                  localStorage.clear()
                  alert('Local data cleared successfully!')
                  window.location.reload()
                }
              }}
            >
              Clear Local Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 