
import React, { useState, useEffect } from 'react'
import { UserRole } from '../types'
import { supabase } from '../lib/supabase'
import { Section, Card, Button, Modal, colors } from './UI'
// Excel export functionality is now handled by ExcelReportButton component
import ExcelReportButton from './ExcelReportButton'

interface AttendanceProps {
  role: UserRole
}

interface Activity {
  id: number
  activity_name: string
  date: string
  time: string
  venue: string
  assigned_class: string[]
  comments: string
  cc_points?: number
}

interface Student {
  uid: string
  name: string
  class: string
}

interface AttendanceRecord {
  id: string
  activity_id: number
  student_uid: string
  attendance_status: 'present' | 'absent'
  marked_by: string
  marked_at: string
  notes: string
}

export default function Attendance({ role }: AttendanceProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [attendanceModal, setAttendanceModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [filters, setFilters] = useState({
    class: '',
    activity: ''
  })

  useEffect(() => {
    fetchActivities()
    fetchStudents()
    if (role === 'student') {
      fetchStudentAttendance()
    } else {
      fetchAllAttendance()
    }
  }, [role])

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('co_curricular_activities')
      .select('*')
      .order('date', { ascending: false })

    if (!error) setActivities(data || [])
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('uid, name, class')
      .order('class', { ascending: true })

    if (!error) {
      // Sort by class first, then by last 2 digits of UID
      const sortedStudents = (data || []).sort((a, b) => {
        if (a.class !== b.class) {
          return a.class.localeCompare(b.class)
        }
        // Extract last 2 digits from UID and sort numerically
        const aLastDigits = parseInt(a.uid.slice(-2)) || 0
        const bLastDigits = parseInt(b.uid.slice(-2)) || 0
        return aLastDigits - bLastDigits
      })
      setStudents(sortedStudents)
    }
  }

  const fetchAllAttendance = async () => {
    const { data, error } = await supabase
      .from('co_curricular_attendance')
      .select('*')
      .order('marked_at', { ascending: false })

    if (!error) setAttendanceRecords(data || [])
  }

  const fetchStudentAttendance = async () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const { data, error } = await supabase
      .from('co_curricular_attendance')
      .select('*')
      .eq('student_uid', user.id)
      .order('marked_at', { ascending: false })

    if (!error) setAttendanceRecords(data || [])
  }

  const openAttendanceModal = (activity: Activity) => {
    setSelectedActivity(activity)
    setSelectedClass(activity.assigned_class[0] || '')
    setAttendanceModal(true)
  }


  const markAttendance = async (studentUid: string, status: 'present' | 'absent', notes: string = '') => {
    if (!selectedActivity) return

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const employeeCode = user.id // <-- use id as employee_code

    if (!employeeCode) {
      alert('Employee code not found. Please log in again.')
      return
    }

    try {
      // Check if attendance already exists
      const { data: existing } = await supabase
        .from('co_curricular_attendance')
        .select('id')
        .eq('activity_id', selectedActivity.id)
        .eq('student_uid', studentUid)
        .maybeSingle()

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('co_curricular_attendance')
          .update({
            attendance_status: status,
            marked_by: employeeCode,
            marked_at: new Date().toISOString(),
            notes
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Insert new record
        const { error } = await supabase
          .from('co_curricular_attendance')
          .insert([{
            activity_id: selectedActivity.id,
            student_uid: studentUid,
            attendance_status: status,
            marked_by: employeeCode,
            notes
          }])

        if (error) throw error
      }

      await fetchAllAttendance()
    } catch (error) {
      console.error('Attendance error:', error)
      alert('Failed to mark attendance')
    }
  }

  const getAttendanceForActivity = (activityId: number) => {
    return attendanceRecords.filter(record => record.activity_id === activityId)
  }

  const getStudentAttendanceStatus = (activityId: number, studentUid: string) => {
    const record = attendanceRecords.find(r => r.activity_id === activityId && r.student_uid === studentUid)
    return record?.attendance_status || null
  }

  const getActivityName = (activityId: number) => {
    const activity = activities.find(a => a.id === activityId)
    return activity?.activity_name || 'Unknown Activity'
  }

  const getStudentName = (studentUid: string) => {
    const student = students.find(s => s.uid === studentUid)
    return student?.name || studentUid
  }

  // Report generation logic is now handled by ExcelReportButton component

  const filteredActivities = activities.filter(activity => {
    const matchesClass = !filters.class || activity.assigned_class.some(cls => cls.toUpperCase() === filters.class.toUpperCase())
    const matchesActivity = !filters.activity || activity.activity_name.toLowerCase().includes(filters.activity.toLowerCase())
    return matchesClass && matchesActivity
  })

  if (role === 'student') {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const studentClass = user.data?.class
    const studentActivities = activities.filter(activity =>
      activity.assigned_class.includes(studentClass)
    )

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 28, marginBottom: 20, color: 'var(--text)' }}>My Attendance</h1>
        <Section title="My Co-Curricular Activities">
          {studentActivities.length === 0 ? (
            <p style={{ color: 'var(--subtle-text)' }}>No activities assigned to your class.</p>
          ) : (
            studentActivities.map(activity => {
              const attendance = getStudentAttendanceStatus(activity.id, user.id)
              return (
                <Card key={activity.id} className="card mb-16" style={{ padding: 20 }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text)' }}>{activity.activity_name}</h3>
                      <p style={{ margin: '4px 0', color: 'var(--subtle-text)' }}>
                        Date: {activity.date} | Time: {activity.time} | Venue: {activity.venue}
                      </p>
                    </div>
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor:
                          attendance === 'present'
                            ? 'var(--light-accent)'
                            : attendance === 'absent'
                            ? 'var(--danger-bg)' /* add this to your CSS as a light red background */
                            : 'var(--surface)',
                        color:
                          attendance === 'present'
                            ? 'var(--accent)'
                            : attendance === 'absent'
                            ? 'var(--danger)'
                            : 'var(--subtle-text)',
                      }}
                    >
                      {attendance ? attendance.charAt(0).toUpperCase() + attendance.slice(1) : 'Not Marked'}
                    </div>
                  </div>
                  {activity.comments && (
                    <p style={{ fontSize: 14, color: 'var(--subtle-text)', margin: 0 }}>
                      <strong>Comments:</strong> {activity.comments}
                    </p>
                  )}
                </Card>
              )
            })
          )}
        </Section>
      </div>
    )
  }

  // Teacher view
  return (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, color: 'var(--text)' }}>Attendance Management</h1>
        {role === 'teacher' && (
          <ExcelReportButton
            reportType="attendance"
            activities={activities}
            students={students}
            attendanceRecords={attendanceRecords}
          >
            Generate Attendance Report
          </ExcelReportButton>
        )}
      </div>

      <Section title="Filters">
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--subtle-text)' }}>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
            >
              {selectedActivity?.assigned_class.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--subtle-text)' }}>Activity</label>
            <input
              type="text"
              value={filters.activity}
              onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value }))}
              placeholder="Search activities..."
              style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
            />
          </div>
          <div className="flex flex-center" style={{ alignItems: 'end' }}>
            <Button variant="secondary" className="btn-secondary" onClick={() => setFilters({ class: '', activity: '' })}>Clear Filters</Button>
          </div>
        </div>
      </Section>

      <Section title="Activities">
        {filteredActivities.length === 0 ? (
          <p style={{ color: 'var(--subtle-text)' }}>No activities found matching the filters.</p>
        ) : (
          filteredActivities.map(activity => {
            const activityAttendance = getAttendanceForActivity(activity.id)
            const totalStudents = students.filter(s => activity.assigned_class.includes(s.class)).length
            const markedCount = activityAttendance.length
            return (
              <Card key={activity.id} className="card mb-16" style={{ padding: 20 }}>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text)' }}>{activity.activity_name}</h3>
                    <p style={{ margin: '4px 0', color: 'var(--subtle-text)' }}>
                      Date: {activity.date} | Time: {activity.time} | Venue: {activity.venue}
                    </p>
                    <p style={{ margin: '4px 0', color: 'var(--subtle-text)' }}>
                      Classes: {activity.assigned_class.join(', ')} | Attendance: {markedCount}/{totalStudents}
                    </p>
                  </div>
                  <Button variant="primary" className="btn" onClick={() => openAttendanceModal(activity)}>
                    Mark Attendance
                  </Button>
                </div>
                {activity.comments && (
                  <p style={{ fontSize: 14, color: 'var(--subtle-text)', margin: 0 }}>
                    <strong>Comments:</strong> {activity.comments}
                  </p>
                )}
              </Card>
            )
          })
        )}
      </Section>

      {/* Attendance Modal */}
      <Modal open={attendanceModal} onClose={() => setAttendanceModal(false)} title={`Mark Attendance - ${selectedActivity?.activity_name}`} width={800}>
        {selectedActivity && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Date:</strong> {selectedActivity.date} | <strong>Time:</strong> {selectedActivity.time} | <strong>Venue:</strong> {selectedActivity.venue}</p>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                >
                  {selectedActivity.assigned_class.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {students
                .filter(student => student.class === selectedClass)
                .map(student => {
                  const currentStatus = getStudentAttendanceStatus(selectedActivity.id, student.uid)
                  return (
                    <div key={student.uid} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: `1px solid ${colors.border}`,
                      backgroundColor: currentStatus === 'present' ? '#d4edda' :
                                      currentStatus === 'absent' ? '#f8d7da' : 'transparent'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{student.name}</div>
                        <div style={{ fontSize: 12, color: colors.subtleText }}>{student.uid} - {student.class}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          variant={currentStatus === 'present' ? 'success' : 'secondary'}
                          onClick={() => markAttendance(student.uid, 'present')}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          Present
                        </Button>

                        <Button
                          variant={currentStatus === 'absent' ? 'danger' : 'secondary'}
                          onClick={() => markAttendance(student.uid, 'absent')}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
