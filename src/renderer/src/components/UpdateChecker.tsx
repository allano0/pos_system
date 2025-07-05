import React, { useState, useEffect } from 'react'
import { FaDownload, FaSync, FaCheckCircle, FaExclamationTriangle, FaWifi, FaExclamationCircle, FaInfoCircle, FaTimes, FaShieldAlt, FaRocket } from 'react-icons/fa'
import './UpdateChecker.css'

interface UpdateStatus {
  checking: boolean
  available: boolean
  downloading: boolean
  downloaded: boolean
  error: string | null
  version?: string
  currentVersion?: string
  isOnline: boolean
  lastChecked?: string
}

const UpdateChecker: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    isOnline: navigator.onLine
  })

  // Get current app version on component mount
  useEffect(() => {
    const getCurrentVersion = async () => {
      try {
        const currentVersion = await window.api.getAppVersion()
        setStatus(prev => ({ ...prev, currentVersion }))
      } catch (error) {
        console.error('Failed to get current version:', error)
      }
    }
    getCurrentVersion()
  }, [])

  // Check internet connectivity
  useEffect(() => {
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true, error: null }))
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkForUpdates = async () => {
    if (!status.isOnline) {
      setStatus(prev => ({ ...prev, error: 'No internet connection. Please check your network settings.' }))
      return
    }

    setStatus(prev => ({ ...prev, checking: true, error: null }))
    
    try {
      const result = await window.api.checkForUpdates()
      
      if (result.success) {
        if (result.result && result.result.updateInfo) {
          const newVersion = result.result.updateInfo.version
          const currentVersion = status.currentVersion
          
          // Only show update if the new version is actually newer
          if (newVersion && currentVersion && newVersion !== currentVersion) {
            setStatus(prev => ({
              ...prev,
              checking: false,
              available: true,
              version: newVersion,
              lastChecked: new Date().toLocaleString()
            }))
          } else {
            setStatus(prev => ({
              ...prev,
              checking: false,
              available: false,
              lastChecked: new Date().toLocaleString()
            }))
          }
        } else {
          setStatus(prev => ({
            ...prev,
            checking: false,
            available: false,
            lastChecked: new Date().toLocaleString()
          }))
        }
      } else {
        setStatus(prev => ({
          ...prev,
          checking: false,
          error: result.error || 'Failed to check for updates'
        }))
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        checking: false,
        error: 'Failed to check for updates'
      }))
    }
  }

  const downloadUpdate = async () => {
    if (!status.isOnline) {
      setStatus(prev => ({ ...prev, error: 'No internet connection. Please check your network settings.' }))
      return
    }

    setStatus(prev => ({ ...prev, downloading: true, error: null }))
    
    try {
      const result = await window.api.downloadUpdate()
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          downloading: false,
          downloaded: true
        }))
      } else {
        setStatus(prev => ({
          ...prev,
          downloading: false,
          error: result.error || 'Failed to download update'
        }))
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        downloading: false,
        error: 'Failed to download update'
      }))
    }
  }

  const installUpdate = async () => {
    try {
      await window.api.installUpdate()
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: 'Failed to install update'
      }))
    }
  }

  const clearError = () => {
    setStatus(prev => ({ ...prev, error: null }))
  }

  const openNetworkSettings = () => {
    // This would typically open system network settings
    // For now, we'll show a message
    alert('Please check your internet connection and network settings.')
  }

  return (
    <div className="update-checker-container">
      {/* Header */}
      <div className="update-checker-header">
        <div className="update-checker-header-left">
          <div className="update-checker-icon-container">
            <FaShieldAlt className="update-checker-icon" />
          </div>
          <div>
            <h3 className="update-checker-title">System Updates</h3>
            <p className="update-checker-subtitle">Keep your system secure and up to date</p>
          </div>
        </div>
        <div className={`update-checker-status-badge ${
          status.isOnline 
            ? 'update-checker-status-online' 
            : 'update-checker-status-offline'
        }`}>
          {status.isOnline ? (
            <>
              <FaWifi style={{ marginRight: '0.25rem' }} />
              Online
            </>
          ) : (
            <>
              <FaExclamationCircle style={{ marginRight: '0.25rem' }} />
              Offline
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {status.error && (
        <div className="update-checker-error">
          <div className="update-checker-error-content">
            <FaExclamationTriangle className="update-checker-error-icon" />
            <span className="update-checker-error-text">{status.error}</span>
          </div>
          <button 
            onClick={clearError} 
            className="update-checker-error-close"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Status Cards */}
      <div className="update-checker-status-cards">
        {/* Last Checked Info */}
        {status.lastChecked && !status.checking && (
          <div className="update-checker-last-checked">
            <div className="update-checker-last-checked-content">
              <div className="update-checker-last-checked-left">
                <FaInfoCircle className="update-checker-last-checked-icon" />
                <span className="update-checker-last-checked-label">Last checked</span>
              </div>
              <span className="update-checker-last-checked-time">{status.lastChecked}</span>
            </div>
          </div>
        )}

        {/* No Updates Available */}
        {!status.available && !status.downloaded && !status.checking && status.lastChecked && (
          <div className="update-checker-up-to-date">
            <div className="update-checker-up-to-date-icon">
              <FaCheckCircle />
            </div>
            <h4 className="update-checker-up-to-date-title">You're up to date!</h4>
            <p className="update-checker-up-to-date-text">
              Your system is running version {status.currentVersion} with all security patches.
            </p>
          </div>
        )}

        {/* Update Available */}
        {status.available && !status.downloaded && (
          <div className="update-checker-update-available">
            <div className="update-checker-update-available-content">
              <div className="update-checker-update-available-icon">
                <FaRocket />
              </div>
              <div>
                <h4 className="update-checker-update-available-title">New version available!</h4>
                <p className="update-checker-update-available-text">Version {status.version} is ready to download</p>
              </div>
            </div>
          </div>
        )}

        {/* Update Downloaded */}
        {status.downloaded && (
          <div className="update-checker-update-downloaded">
            <div className="update-checker-update-downloaded-content">
              <div className="update-checker-update-downloaded-icon">
                <FaCheckCircle />
              </div>
              <div>
                <h4 className="update-checker-update-downloaded-title">Update ready to install!</h4>
                <p className="update-checker-update-downloaded-text">The application will restart after installation</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="update-checker-actions">
        {/* Check for Updates Button */}
        {!status.available && !status.downloaded && (
          <button
            onClick={checkForUpdates}
            disabled={status.checking || !status.isOnline}
            className="update-checker-button update-checker-button-primary"
          >
            {status.checking ? (
              <>
                <FaSync className="update-checker-button-icon update-checker-spinner" />
                Checking for updates...
              </>
            ) : !status.isOnline ? (
              <>
                <FaExclamationCircle className="update-checker-button-icon" />
                Check for Updates (Offline)
              </>
            ) : (
              <>
                <FaSync className="update-checker-button-icon" />
                Check for Updates
              </>
            )}
          </button>
        )}

        {/* Download Update Button */}
        {status.available && !status.downloaded && (
          <button
            onClick={downloadUpdate}
            disabled={status.downloading || !status.isOnline}
            className="update-checker-button update-checker-button-success"
          >
            {status.downloading ? (
              <>
                <FaDownload className="update-checker-button-icon update-checker-spinner" />
                Downloading...
              </>
            ) : (
              <>
                <FaDownload className="update-checker-button-icon" />
                Download Update
              </>
            )}
          </button>
        )}

        {/* Install Update Button */}
        {status.downloaded && (
          <button
            onClick={installUpdate}
            className="update-checker-button update-checker-button-purple"
          >
            <FaCheckCircle className="update-checker-button-icon" />
            Install & Restart
          </button>
        )}

        {/* Network Settings Button (when offline) */}
        {!status.isOnline && (
          <button
            onClick={openNetworkSettings}
            className="update-checker-button update-checker-button-warning"
          >
            <FaWifi className="update-checker-button-icon" />
            Open Network Settings
          </button>
        )}
      </div>
    </div>
  )
}

export default UpdateChecker 