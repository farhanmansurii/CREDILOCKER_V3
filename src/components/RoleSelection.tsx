import React from 'react'
import { UserRole } from '../types'
import { colors } from './UI'

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  return (
    <div style={{
      height: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: 40,
        borderRadius: 16,
        width: 450,
        textAlign: 'center',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(26,35,126,0.10)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 12,
          color: 'var(--primary)'
        }}>
          CrediLocker
        </h1>
        <p style={{
          color: 'var(--subtle-text)',
          marginBottom: 40,
          fontSize: 16
        }}>
          Choose your role to continue
        </p>

        <button
          onClick={() => onRoleSelect('student')}
          style={{
            width: '100%',
            padding: 24,
            marginBottom: 20,
            border: '2px solid var(--border)',
            borderRadius: 12,
            backgroundColor: 'var(--card-bg)',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--light-accent)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
            color: 'var(--primary)'
          }}>
            Student
          </div>
          <div style={{
            color: 'var(--subtle-text)',
            fontSize: 14
          }}>
            Track your projects and activities
          </div>
        </button>

        <button
          onClick={() => onRoleSelect('teacher')}
          style={{
            width: '100%',
            padding: 24,
            border: '2px solid var(--border)',
            borderRadius: 12,
            backgroundColor: 'var(--card-bg)',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--light-accent)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
            color: 'var(--primary)'
          }}>
            Teacher
          </div>
          <div style={{
            color: 'var(--subtle-text)',
            fontSize: 14
          }}>
            Manage projects and student activities
          </div>
        </button>
      </div>
    </div>
  )
}
