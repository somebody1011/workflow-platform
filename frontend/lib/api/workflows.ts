import type { Workflow, CreateWorkflowPayload, UpdateWorkflowPayload, WorkflowStep } from "@/types/workflow"

export type { Workflow, WorkflowStep }

import { API_BASE } from "./config"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || "Request failed")
  }
  return response.json()
}

export async function listWorkflows(): Promise<Workflow[]> {
  const response = await fetch(`${API_BASE}/api/v1/workflows`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<Workflow[]>(response)
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/api/v1/workflows/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<Workflow>(response)
}

export async function createWorkflow(payload: CreateWorkflowPayload): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/api/v1/workflows`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<Workflow>(response)
}

export async function updateWorkflow(id: string, payload: UpdateWorkflowPayload): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/api/v1/workflows/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<Workflow>(response)
}

export async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/workflows/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await handleResponse<void>(response)
}
