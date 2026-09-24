"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileType2,
  Send,
} from "lucide-react"
import { useAuth } from "@/app/auth/AuthProvider"
import { API_BASE } from "@/lib/api/config"
import { listWorkflows } from "@/lib/api/workflows"
import { createApprovalRequest, listApprovalRequests } from "@/lib/api/approval-requests"

type Document = {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url?: string
  status: string
  createdAt?: string
}

type Organization = {
  id: string
  name: string
  type: string
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024

function getViewerType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType === "application/pdf") return "pdf"
  if (mimeType.startsWith("text/")) return "text"
  return "unsupported"
}

function canPreviewDocument(mimeType: string) {
  return getViewerType(mimeType) !== "unsupported"
}

function getDocumentUrl(doc: Document) {
  if (!doc.url) return null
  if (doc.url.includes("supabase.co")) {
    return `${API_BASE}/api/v1/documents/${doc.id}/download`
  }
  return doc.url
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [submittingDocId, setSubmittingDocId] = useState<string | null>(null)
  const [availableWorkflows, setAvailableWorkflows] = useState<{ id: string; name: string }[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [approvalStatuses, setApprovalStatuses] = useState<Record<string, { status: string; currentStep: number }>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/organizations`, {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setOrganizations(data)
          const nonPersonalOrg = data.find((org: Organization) => org.type !== "personal")
          if (nonPersonalOrg) {
            setSelectedOrgId(nonPersonalOrg.id)
          } else if (data.length > 0) {
            setSelectedOrgId(data[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error)
      } finally {
        setLoadingOrgs(false)
      }
    }

    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (!selectedOrgId) return
    fetchDocuments()
    fetchApprovalStatuses()
  }, [selectedOrgId])

  useEffect(() => {
    const onFocus = () => {
      if (selectedOrgId) fetchApprovalStatuses()
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [selectedOrgId])

  const fetchDocuments = async () => {
    if (!selectedOrgId) return
    setLoadingDocs(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/documents?organizationId=${encodeURIComponent(selectedOrgId)}`, {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoadingDocs(false)
    }
  }

  const refreshOrganizations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/organizations`, {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        const nonPersonalOrg = data.find((org: Organization) => org.type !== "personal")
        if (nonPersonalOrg) {
          setSelectedOrgId(nonPersonalOrg.id)
        } else if (data.length > 0) {
          setSelectedOrgId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to refresh organizations:", error)
    }
  }

  const handleFile = async (file: File) => {
    setUploadError(null)
    setUploadSuccess(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`File type "${file.type}" is not allowed`)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      return
    }

    if (file.size === 0) {
      setUploadError("Empty file is not allowed")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (selectedOrgId) {
        formData.append("organizationId", selectedOrgId)
      }

      const response = await fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        setUploadError(data.error || "Failed to upload document")
        return
      }

      setUploadSuccess(`"${data.originalName}" uploaded successfully`)
      refreshDocuments()
      refreshOrganizations()
    } catch {
      setUploadError("Unable to reach the server. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        setUploadError(data.error || "Failed to delete document")
        return
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
      setDeletingDocId(null)
    } catch {
      setUploadError("Unable to reach the server. Please try again.")
    }
  }

  const refreshDocuments = async () => {
    if (!selectedOrgId) return
    try {
      const response = await fetch(`${API_BASE}/api/v1/documents?organizationId=${encodeURIComponent(selectedOrgId)}`, {
        method: "GET",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to refresh documents:", error)
    }
  }

  const fetchApprovalStatuses = async () => {
    if (!selectedOrgId) return
    try {
      const response = await fetch(`${API_BASE}/api/v1/approval-requests?organizationId=${encodeURIComponent(selectedOrgId)}`, {
        method: "GET",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        const statusMap: Record<string, { status: string; currentStep: number }> = {}
        for (const request of data) {
          statusMap[request.documentId] = {
            status: request.status,
            currentStep: request.currentStep,
          }
        }
        setApprovalStatuses(statusMap)
      }
    } catch (error) {
      console.error("Failed to fetch approval statuses:", error)
    }
  }

  const openSubmitModal = async (docId: string) => {
    setSubmittingDocId(docId)
    setSelectedWorkflowId("")
    setSubmitError(null)
    setAvailableWorkflows([])
    try {
      const workflows = await listWorkflows()
      setAvailableWorkflows(workflows.map((w) => ({ id: w.id, name: w.name })))
    } catch {
      setSubmitError("Failed to load workflows")
    }
  }

  const handleSubmitForApproval = async () => {
    if (!submittingDocId || !selectedWorkflowId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createApprovalRequest({
        workflowId: selectedWorkflowId,
        documentId: submittingDocId,
      })
      setSubmittingDocId(null)
      setAvailableWorkflows([])
      setSelectedWorkflowId("")
      await fetchApprovalStatuses()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit for approval")
    } finally {
      setSubmitting(false)
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and track all your documents in one place.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="organization" className="text-sm font-medium">Upload to:</label>
          {loadingOrgs ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : (
            <select
              id="organization"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="h-9 rounded-md border border-border bg-transparent px-3 py-1 text-sm"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.type === "personal" ? "(Personal)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-primary bg-muted/50" : "border-border hover:border-muted-foreground/50"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? "Uploading..." : "Drag and drop files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedOrg ? `Uploading to: ${selectedOrg.name}` : "Select a destination above"} · PDF, Word, Excel, PowerPoint, images, text, CSV up to 50MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onInputChange}
            accept={ALLOWED_TYPES.join(",")}
            disabled={uploading}
          />
        </div>

        {uploadError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {uploadError}
            <button onClick={() => setUploadError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {uploadSuccess}
            <button onClick={() => setUploadSuccess(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingDocs ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No documents uploaded yet. Upload your first document above.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.originalName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{user?.firstName} {user?.lastName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} approvalStatus={approvalStatuses[doc.id]} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatSize(doc.size)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingDoc(doc)}
                          aria-label="View"
                          disabled={!doc.url || !canPreviewDocument(doc.mimeType)}
                        >
                          <Eye className={`h-4 w-4 ${!doc.url || !canPreviewDocument(doc.mimeType) ? "opacity-30" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Download"
                          onClick={() => {
                             window.location.href = `${API_BASE}/api/v1/documents/${doc.id}/download`
                          }}
                          disabled={!doc.url}
                        >
                          <Download className={`h-4 w-4 ${!doc.url ? "opacity-30" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingDocId(doc.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          onClick={() => openSubmitModal(doc.id)}
                          aria-label="Submit for approval"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewingDoc(null)}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{viewingDoc.originalName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatSize(viewingDoc.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingDoc(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex max-h-[calc(90vh-56px)] items-center justify-center overflow-auto bg-muted/40 p-4">
              {viewingDoc.url ? (
                <DocumentPreview doc={viewingDoc} />
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-white p-8 text-center">
                  <FileType2 className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Preview unavailable</p>
                  <p className="text-xs text-muted-foreground">
                    The file URL is missing. Please delete and re-upload this document to view it.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deletingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeletingDocId(null)}>
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Delete document</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingDocId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletingDocId && handleDelete(deletingDocId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {submittingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSubmittingDocId(null)}>
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Submit for approval</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a workflow to start the approval process for this document.
            </p>
            {submitError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                {submitError}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Workflow</label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Select a workflow</option>
                {availableWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              {availableWorkflows.length === 0 && !submitError && (
                <p className="text-xs text-muted-foreground">No workflows available. Create one first.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmittingDocId(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitForApproval} disabled={submitting || !selectedWorkflowId}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentPreview({ doc }: { doc: Document }) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)

  const resolvedUrl = getDocumentUrl(doc)

  useEffect(() => {
    if (doc.mimeType.startsWith("text/") && resolvedUrl) {
      setLoadingText(true)
      setTextError(null)
      setTextContent(null)
      fetch(resolvedUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load file")
          return res.text()
        })
        .then((text) => {
          setTextContent(text)
        })
        .catch((err) => {
          setTextError(err.message)
        })
        .finally(() => {
          setLoadingText(false)
        })
    }
  }, [doc.mimeType, resolvedUrl])

  const viewerType = getViewerType(doc.mimeType)

  if (viewerType === "image") {
    return (
      <img
        src={resolvedUrl ?? doc.url}
        alt={doc.originalName}
        className="max-h-[calc(90vh-100px)] max-w-full rounded-md object-contain"
      />
    )
  }

  if (viewerType === "pdf") {
    return (
      <iframe
        src={resolvedUrl ?? doc.url}
        title={doc.originalName}
        className="h-[calc(90vh-100px)] w-full max-w-4xl rounded-md border border-border bg-white"
        allow="autoplay"
      />
    )
  }

  if (viewerType === "text") {
    return (
      <div className="max-h-[calc(90vh-100px)] w-full max-w-4xl overflow-auto rounded-md border border-border bg-white p-6">
        {loadingText && <p className="text-sm text-muted-foreground">Loading...</p>}
        {textError && <p className="text-sm text-red-600">{textError}</p>}
        {!loadingText && !textError && (
          <pre className="whitespace-pre-wrap break-words text-sm">{textContent}</pre>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-white p-8 text-center">
      <FileType2 className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm font-medium">Preview not available</p>
      <p className="text-xs text-muted-foreground">
        Open this file in a new tab to view its contents.
      </p>
      <div className="flex gap-2">
        {resolvedUrl && (
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open in new tab
          </a>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status, approvalStatus }: { status: string; approvalStatus?: { status: string; currentStep: number } }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    archived: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    inprogress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  const displayStatus = approvalStatus
    ? approvalStatus.status === "pending"
      ? "in_progress"
      : approvalStatus.status
    : status

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[displayStatus] || "bg-muted text-muted-foreground"}`}>
      {displayStatus}
    </span>
  )
}
