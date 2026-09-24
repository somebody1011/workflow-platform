export type Organization = {
  id: string
  name: string
  type: string
}

import { API_BASE } from "./config"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || "Request failed")
  }
  return response.json()
}

export async function listOrganizations(): Promise<Organization[]> {
  const response = await fetch(`${API_BASE}/api/v1/organizations`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<Organization[]>(response)
}
