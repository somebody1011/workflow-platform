"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Download,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/app/auth/AuthProvider"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/v1/organizations", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setOrganizations(data)
          const personalOrg = data.find((org: Organization) => org.type === "personal")
          if (personalOrg) {
            setSelectedOrgId(personalOrg.id)
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

  const refreshOrganizations = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/organizations", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        const personalOrg = data.find((org: Organization) => org.type === "personal")
        if (personalOrg) {
          setSelectedOrgId(personalOrg.id)
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

      const response = await fetch("http://localhost:5000/api/v1/documents/upload", {
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
      setDocuments((prev) => [data, ...prev])
      refreshOrganizations()
    } catch {
      setUploadError("Unable to reach the server. Please try again.")
    } finally {
      setUploading(false)
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
              {documents.length === 0 ? (
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
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatSize(doc.size)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                            aria-label={`View ${doc.originalName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        {doc.url && (
                          <a
                            href={doc.url}
                            download={doc.originalName}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                            aria-label={`Download ${doc.originalName}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
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
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-green-900/30 dark:text-yellow-400",
    archived: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}
