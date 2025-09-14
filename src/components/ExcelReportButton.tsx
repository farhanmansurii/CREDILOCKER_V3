/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Button } from './UI'
import { supabase } from '../lib/supabase'
import { exportFPReport, exportCEPReport, exportAttendanceReport, FPReportRow, CEPReportRow } from '../lib/excelExport'

export type ReportType = 'field_project' | 'cep' | 'attendance'

interface ExcelReportButtonProps {
  reportType: ReportType
  variant?: 'success' | 'primary' | 'secondary'
  children?: React.ReactNode
  style?: React.CSSProperties
  // Optional props for components that have their own data
  requirements?: any[]
  submissions?: any[]
  students?: any[]
  approvals?: any[]
  activities?: any[]
  attendanceRecords?: any[]
}

export default function ExcelReportButton({
  reportType,
  variant = 'success',
  children = 'Download Excel Report',
  style,
  requirements = [],
  submissions = [],
  students = [],
  approvals = [],
  activities = [],
  attendanceRecords = []
}: ExcelReportButtonProps) {
  const handleClick = async () => {
    const reportTypeLabels = {
      field_project: 'Field Project',
      cep: 'Community Engagement Program',
      attendance: 'Attendance'
    }

    const selectedClass = prompt(`Enter class to generate ${reportTypeLabels[reportType]} report for (e.g., FYIT, FYSD, SYIT, SYSD):`)?.trim()
    if (!selectedClass) return

    try {
      switch (reportType) {
        case 'field_project':
          await generateFieldProjectReport(selectedClass)
          break
        case 'cep':
          await generateCEPReport(selectedClass)
          break
        case 'attendance':
          await generateAttendanceReport(selectedClass)
          break
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    }
  }

  const generateFieldProjectReport = async (selectedClass: string) => {
    // If we have data passed in, use it; otherwise fetch from database
    let reportData: FPReportRow[]

    if (submissions.length > 0 && students.length > 0 && approvals.length > 0) {
      // Use passed data (from components like FieldProject, CommunityEngagement)
      const groupedSubmissions = submissions
        .filter((sub: any) => sub.class?.toUpperCase() === selectedClass.toUpperCase())
        .reduce((acc: any, sub: any) => {
          const key = `${sub.student_uid}_${sub.class}`
          if (!acc[key]) acc[key] = { student_uid: sub.student_uid, class: sub.class, submissions: [] }
          acc[key].submissions.push(sub)
          return acc
        }, {})

      reportData = Object.values(groupedSubmissions).map((group: any) => {
        const student = students.find((s: any) => s.uid === group.student_uid)
        const approval = approvals.find((a: any) => a.student_uid === group.student_uid && a.class?.toUpperCase() === selectedClass.toUpperCase())

        // Count documents submitted
        const documentsSubmitted = {
          completion_letter: group.submissions.some((s: any) => s.document_type === 'completion_letter'),
          outcome_form: group.submissions.some((s: any) => s.document_type === 'outcome_form'),
          feedback_form: group.submissions.some((s: any) => s.document_type === 'feedback_form'),
          video_presentation: group.submissions.some((s: any) => s.document_type === 'video_presentation')
        }

        const documentsCount = Object.values(documentsSubmitted).filter(Boolean).length

        return {
          uid: group.student_uid,
          name: student?.name || group.student_uid,
          class: group.submissions[0]?.class || selectedClass,
          status: approval?.approval_status || 'Pending',
          credits: approval?.credits_allotted || 0,
          documentsSubmitted: `${documentsCount}/4`,
          completionLetter: documentsSubmitted.completion_letter ? 'Yes' : 'No',
          outcomeForm: documentsSubmitted.outcome_form ? 'Yes' : 'No',
          feedbackForm: documentsSubmitted.feedback_form ? 'Yes' : 'No',
          videoPresentation: documentsSubmitted.video_presentation ? 'Yes' : 'No'
        } as any
      })
    } else {
      // Fetch from database (for LandingPage)
      const { data: studentsData = [] } = await supabase.from('students').select('uid, name, class')
      const { data: submissionsData = [] } = await supabase.from('field_project_submissions').select('id, student_uid, class, document_type, file_url, uploaded_at')
      const { data: approvalsData = [] } = await supabase.from('field_project_approvals').select('student_uid, class, approval_status, marks_allotted, credits_allotted')

      const groupedSubmissions = (submissionsData || [])
        .filter((sub: any) => sub.class === selectedClass)
        .reduce((acc: any, sub: any) => {
          const key = `${sub.student_uid}_${sub.class}`
          if (!acc[key]) acc[key] = { student_uid: sub.student_uid, class: sub.class, submissions: [] }
          acc[key].submissions.push(sub)
          return acc
        }, {})

      reportData = Object.values(groupedSubmissions).map((group: any) => {
        const student = (studentsData || []).find((s: any) => s.uid === group.student_uid)
        const approval = (approvalsData || []).find((a: any) => a.student_uid === group.student_uid && a.class === group.class)
        return {
          uid: group.student_uid,
          name: student?.name || group.student_uid,
          status: approval?.approval_status || 'Pending',
          marks: approval?.marks_allotted || 0,
          credits: approval?.credits_allotted || 0
        }
      }).sort((a, b) => {
        const aLastDigits = parseInt(a.uid.slice(-2)) || 0
        const bLastDigits = parseInt(b.uid.slice(-2)) || 0
        return aLastDigits - bLastDigits
      })
    }

    exportFPReport(reportData)
  }

  const generateCEPReport = async (selectedClass: string) => {
    let reportData: CEPReportRow[]

    if (requirements.length > 0 && students.length > 0 && submissions.length > 0 && approvals.length > 0) {
      // Use passed data (from components like CommunityEngagement)
      const req = requirements.find((r: any) => r.assigned_class?.toUpperCase() === selectedClass.toUpperCase())
      const creditConfig = req?.credits_config || []

      const studentMap: Record<string, { name: string; class: string; hours: number; activities: number }> = {}
      students
        .filter((s: any) => s.class?.toUpperCase() === selectedClass.toUpperCase())
        .forEach((s: any) => {
          const studentSubs = submissions.filter((sub: any) => sub.student_uid === s.uid)
          const hours = studentSubs.reduce((sum: number, sub: any) => sum + sub.hours, 0)
          const activities = studentSubs.length
          studentMap[s.uid] = { name: s.name, class: s.class, hours, activities }
        })

      reportData = Object.entries(studentMap).map(([uid, { name, class: studentClass, hours, activities }]) => {
        let credits = 0
        if (creditConfig.length > 0) {
          const sortedConfig = [...creditConfig].sort((a: any, b: any) => b.hours - a.hours)
          for (const condition of sortedConfig) {
            if (hours >= condition.hours) {
              credits = condition.credits
              break
            }
          }
        }

        const approval = approvals.find((a: any) => a.student_uid === uid && a.class?.toUpperCase() === selectedClass.toUpperCase())
        const status = approval?.approval_status || 'Pending'

        return {
          uid,
          name,
          class: studentClass,
          hoursCompleted: hours,
          activitiesSubmitted: activities,
          creditsAllocated: credits,
          status: status.charAt(0).toUpperCase() + status.slice(1),
          minimumHours: req?.minimum_hours || 0,
          progress: req ? `${Math.min((hours / req.minimum_hours) * 100, 100).toFixed(1)}%` : 'N/A'
        }
      })
    } else {
      // Fetch from database (for LandingPage)
      const { data: requirementsData = [] } = await supabase.from('cep_requirements').select('*')
      const { data: studentsData = [] } = await supabase.from('students').select('uid, name, class')
      const { data: submissionsData = [] } = await supabase.from('cep_submissions').select('student_uid, hours')

      const req = (requirementsData || []).find((r: any) => r.assigned_class === selectedClass)
      const creditConfig = req?.credits_config || []
      const studentMap: Record<string, { name: string; hours: number }> = {}

      ;(studentsData || [])
        .filter((s: any) => s.class === selectedClass)
        .forEach((s: any) => {
          const studentSubs = (submissionsData || []).filter((sub: any) => sub.student_uid === s.uid)
          const hours = studentSubs.reduce((sum: number, sub: any) => sum + sub.hours, 0)
          studentMap[s.uid] = { name: s.name, hours }
        })

      reportData = Object.entries(studentMap).map(([uid, { name, hours }]) => {
        let credits = 0
        if (creditConfig.length > 0) {
          const sortedConfig = [...creditConfig].sort((a: any, b: any) => b.hours - a.hours)
          for (const condition of sortedConfig) {
            if (hours >= condition.hours) {
              credits = condition.credits
              break
            }
          }
        }
        return {
          uid,
          name,
          hoursCompleted: hours,
          creditsAllocated: credits
        }
      })
    }

    exportCEPReport(reportData)
  }

  const generateAttendanceReport = async (selectedClass: string) => {
    let rows: any[][]

    if (activities.length > 0 && students.length > 0 && attendanceRecords.length > 0) {
      // Use passed data (from components like Attendance)
      const classActivities = activities
        .filter((a: any) => Array.isArray(a.assigned_class) && a.assigned_class.some((cls: any) => cls.toUpperCase() === selectedClass.toUpperCase()))
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''))

      const classStudents = students.filter((s: any) => s.class?.toUpperCase() === selectedClass.toUpperCase())

      const header = ['uid', 'name', ...classActivities.map((a: any) => a.activity_name), 'Total CC Points']
      rows = [header]

      const attendanceKey = (aid: number, uid: string) => `${aid}__${uid}`
      const attendanceMap = new Map<string, 'present' | 'absent'>()
      for (const rec of attendanceRecords) {
        attendanceMap.set(attendanceKey(rec.activity_id, rec.student_uid), rec.attendance_status)
      }

      for (const student of classStudents) {
        let totalPoints = 0
        const row: any[] = [student.uid, student.name]
        for (const act of classActivities) {
          const status = attendanceMap.get(attendanceKey(act.id as number, student.uid))
          const present = status === 'present' ? 1 : 0
          row.push(present)
          if (present === 1) {
            totalPoints += typeof act.cc_points === 'number' ? act.cc_points : 0
          }
        }
        row.push(totalPoints)
        rows.push(row)
      }
    } else {
      // Fetch from database (for LandingPage)
      const { data: activitiesData = [] } = await supabase.from('co_curricular_activities').select('*')
      const { data: studentsData = [] } = await supabase.from('students').select('uid, name, class')
      const { data: attendanceRecordsData = [] } = await supabase.from('co_curricular_attendance').select('activity_id, student_uid, attendance_status')

      const classActivities = (activitiesData || [])
        .filter((a: any) => Array.isArray(a.assigned_class) && a.assigned_class.includes(selectedClass))
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''))
      const classStudents = (studentsData || []).filter((s: any) => s.class === selectedClass)
      const header = ['uid', 'name', ...classActivities.map((a: any) => a.activity_name), 'Total CC Points']
      rows = [header]
      const attendanceKey = (aid: number, uid: string) => `${aid}__${uid}`
      const attendanceMap = new Map<string, 'present' | 'absent'>()
      for (const rec of (attendanceRecordsData || [])) {
        attendanceMap.set(attendanceKey(rec.activity_id, rec.student_uid), rec.attendance_status)
      }
      for (const student of classStudents) {
        let totalPoints = 0
        const row = [student.uid, student.name]
        for (const activity of classActivities) {
          const status = attendanceMap.get(attendanceKey(activity.id, student.uid))
          if (status === 'present') {
            row.push('Present')
            totalPoints += activity.cc_points || 0
          } else if (status === 'absent') {
            row.push('Absent')
          } else {
            row.push('-')
          }
        }
        row.push(totalPoints)
        rows.push(row)
      }
      rows.sort((a, b) => {
        if (a === header) return -1
        if (b === header) return 1
        const aLastDigits = parseInt(a[0].slice(-2)) || 0
        const bLastDigits = parseInt(b[0].slice(-2)) || 0
        return aLastDigits - bLastDigits
      })
    }

    exportAttendanceReport(rows, `${selectedClass} Attendance`, `attendance_${selectedClass}.xlsx`)
  }

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      style={style}
    >
      {children}
    </Button>
  )
}
