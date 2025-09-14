import React, { useState } from 'react';
import { User, Student, Teacher } from '../types';
import { getAccessiblePages } from '../lib/pageAccess';
import { Toolbar, Button, colors } from './UI';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: User;
  onLogout: () => void;
}


export default function Navigation({ currentPage, onPageChange, user, onLogout }: NavigationProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const pages = [
    { id: 'landing', title: 'Home' },
    { id: 'field-project', title: 'Field Project' },
    { id: 'community-engagement', title: 'Community Engagement' },
    { id: 'co-curricular', title: 'Co-Curricular' },
    { id: 'attendance', title: 'Attendance' },
    { id: 'manage-classes', title: 'Manage Classes' },
  ];

  const accessiblePageIds = getAccessiblePages(user);
  const availablePages = pages.filter((page) => accessiblePageIds.includes(page.id));

  const studentData = user.role === 'student' ? (user.data as Student) : null;
  const teacherData = user.role === 'teacher' ? (user.data as Teacher) : null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Section */}
        <div className="flex flex-center">
          <div className="navbar-brand">CrediLocker</div>
          {/* Navigation Links */}
          <div className="navbar-links">
            {availablePages.map((page) => (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                aria-current={currentPage === page.id ? 'page' : undefined}
                className={`navbar-link${currentPage === page.id ? ' active' : ''}`}
              >
                {page.title}
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="flex flex-center gap-16" style={{ position: 'relative' }}>
          <button
            className="profile-btn"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-haspopup="true"
            aria-expanded={showProfileDropdown}
          >
            <div className="profile-avatar">
              {user.role === 'student'
                ? (user.data as Student).name.charAt(0).toUpperCase()
                : (user.data as Teacher).name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 500 }}>
              {user.role === 'student' ? (user.data as Student).name : (user.data as Teacher).name}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <path d="M7 10L12 15L17 10H7Z" fill="#8db7d2" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: '#f8f9fa' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                  Profile Information
                </h3>
              </div>
              <div style={{ padding: 16 }}>
                {studentData ? (
                  <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
                    <div className="flex gap-12 flex-center">
                      <div style={{ width: 48, height: 48 }} className="profile-avatar">
                        {studentData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                          {studentData.name}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--subtle-text)' }}>
                          {studentData.class} • {studentData.uid || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex" style={{ flexDirection: 'column', gap: 8 }}>
                      <div className="flex flex-center gap-8">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                            fill="#8db7d2"
                          />
                        </svg>
                        <span style={{ fontSize: 14, color: 'var(--text)' }}>{studentData.email}</span>
                      </div>
                      {studentData.phone_number && (
                        <div className="flex flex-center gap-8">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
                              fill="#8db7d2"
                            />
                          </svg>
                          <span style={{ fontSize: 14, color: 'var(--text)' }}>{studentData.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : teacherData ? (
                  <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
                    <div className="flex gap-12 flex-center">
                      <div style={{ width: 48, height: 48 }} className="profile-avatar">
                        {teacherData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                          {teacherData.name}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--subtle-text)' }}>
                          Teacher • {teacherData.employee_code}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-center gap-8">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                          fill="#8db7d2"
                        />
                      </svg>
                      <span style={{ fontSize: 14, color: 'var(--text)' }}>{teacherData.email}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: '#f8f9fa' }}>
                <Button variant="danger" onClick={onLogout} style={{ width: '100%', fontSize: 14 }}>
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
            zIndex: 999,
          }}
          onClick={() => setShowProfileDropdown(false)}
        />
      )}
    </nav>
  );
}

