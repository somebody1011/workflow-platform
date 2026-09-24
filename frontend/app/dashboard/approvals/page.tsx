"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Filter, Check, X, MoreHorizontal, Loader2, ChevronRight } from "lucide-react"
import { listApprovalRequests, getApprovalRequest, submitApprovalAction, listApprovalActions, type ApprovalRequest } from "@/lib/api/approval-requests"
import { useAuth } from "@/app/auth/AuthProvider"
import type { WorkflowStep } from "@/types/workflow"
import { listRoles, listDepartments, listOrganizationMembers, type OrganizationMember } from "@/lib/api/organization-members"

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function ApprovalsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("id")
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actingId, setActingId] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [actions, setActions] = useState<ApprovalRequest["actions"]>([])
  const [actingError, setActingError] = useState<string | null>(null)
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])

  const fetchApprovals = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listApprovalRequests()
      setApprovals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch approval requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSelectedApproval(null)
      setActions([])
      setRoles([])
      setDepartments([])
      setMembers([])
      return
    }

    const fetchDetail = async () => {
      setDetailLoading(true)
      setError(null)
      try {
        const [detail, actionHistory] = await Promise.all([
          getApprovalRequest(selectedId),
          listApprovalActions(selectedId),
        ])
        setSelectedApproval(detail)
        setActions(actionHistory)
        if (detail?.organizationId) {
          const [rolesData, departmentsData, membersData] = await Promise.all([
            listRoles(detail.organizationId),
            listDepartments(detail.organizationId),
            listOrganizationMembers(detail.organizationId),
          ])
          setRoles(rolesData)
          setDepartments(departmentsData)
          setMembers(membersData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch approval detail")
      } finally {
        setDetailLoading(false)
      }
    }

    fetchDetail()
  }, [selectedId])

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActingId(id)
    setActingError(null)
    try {
      await submitApprovalAction(id, { action, comment: comment || undefined })
      setComment("")
      await Promise.all([fetchApprovals(), listApprovalActions(id).then(setActions)])
      const updated = await getApprovalRequest(id)
      setSelectedApproval(updated)
    } catch (err) {
      setActingError(err instanceof Error ? err.message : "Failed to submit action")
    } finally {
      setActingId(null)
    }
  }

  const filtered = approvals.filter((approval) => {
    const title = approval.document?.originalName ?? approval.document?.name ?? ""
    const submittedBy = approval.submittedByUser ? `${approval.submittedByUser.firstName} ${approval.submittedByUser.lastName}` : ""
    const query = search.toLowerCase()
    const matchesSearch = title.toLowerCase().includes(query) || submittedBy.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || approval.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isAuthorizedForStep = (step: WorkflowStep | undefined): boolean => {
    if (!step || !user) return false
    if (step.approverType === "user") {
      return step.approverUserId === user.id
    }
    const member = members.find((candidate) => candidate.userId === user.id && candidate.status === "Active")
    if (!member) return false
    if (step.approverType === "role") return member.roleId === step.approverRoleId
    if (step.approverType === "department") return member.departmentId === step.departmentId
    return false
  }

  const getApproverLabel = (step: WorkflowStep | undefined): string => {
    if (!step) return "Unknown"
    if (step.approverType === "user") {
      if (step.approverUserId === user?.id) return "You"
      return "Specific user"
    }
    if (step.approverType === "role") {
      const role = roles.find((r) => r.id === step.approverRoleId)
      return role ? `Role: ${role.name}` : `Role: ${step.approverRoleId ?? "unknown"}`
    }
    if (step.approverType === "department") {
      const dept = departments.find((d) => d.id === step.departmentId)
      return dept ? `Department: ${dept.name}` : `Department: ${step.departmentId ?? "unknown"}`
    }
    return "Unknown"
  }

  const totalSteps = selectedApproval?.workflow?.steps?.length ?? 0
  const completedActions = actions.filter((a) => a.action === "approve").length
  const progress = totalSteps > 0 ? Math.round((completedActions / totalSteps) * 100) : 0

  const currentStep = selectedApproval?.workflow?.steps?.find((s) => s.stepOrder === selectedApproval.currentStep)
  const canAct =
    !!selectedApproval &&
    !!currentStep &&
    (selectedApproval.status === "pending" || selectedApproval.status === "inprogress") &&
    !actions.some((a) => a.stepNumber === currentStep.stepOrder && a.action === "approve") &&
    !actions.some((a) => a.stepNumber === currentStep.stepOrder && a.action === "reject") &&
    isAuthorizedForStep(currentStep)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Approvals</h1>
        <p className="text-muted-foreground">{approvals.filter((a) => a.status === "pending").length} documents require your attention</p>
      </div>

      {error && (
        <Card className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-auto font-medium">Dismiss</button>
          </div>
        </Card>
      )}

      {selectedApproval ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-1">
            <h3 className="font-semibold mb-4">Document</h3>
            {detailLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">{selectedApproval.document?.originalName ?? selectedApproval.document?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedApproval.document?.name ? `${selectedApproval.document.name}` : ""}
                  </p>
                  {selectedApproval.document?.url && (
                    <a
                      href={selectedApproval.document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Open Document
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Submitted by</p>
                  <p className="text-sm font-medium">
                    {selectedApproval.submittedByUser ? `${selectedApproval.submittedByUser.firstName} ${selectedApproval.submittedByUser.lastName}` : "Unknown"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[selectedApproval.status] || "bg-muted text-muted-foreground"}`}>
                    {selectedApproval.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Workflow</p>
                  <p className="text-sm font-medium">{selectedApproval.workflow?.name ?? "Unknown"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{completedActions} of {totalSteps} steps completed</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Approval Progress</h3>
            {!selectedApproval ? null : detailLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  {selectedApproval.workflow?.steps?.map((step, index) => {
                    const stepActions = actions.filter((a) => a.stepNumber === step.stepOrder)
                    const approvedAction = stepActions.find((a) => a.action === "approve")
                    const rejectedAction = stepActions.find((a) => a.action === "reject")
                    const isCurrentStep = selectedApproval.currentStep === step.stepOrder && (selectedApproval.status === "pending" || selectedApproval.status === "inprogress")
                    const isCompleted = !!approvedAction
                    const isRejected = !!rejectedAction
                    const canAct = isCurrentStep && !isCompleted && !isRejected && isAuthorizedForStep(step)

                    return (
                      <div key={step.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${isRejected ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30" : isCompleted ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-950/30" : isCurrentStep ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"
                              }`}
                          >
                            {isCompleted ? <Check className="h-5 w-5" /> : isRejected ? <X className="h-5 w-5" /> : <span className="text-xs font-medium">{step.stepOrder}</span>}
                          </div>
                          {index < (selectedApproval.workflow?.steps?.length ?? 0) - 1 && (
                            <div className={`h-12 w-0.5 ${isCompleted ? "bg-green-500" : "border-border"}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{getApproverLabel(step)}</p>
                              <p className="text-xs text-muted-foreground">
                                {approvedAction
                                  ? `Approved by ${approvedAction.actor ? `${approvedAction.actor.firstName} ${approvedAction.actor.lastName}` : "Unknown"}`
                                  : rejectedAction
                                    ? `Rejected by ${rejectedAction.actor ? `${rejectedAction.actor.firstName} ${rejectedAction.actor.lastName}` : "Unknown"}`
                                    : isCurrentStep
                                      ? canAct
                                        ? "Waiting for your approval"
                                        : "Waiting for approval"
                                      : "Not started"}
                              </p>
                            </div>
                            {approvedAction?.createdAt && (
                              <span className="text-xs text-muted-foreground">{new Date(approvedAction.createdAt).toLocaleDateString()}</span>
                            )}
                            {rejectedAction?.createdAt && (
                              <span className="text-xs text-muted-foreground">{new Date(rejectedAction.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          {approvedAction?.comment && (
                            <p className="mt-2 text-xs text-muted-foreground italic">"{approvedAction.comment}"</p>
                          )}
                          {rejectedAction?.comment && (
                            <p className="mt-2 text-xs text-muted-foreground italic">"{rejectedAction.comment}"</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-sm font-medium">Comments</h4>
                  {actions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No comments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {actions
                        .filter((a) => a.comment)
                        .map((action) => (
                          <div key={action.id} className="rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{action.actor ? `${action.actor.firstName} ${action.actor.lastName}` : "Unknown"}</p>
                              <span className="text-xs text-muted-foreground">{new Date(action.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">"{action.comment}"</p>
                          </div>
                        ))}
                    </div>
                  )}
                  {(selectedApproval.status === "pending" || selectedApproval.status === "inprogress") && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="h-20 w-full rounded-lg border border-border bg-transparent p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                </div>

                {(selectedApproval.status === "pending" || selectedApproval.status === "inprogress") && (
                  <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={() => handleAction(selectedApproval.id, "reject")}
                      disabled={actingId === selectedApproval.id || !canAct}
                    >
                      {actingId === selectedApproval.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                      Reject
                    </Button>
                    <Button onClick={() => handleAction(selectedApproval.id, "approve")} disabled={actingId === selectedApproval.id || !canAct}>
                      {actingId === selectedApproval.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                  </div>
                )}
                {actingError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                    {actingError}
                    <button onClick={() => setActingError(null)} className="ml-auto font-medium">Dismiss</button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search approvals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-transparent px-3 py-1 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading approvals...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {approvals.length === 0 ? "No approval requests yet." : "No approvals match your search."}
              </div>
            ) : (
              filtered.map((approval) => {
                const isPending = approval.status === "pending"
                return (
                  <div
                    key={approval.id}
                    className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${selectedId === approval.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.set("id", approval.id)
                      window.history.pushState({}, "", url)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{approval.document?.originalName ?? approval.document?.name ?? "Unknown document"}</p>
                        <p className="text-sm text-muted-foreground">
                          by {approval.submittedByUser ? `${approval.submittedByUser.firstName} ${approval.submittedByUser.lastName}` : "Unknown"} · Step {approval.currentStep}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{new Date(approval.createdAt).toLocaleDateString()}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[approval.status] || "bg-muted text-muted-foreground"}`}>
                          {approval.status}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}
