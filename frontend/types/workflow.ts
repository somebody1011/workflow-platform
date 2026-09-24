export type WorkflowStatus = "active" | "inactive" | "pending" | "approved" | "rejected"

export type ApproverType = "user" | "role" | "department"

export interface WorkflowStep {
  id: string
  stepOrder: number
  approverType: ApproverType
  approverRoleId: string | null
  approverUserId: string | null
  departmentId: string | null
}

export interface Workflow {
  id: string
  organizationId: string
  name: string
  documentType: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  steps: WorkflowStep[]
}

export interface CreateWorkflowPayload {
  name: string
  documentType: string
  steps: Omit<WorkflowStep, "id">[]
}

export interface UpdateWorkflowPayload {
  name?: string
  documentType?: string
  status?: string
  steps?: Omit<WorkflowStep, "id">[]
}
