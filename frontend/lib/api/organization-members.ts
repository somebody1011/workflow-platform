export type OrganizationMember = {
  id: string
  userId: string
  name: string
  email: string
  role: string
  department: string
  status: string
}

export type Role = {
  id: string
  name: string
}

export type Department = {
  id: string
  name: string
}

import { API_BASE } from "./config"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || "Request failed")
  }
  return response.json()
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const response = await fetch(`${API_BASE}/api/v1/organization-members?organizationId=${encodeURIComponent(organizationId)}`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<OrganizationMember[]>(response)
}

export async function listRoles(organizationId: string): Promise<Role[]> {
  const response = await fetch(`${API_BASE}/api/v1/organization-members/roles?organizationId=${encodeURIComponent(organizationId)}`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<Role[]>(response)
}

export async function listDepartments(organizationId: string): Promise<Department[]> {
  const response = await fetch(`${API_BASE}/api/v1/organization-members/departments?organizationId=${encodeURIComponent(organizationId)}`, {
    method: "GET",
    credentials: "include",
  })
  return handleResponse<Department[]>(response)
}

export async function inviteMember(payload: {
  organizationId: string
  email: string
  roleId?: string
  departmentId?: string
}): Promise<OrganizationMember> {
  const response = await fetch(`${API_BASE}/api/v1/organization-members/invite`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<OrganizationMember>(response)
}
