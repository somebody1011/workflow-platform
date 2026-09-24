import type { ApprovalRequest, CreateApprovalRequestPayload, SubmitApprovalActionPayload } from "@/types/approval"

export type { ApprovalRequest }

import { API_BASE } from "./config"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || "Request failed")
  }
  return response.json()
}

export async function listApprovalRequests(): Promise<ApprovalRequest[]> {
  const response = await fetch(`${API_BASE}/api/v1/approval-requests`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<ApprovalRequest[]>(response)
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE}/api/v1/approval-requests/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<ApprovalRequest>(response)
}

export async function createApprovalRequest(payload: CreateApprovalRequestPayload): Promise<ApprovalRequest> {
  const response = await fetch(`${API_BASE}/api/v1/approval-requests`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<ApprovalRequest>(response)
}

export async function submitApprovalAction(id: string, payload: SubmitApprovalActionPayload): Promise<ApprovalRequest["actions"][number]> {
  const response = await fetch(`${API_BASE}/api/v1/approval-requests/${encodeURIComponent(id)}/actions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<ApprovalRequest["actions"][number]>(response)
}

export async function listApprovalActions(id: string): Promise<ApprovalRequest["actions"]> {
  const response = await fetch(`${API_BASE}/api/v1/approval-requests/${encodeURIComponent(id)}/actions`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<ApprovalRequest["actions"]>(response)
}
