import type { WorkflowStep } from "./workflow"

export type ApprovalRequestStatus = "pending" | "inprogress" | "approved" | "rejected"

export interface WorkflowSummary {
  id: string
  name: string
  documentType: string
  steps: WorkflowStep[]
}

export interface DocumentSummary {
  id: string
  name: string
  originalName: string
  url: string
}

export interface SubmittedByUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface ApprovalAction {
  id: string
  action: string
  comment: string | null
  stepNumber: number
  createdAt: string
  actor: SubmittedByUser | null
}

export interface ApprovalRequest {
  id: string
  workflowId: string
  documentId: string
  organizationId: string
  submittedBy: string
  status: ApprovalRequestStatus
  currentStep: number
  createdAt: string
  updatedAt: string
  workflow: WorkflowSummary | null
  document: DocumentSummary | null
  submittedByUser: SubmittedByUser | null
  actions: ApprovalAction[]
}

export interface CreateApprovalRequestPayload {
  workflowId: string
  documentId: string
}

export interface SubmitApprovalActionPayload {
  action: "approve" | "reject"
  comment?: string
  stepNumber?: number
}
