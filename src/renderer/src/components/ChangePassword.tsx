import React, { useState } from 'react'
import { FaEye, FaEyeSlash, FaLock, FaCheck, FaTimes } from 'react-icons/fa'

interface ChangePasswordProps {
  onPasswordChanged?: () => void
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onPasswordChanged }) => {
  const [showForm, setShowForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Use the same URL pattern as DataSync
  const isDev = process.env.NODE_ENV === 'development'
  const baseUrl = isDev ? 'http://localhost:5000' : 'https://SAMTECH-backend.onrender.com'
  const CHANGE_PASSWORD_URL = `${baseUrl}/api/change-password`

  const validatePassword = (password: string) => {
    const isFourDigits = /^\d{4}$/.test(password)
    
    return {
      isFourDigits,
      isValid: isFourDigits
    }
  }

  const passwordValidation = validatePassword(newPassword)

  const handleToggleForm = () => {
    setShowForm(!showForm)
    if (showForm) {
      // Clear form when hiding
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New PINs do not match' })
      return
    }

    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'PIN must be exactly 4 digits' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Get current user info
      const currentUser = sessionStorage.getItem('userName') || 'admin'
      const sessionRole = sessionStorage.getItem('role') || 'default'
      // Map 'default' role to 'owner' for backend API
      const currentRole = sessionRole === 'default' ? 'owner' : sessionRole
      
      console.log('Change password request:', {
        username: currentUser,
        role: currentRole,
        sessionRole: sessionRole,
        url: CHANGE_PASSWORD_URL
      })
      
      // Call backend API to change password
      const response = await fetch(CHANGE_PASSWORD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser,
          currentPassword: currentPassword,
          newPassword: newPassword,
          role: currentRole
        })
      })

      const result = await response.json()
      console.log('Change password response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      // Update local storage with new PIN
      if (currentRole === 'owner') {
        // Update owner PIN in localStorage
        const ownerData = JSON.parse(localStorage.getItem('SAMTECH_owner') || '{}')
        ownerData.pin = newPassword
        ownerData.lastModified = Date.now()
        localStorage.setItem('SAMTECH_owner', JSON.stringify(ownerData))
      } else if (currentRole === 'cashier') {
        // Update cashier PIN in localStorage
        const cashiers = JSON.parse(localStorage.getItem('SAMTECH_cashiers') || '[]')
        const updatedCashiers = cashiers.map((cashier: any) => {
          if (cashier.name === currentUser) {
            return { ...cashier, pin: newPassword, lastModified: Date.now() }
          }
          return cashier
        })
        localStorage.setItem('SAMTECH_cashiers', JSON.stringify(updatedCashiers))
      }
      
      setMessage({ type: 'success', text: 'PIN changed successfully!' })
      
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Call callback if provided
      if (onPasswordChanged) {
        onPasswordChanged()
      }
      
    } catch (error) {
      console.error('Change password error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to change PIN'
      
      // Check if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        setMessage({ 
          type: 'error', 
          text: 'Network error. Please check your internet connection and try again.' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: errorMessage 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      background: '#f9fafb', 
      borderRadius: 12, 
      padding: 24, 
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {!showForm ? (
        // Show button to open form
        <button
          type="button"
          onClick={handleToggleForm}
          style={{
            width: '100%',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          <FaLock style={{ marginRight: 8 }} />
          Change PIN
        </button>
      ) : (
        // Show form
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 20 
          }}>
            <h4 style={{ 
              margin: 0, 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              color: '#374151' 
            }}>
              Change Your PIN
            </h4>
            <button
              type="button"
              onClick={handleToggleForm}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '4px',
                borderRadius: 4
              }}
              title="Cancel"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
        {/* Current PIN */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 500, 
            color: '#374151' 
          }}>
            Current PIN
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter current 4-digit PIN"
              maxLength={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: '48px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* New PIN */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 500, 
            color: '#374151' 
          }}>
            New PIN
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter new 4-digit PIN"
              maxLength={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: '48px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* PIN Requirements */}
          {newPassword && (
            <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: passwordValidation.isFourDigits ? '#10B981' : '#EF4444'
              }}>
                {passwordValidation.isFourDigits ? <FaCheck /> : <FaTimes />}
                <span style={{ marginLeft: 6 }}>Must be exactly 4 digits</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm PIN */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 500, 
            color: '#374151' 
          }}>
            Confirm New PIN
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Confirm new 4-digit PIN"
              maxLength={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: '48px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* PIN Match Indicator */}
          {confirmPassword && (
            <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: newPassword === confirmPassword ? '#10B981' : '#EF4444'
              }}>
                {newPassword === confirmPassword ? <FaCheck /> : <FaTimes />}
                <span style={{ marginLeft: 6 }}>
                  {newPassword === confirmPassword ? 'PINs match' : 'PINs do not match'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            marginBottom: 20,
            padding: 12,
            borderRadius: 8,
            backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex',
            alignItems: 'center'
          }}>
            {message.type === 'success' ? <FaCheck /> : <FaTimes />}
            <span style={{ marginLeft: 8 }}>{message.text}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
          style={{
            width: '100%',
            background: isLoading || !passwordValidation.isValid || newPassword !== confirmPassword 
              ? '#9CA3AF' 
              : '#3B82F6',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 500,
            cursor: isLoading || !passwordValidation.isValid || newPassword !== confirmPassword 
              ? 'not-allowed' 
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: 8
              }} />
              Changing PIN...
            </>
          ) : (
            <>
              <FaLock style={{ marginRight: 8 }} />
              Change PIN
            </>
          )}
        </button>
          </form>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default ChangePassword
