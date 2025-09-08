import React, { useState } from 'react'
import { User, Student, Teacher } from '../types'
import { getAccessiblePages } from '../lib/pageAccess'
import { Toolbar, Button, colors } from './UI'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  user: User
  onLogout: () => void
}

export default function Navigation({ currentPage, onPageChange, user, onLogout }: NavigationProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  
  const pages = [
    { id: 'landing', title: 'Home' },
    { id: 'field-project', title: 'Field Project' },
    { id: 'community-engagement', title: 'Community Engagement' },
    { id: 'co-curricular', title: 'Co-Curricular' },
    { id: 'attendance', title: 'Attendance' },
    { id: 'manage-classes', title: 'Manage Classes' },
  ]

  const accessiblePageIds = getAccessiblePages(user)
  const availablePages = pages.filter(page => accessiblePageIds.includes(page.id))

  const studentData = user.role === 'student' ? user.data as Student : null
  const teacherData = user.role === 'teacher' ? user.data as Teacher : null

  return (
    <nav style={{ 
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.border}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64
      }}>
        {/* Brand Section */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            color: colors.primary,
            marginRight: 48
          }}>
            CrediLocker
          </div>
          
          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {availablePages.map((page) => (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: currentPage === page.id ? 600 : 500,
                  color: currentPage === page.id ? colors.primary : colors.text,
                  backgroundColor: currentPage === page.id ? `${colors.primary}15` : 'transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== page.id) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.color = colors.primary
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== page.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.text
                  }
                }}
              >
                {page.title}
                {/* Active indicator */}
                {currentPage === page.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    backgroundColor: colors.primary,
                    borderRadius: 1
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {/* Clickable User Info */}
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: '4px 12px',
              borderRadius: 20,
              backgroundColor: '#f8f9fa',
              fontSize: 14,
              color: colors.text,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e9ecef'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontSize: 12,
              fontWeight: 600
            }}>
              {user.role === 'student' 
                ? (user.data as Student).name.charAt(0).toUpperCase()
                : (user.data as Teacher).name.charAt(0).toUpperCase()
              }
            </div>
            <span style={{ fontWeight: 500 }}>
              {user.role === 'student' 
                ? (user.data as Student).name
                : (user.data as Teacher).name
              }
            </span>
            {/* Dropdown arrow */}
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              style={{
                transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <path d="M7 10L12 15L17 10H7Z" fill={colors.subtleText}/>
            </svg>
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              backgroundColor: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              minWidth: 300,
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ 
                padding: 16, 
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: '#f8f9fa'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: colors.text
                }}>
                  Profile Information
                </h3>
              </div>
              
              {/* Content */}
              <div style={{ padding: 16 }}>
                {studentData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.white,
                        fontSize: 18,
                        fontWeight: 600
                      }}>
                        {studentData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                          {studentData.name}
                        </div>
                        <div style={{ fontSize: 14, color: colors.subtleText }}>
                          {studentData.class} •  {studentData.uid || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill={colors.subtleText}/>
                        </svg>
                        <span style={{ fontSize: 14, color: colors.text }}>{studentData.email}</span>
                      </div>
                      
                      {studentData.phone_number && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill={colors.subtleText}/>
                          </svg>
                          <span style={{ fontSize: 14, color: colors.text }}>{studentData.phone_number}</span>
                        </div>
                      )}
                    </div>

                    

                    
                  </div>
                ) : teacherData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.white,
                        fontSize: 18,
                        fontWeight: 600
                      }}>
                        {teacherData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                          {teacherData.name}
                        </div>
                        <div style={{ fontSize: 14, color: colors.subtleText }}>
                          Teacher • {teacherData.employee_code}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill={colors.subtleText}/>
                      </svg>
                      <span style={{ fontSize: 14, color: colors.text }}>{teacherData.email}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              
              {/* Footer */}
              <div style={{ 
                padding: 12, 
                borderTop: `1px solid ${colors.border}`,
                backgroundColor: '#f8f9fa'
              }}>
                <Button 
                  variant="danger" 
                  onClick={onLogout}
                  style={{ width: '100%', fontSize: 14 }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {showProfileDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </nav>
  )
}
