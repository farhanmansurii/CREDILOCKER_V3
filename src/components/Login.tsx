import React, { useState } from 'react'
import { authenticateUser } from '../lib/auth'
import { UserRole } from '../types'
import { colors } from './UI'

interface LoginProps {
  onLogin: (user: any, role: UserRole) => void
  role: UserRole
  onBack: () => void
}

export default function Login({ onLogin, role, onBack }: LoginProps) {
  const [uid, setUid] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const credentials = role === 'student'
        ? { uid: uid.toUpperCase(), email }
        : { email, password }

      const user = await authenticateUser(credentials, role)

      if (user) {
        onLogin(user, role)
      } else {
        alert('Login failed. Please check your credentials.')
      }
    } catch (error) {
      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div className="card" style={{ padding: 40, borderRadius: 16, width: 450, maxWidth: '100%' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              marginRight: 12,
              color: 'var(--primary)',
              fontWeight: 500
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
            CrediLocker
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ color: 'var(--subtle-text)', fontSize: 16 }}>
            Sign in as <strong style={{ color: 'var(--primary)' }}>{role}</strong>
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {role === 'student' ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontSize: 14
                }}>
                  Student ID
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text)',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  placeholder="Enter your student ID"
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontSize: 14
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text)',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontSize: 14
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text)',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontSize: 14
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text)',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn"
            style={{
              width: '100%',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
