import React, { useState, useEffect } from 'react'
import { UserRole } from '../types'
import { supabase } from '../lib/supabase'
// Excel export functionality is now handled by ExcelReportButton component
import { Section, Card, Button, Modal, colors } from './UI'
import ExcelReportButton from './ExcelReportButton'

interface FieldProjectProps {
  role: UserRole
  studentUid?: string
  studentClass?: string
}

interface Submission {
  id: string
  student_uid: string
  class: string
  document_type: string
  file_url: string
  uploaded_at: string
}

interface StudentData {
  uid: string
  name: string
  class: string
}

interface FPApproval {
  id: string
  student_uid: string
  class: string
  approval_status: string
  credits_allotted: number
  evaluated_by: string
  evaluated_at: string
  evaluation_notes: string
}

export default function FieldProject({ role, studentUid = '', studentClass = '' }: FieldProjectProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [students, setStudents] = useState<StudentData[]>([])
  const [approvals, setApprovals] = useState<FPApproval[]>([])
  const [filters, setFilters] = useState({
    class: '',
    uid: '',
    name: ''
  })

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [evaluationModal, setEvaluationModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<{ uid: string; name: string; class: string } | null>(null)
  const [evaluationData, setEvaluationData] = useState({
    approval_status: 'pending',
    credits_allotted: 0,
    evaluation_notes: ''
  })

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())

  const documentTypes = [
    { label: 'Completion Letter', type: 'completion_letter', accept: '.pdf,image/*' },
    { label: 'Outcome Form', type: 'outcome_form', accept: '.pdf,image/*' },
    { label: 'Feedback Form', type: 'feedback_form', accept: '.pdf,image/*' },
    { label: 'Final Video Demonstration', type: 'video_presentation', accept: 'video/*' },
  ]

  const typeToLabel = Object.fromEntries(documentTypes.map(({ type, label }) => [type, label]))

  const getPublicHref = (rawUrl: string | undefined | null) => {
    if (!rawUrl) return ''
    return rawUrl.trim().replace(/^@+/, '')
  }

  const extractStoragePathFromPublicUrl = (url: string) => {
    try {
      const clean = getPublicHref(url)
      const u = new URL(clean)
      const prefix = '/storage/v1/object/public/'
      const idx = u.pathname.indexOf(prefix)
      if (idx === -1) return ''
      const remainder = u.pathname.substring(idx + prefix.length)
      const bucketPrefix = 'student-submissions/'
      if (!remainder.startsWith(bucketPrefix)) return ''
      const path = remainder.substring(bucketPrefix.length)
      return decodeURIComponent(path)
    } catch {
      return ''
    }
  }

  const resolveSignedOrPublic = async (publicUrl: string) => {
    const path = extractStoragePathFromPublicUrl(publicUrl)
    if (!path) return getPublicHref(publicUrl)
    try {
      const { data } = await supabase.storage
        .from('student-submissions')
        .createSignedUrl(path, 120)
      return data?.signedUrl || getPublicHref(publicUrl)
    } catch {
      return getPublicHref(publicUrl)
    }
  }

  useEffect(() => {
    if (role === 'student' && studentUid) {
      fetchStudentSubmissions()
      fetchStudentApproval()
    } else if (role === 'teacher') {
      fetchAllSubmissions()
      fetchStudents()
      fetchAllApprovals()
    }
  }, [role, studentUid])

  // Fix: Implement fetchAllSubmissions for teacher view
  const fetchAllSubmissions = async () => {
    const { data, error } = await supabase
      .from('field_project_submissions')
      .select('*')
      .order('uploaded_at', { ascending: false })
    if (!error) setSubmissions(data || [])
  }

  const fetchStudentSubmissions = async () => {
    if (!studentUid) return

    const { data, error } = await supabase
      .from('field_project_submissions')
      .select('*')
      .eq('student_uid', studentUid)
      .order('uploaded_at', { ascending: false })

    if (!error) setSubmissions(data || [])
  }

  const fetchStudentApproval = async () => {
    if (!studentUid) return
    const { data, error } = await supabase
      .from('field_project_approvals')
      .select('*')
      .eq('student_uid', studentUid)
      .single()
    if (!error && data) {
      setApprovals([data])
    }
  }

  const fetchAllApprovals = async () => {
    const { data, error } = await supabase
      .from('field_project_approvals')
      .select('*')
      .order('evaluated_at', { ascending: false })

    if (!error) setApprovals(data || [])
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('uid, name, class')
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

  const handleFileUpload = async (file: File, type: string) => {
    if (role !== 'student' || !studentUid) {
      alert('Upload only available for students')
      return
    }

    setUploading(prev => ({ ...prev, [type]: true }))
    try {
      // Compose filePath for upload
      const filePath = `field_project/${studentUid}/${type}_${Date.now()}_${file.name}`
      const { error: storageError } = await supabase.storage
        .from('student-submissions')
        .upload(filePath, file)
      if (storageError) {
        throw new Error(`Upload failed: ${storageError.message}`)
      }
      const { data: { publicUrl } } = supabase.storage
        .from('student-submissions')
        .getPublicUrl(filePath)
      const { error: insertError } = await supabase
        .from('field_project_submissions')
        .insert([{
          student_uid: studentUid,
          class: studentClass,
          document_type: type,
          file_url: publicUrl,
        }])
      if (insertError) {
        throw new Error(`Failed to save submission: ${insertError.message}`)
      }
      alert(`${typeToLabel[type]} uploaded successfully!`)
      await fetchStudentSubmissions()
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleDelete = async (submissionId: string, type: string) => {
    const confirmMessage = `Are you sure you want to delete this ${typeToLabel[type]}?`
    if (!confirm(confirmMessage)) return

    try {
      const submission = submissions.find(s => s.id === submissionId)
      const { error } = await supabase
        .from('field_project_submissions')
        .delete()
        .eq('id', submissionId)
      if (error) throw new Error(`Failed to delete submission: ${error.message}`)

      if (submission?.file_url) {
        try {
          // Extract filePath from public URL
          const url = new URL(submission.file_url)
          const idx = url.pathname.indexOf('/field_project/')
          const filePath = idx !== -1 ? url.pathname.substring(idx + 1) : ''
          if (filePath) {
            await supabase.storage.from('student-submissions').remove([filePath])
          }
        } catch {
          // ignore storage cleanup failures
        }
      }

  alert('Submission deleted successfully!')
  if (role === 'student') await fetchStudentSubmissions()
  else await fetchAllSubmissions()
    } catch (error) {
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEvaluateStudent = async () => {
    if (!selectedStudent) return

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
    try {
      console.log('Evaluating FP student:', selectedStudent.uid, selectedStudent.class)

      // First, try to delete any existing record to avoid conflicts
      const { error: deleteError } = await supabase
        .from('field_project_approvals')
        .delete()
        .eq('student_uid', selectedStudent.uid)
        .eq('class', selectedStudent.class)

      if (deleteError) {
        console.error('Delete error:', deleteError)
      }

      // Then insert the new record
      const { error: insertError } = await supabase
        .from('field_project_approvals')
        .insert([{
          student_uid: selectedStudent.uid,
          class: selectedStudent.class,
          approval_status: evaluationData.approval_status,
          credits_allotted: evaluationData.credits_allotted,
          evaluated_by: user.id,
          evaluated_at: new Date().toISOString(),
          evaluation_notes: evaluationData.evaluation_notes
        }])

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      await fetchAllApprovals()
      setEvaluationModal(false)
      setSelectedStudent(null)
      setEvaluationData({
        approval_status: 'pending',
        credits_allotted: 0,
        evaluation_notes: ''
      })
      alert('Evaluation submitted successfully!')
    } catch (error) {
      console.error('FP Evaluation error:', error)
      alert('Failed to submit evaluation')
    }
  }

  const openEvaluationModal = (student: { uid: string; name: string; class: string }) => {
    setSelectedStudent(student)
    const existingApproval = approvals.find(a => a.student_uid === student.uid && a.class === student.class)
    setEvaluationData({
      approval_status: existingApproval?.approval_status || 'pending',
      credits_allotted: existingApproval?.credits_allotted || 0,
      evaluation_notes: existingApproval?.evaluation_notes || ''
    })
    setEvaluationModal(true)
  }

  // Report generation logic is now handled by ExcelReportButton component

  const getStudentSubmission = (type: string) => submissions.find(sub => sub.document_type === type)

  const getStudentName = (uid: string) => {
    const student = students.find(s => s.uid === uid)
    return student ? student.name : uid
  }

  const getStudentApproval = (uid: string, studentClass: string) => {
    return approvals.find(a => a.student_uid === uid && a.class === studentClass)
  }

  const filteredSubmissions = submissions.filter(sub => {
    const student = students.find(s => s.uid === sub.student_uid)
    const matchesClass = !filters.class || sub.class === filters.class
    const matchesUid = !filters.uid || sub.student_uid.toLowerCase().includes(filters.uid.toLowerCase())
    const matchesName = !filters.name || (student && student.name.toLowerCase().includes(filters.name.toLowerCase()))
    return matchesClass && matchesUid && matchesName
  })

  const groupedSubmissions = filteredSubmissions.reduce((acc, sub) => {
    const key = `${sub.student_uid}_${sub.class}`
    if (!acc[key]) acc[key] = { student_uid: sub.student_uid, class: sub.class, submissions: [] as Submission[] }
    acc[key].submissions.push(sub)
    return acc
  }, {} as Record<string, { student_uid: string; class: string; submissions: Submission[] }>)

  const sortedGrouped = Object.values(groupedSubmissions).sort((a, b) => {
    if (a.class !== b.class) return a.class.localeCompare(b.class)
    const aLast = parseInt(a.student_uid.slice(-2)) || 0
    const bLast = parseInt(b.student_uid.slice(-2)) || 0
    return aLast - bLast
  })

  const openPreview = async (title: string, publicUrl: string) => {
    const resolved = await resolveSignedOrPublic(publicUrl)
    if (resolved.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      window.open(resolved, '_blank')
    } else {
      setPreviewTitle(title)
      setPreviewUrl(resolved)
      setPreviewOpen(true)
    }
  }

  if (role === 'student') {
    const studentApproval = approvals[0];
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16, color: 'var(--text)' }}>Field Project Uploads</h1>

        {studentApproval && studentApproval.approval_status !== 'pending' && (
          <Card style={{ marginBottom: 20, padding: 16, backgroundColor: studentApproval.approval_status === 'approved' ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
            <div style={{ fontWeight: 600, color: studentApproval.approval_status === 'approved' ? 'var(--success)' : 'var(--danger)' }}>
              Overall Status: {studentApproval.approval_status.charAt(0).toUpperCase() + studentApproval.approval_status.slice(1)}
            </div>
            {studentApproval.credits_allotted > 0 && (
              <div style={{ fontSize: 14, color: studentApproval.approval_status === 'approved' ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                Total Credits: {studentApproval.credits_allotted}
              </div>
            )}
            {studentApproval.evaluation_notes && (
              <div style={{ fontSize: 14, color: studentApproval.approval_status === 'approved' ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                Notes: {studentApproval.evaluation_notes}
              </div>
            )}
          </Card>
        )}

        <Section>
          {documentTypes.map(({ label, type, accept }) => {
            const existingSubmission = getStudentSubmission(type);
            const isUploading = uploading[type];
            return (
              <Card key={type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  {existingSubmission && <div style={{ fontSize: 12, color: 'var(--subtle-text)' }}>Uploaded on {new Date(existingSubmission.uploaded_at).toLocaleDateString()}</div>}
                </div>
                {existingSubmission ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {getPublicHref(existingSubmission.file_url) ? (
                      <Button onClick={async () => {
                        const url = await resolveSignedOrPublic(existingSubmission.file_url);
                        window.open(url, '_blank');
                      }}>View</Button>
                    ) : (
                      <Button variant="secondary" disabled>View</Button>
                    )}
                    <Button variant="danger" onClick={() => handleDelete(existingSubmission.id, type)}>Delete</Button>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <input
                      type="file"
                      accept={accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, type);
                      }}
                      disabled={isUploading}
                      style={{ marginBottom: 8 }}
                    />
                    {isUploading && <div style={{ color: 'var(--warning)', fontSize: 12 }}>Uploading...</div>}
                  </div>
                )}
              </Card>
            );
          })}
        </Section>

        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} noScroll>
          {previewUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={previewUrl} alt={previewTitle} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : previewUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video controls style={{ width: '100%', height: 'auto' }} src={previewUrl} />
          ) : (
            <iframe title="preview" src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} />
          )}
        </Modal>
      </div>
    )
  }

  // Teacher view
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, color: colors.text }}>Field Project Submissions</h1>
        <ExcelReportButton
          reportType="field_project"
          submissions={submissions}
          students={students}
          approvals={approvals}
        />
      </div>

      <Section title="Filters">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Class</label>
            <select
              value={filters.class}
              onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
              style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            >
              <option value="">All Classes</option>
              <option value="FYIT">FYIT</option>
              <option value="FYSD">FYSD</option>
              <option value="SYIT">SYIT</option>
              <option value="SYSD">SYSD</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Student UID</label>
            <input
              type="text"
              value={filters.uid}
              onChange={(e) => setFilters(prev => ({ ...prev, uid: e.target.value }))}
              placeholder="Search by UID"
              style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Student Name</label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Search by name"
              style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <Button variant="secondary" onClick={() => setFilters({ class: '', uid: '', name: '' })}>Clear Filters</Button>
          </div>
        </div>
      </Section>

      <div>
        {Object.keys(groupedSubmissions).length === 0 ? (
          <p style={{ textAlign: 'center', color: colors.subtleText, fontSize: 16 }}>
            No submissions found matching the current filters.
          </p>
        ) : (
          sortedGrouped.map(({ student_uid, class: studentClass, submissions: studentSubmissions }) => {
            const isExpanded = expandedStudents.has(`${student_uid}_${studentClass}`)
            const toggleExpanded = () => {
              setExpandedStudents(prev => {
                const newSet = new Set(prev)
                if (newSet.has(`${student_uid}_${studentClass}`)) {
                  newSet.delete(`${student_uid}_${studentClass}`)
                } else {
                  newSet.add(`${student_uid}_${studentClass}`)
                }
                return newSet
              })
            }
            const student = students.find(s => s.uid === student_uid)
            const approval = getStudentApproval(student_uid, studentClass)
            const hasAllSubmissions = studentSubmissions.length === documentTypes.length

            return (
              <Card key={`${student_uid}_${studentClass}`} style={{ marginBottom: 16 }}>
                <div style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: 8, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, color: colors.text, fontSize: 18 }}>
                        {getStudentName(student_uid)} ({student_uid})
                      </h3>
                      <p style={{ margin: '4px 0 0 0', color: colors.subtleText }}>Class: {studentClass}</p>
                      <p style={{ margin: '4px 0 0 0', color: colors.subtleText }}>
                        Submissions: {studentSubmissions.length}/{documentTypes.length}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Button variant="secondary" onClick={toggleExpanded}>
                        {isExpanded ? 'Collapse' : 'Expand'} Submissions
                      </Button>
                      {hasAllSubmissions && (
                        <Button
                          variant="primary"
                          onClick={() => openEvaluationModal({ uid: student_uid, name: student?.name || student_uid, class: studentClass })}
                        >
                          Evaluate Student
                        </Button>
                      )}

                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                    {studentSubmissions.map((submission) => (
                      <Card key={submission.id} style={{ backgroundColor: colors.bg }}>
                        <div style={{ fontWeight: 600, marginBottom: 6, color: colors.text }}>
                          {typeToLabel[submission.document_type] || submission.document_type}
                        </div>
                        <div style={{ fontSize: 12, color: colors.subtleText, marginBottom: 8 }}>
                          Uploaded: {new Date(submission.uploaded_at).toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {getPublicHref(submission.file_url) ? (
                            <Button onClick={async () => {
                              const url = await resolveSignedOrPublic(submission.file_url)
                              window.open(url, '_blank')
                            }}>View</Button>
                          ) : (
                            <Button variant="secondary" disabled>View</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                {approval && approval.approval_status !== 'pending' && (
                  <div style={{ marginTop: 12, padding: 12, backgroundColor: approval.approval_status === 'approved' ? '#d4edda' : '#f8d7da', borderRadius: 4 }}>
                    <div style={{ fontWeight: 600, color: approval.approval_status === 'approved' ? '#155724' : '#721c24' }}>
                      Evaluation: {approval.approval_status.charAt(0).toUpperCase() + approval.approval_status.slice(1)}
                    </div>
                    {approval.credits_allotted > 0 && (
                      <div style={{ fontSize: 14, color: approval.approval_status === 'approved' ? '#155724' : '#721c24', marginTop: 4 }}>
                        Total Credits: {approval.credits_allotted}
                      </div>
                    )}
                    {approval.evaluation_notes && (
                      <div style={{ fontSize: 14, color: approval.approval_status === 'approved' ? '#155724' : '#721c24', marginTop: 4 }}>
                        Notes: {approval.evaluation_notes}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Evaluation Modal */}
      <Modal open={evaluationModal} onClose={() => setEvaluationModal(false)} title="Evaluate Student Field Project" width={500}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Approval Status</label>
            <select
              value={evaluationData.approval_status}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, approval_status: e.target.value }))}
              style={{ width: '100%', padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Total Credits</label>
            <input
              type="number"
              min="0"
              value={evaluationData.credits_allotted}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, credits_allotted: parseInt(e.target.value) || 0 }))}
              style={{ width: '100%', padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: colors.subtleText }}>Evaluation Notes</label>
            <textarea
              value={evaluationData.evaluation_notes}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, evaluation_notes: e.target.value }))}
              rows={4}
              style={{ width: '100%', padding: 8, border: `1px solid ${colors.border}`, borderRadius: 8, resize: 'vertical' }}
              placeholder="Add evaluation notes..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEvaluationModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleEvaluateStudent}>Submit Evaluation</Button>
          </div>
        </div>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={previewTitle} noScroll>
        {previewUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={previewUrl} alt={previewTitle} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : previewUrl.match(/\.(mp4|webm|ogg)$/i) ? (
          <video controls style={{ width: '100%', height: 'auto' }} src={previewUrl} />
        ) : (
          <iframe title="preview" src={previewUrl} style={{ width: '100%', height: '70vh', border: 'none' }} />
        )}
      </Modal>
    </div>
  )
}
