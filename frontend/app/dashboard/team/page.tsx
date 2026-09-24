"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Filter, Plus, MoreHorizontal, Mail, Loader2, X } from "lucide-react"
import { listOrganizations } from "@/lib/api/organizations"
import { listOrganizationMembers, listRoles, listDepartments, inviteMember } from "@/lib/api/organization-members"

type Member = {
  id: string
  userId: string
  name: string
  email: string
  role: string
  department: string
  status: string
}

type Organization = {
  id: string
  name: string
  type: string
}

type Role = {
  id: string
  name: string
}

type Department = {
  id: string
  name: string
}

export default function TeamPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [members, setMembers] = useState<Member[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")
  const [inviteDepartmentId, setInviteDepartmentId] = useState("")
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await listOrganizations()
        setOrganizations(data)
        const nonPersonalOrg = data.find((org) => org.type !== "personal")
        if (nonPersonalOrg) {
          setSelectedOrgId(nonPersonalOrg.id)
        } else if (data.length > 0) {
          setSelectedOrgId(data[0].id)
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
    const fetchMembers = async () => {
      setLoadingMembers(true)
      try {
        const data = await listOrganizationMembers(selectedOrgId)
        setMembers(data)
      } catch (error) {
        console.error("Failed to fetch team members:", error)
      } finally {
        setLoadingMembers(false)
      }
    }

    fetchMembers()
  }, [selectedOrgId])

  const fetchLookupData = async (organizationId: string) => {
    try {
      const [rolesData, departmentsData] = await Promise.all([
        listRoles(organizationId),
        listDepartments(organizationId),
      ])
      setRoles(rolesData)
      setDepartments(departmentsData)
    } catch (error) {
      console.error("Failed to fetch lookup data:", error)
    }
  }

  const openInviteModal = async () => {
    setInviteError(null)
    setInviteEmail("")
    setInviteRoleId("")
    setInviteDepartmentId("")
    setInviteOpen(true)
    if (selectedOrgId) {
      await fetchLookupData(selectedOrgId)
    }
  }

  const handleInvite = async () => {
    if (!selectedOrgId || !inviteEmail.trim() || !inviteRoleId || !inviteDepartmentId) return
    setInviting(true)
    setInviteError(null)
    try {
      const member = await inviteMember({
        organizationId: selectedOrgId,
        email: inviteEmail.trim(),
        roleId: inviteRoleId,
        departmentId: inviteDepartmentId,
      })
      setMembers((prev) => [...prev, member])
      setInviteOpen(false)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite member")
    } finally {
      setInviting(false)
    }
  }

  const filteredMembers = members.filter((member) => {
    const query = search.toLowerCase()
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.department.toLowerCase().includes(query)
    )
  })

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <Button onClick={openInviteModal}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingOrgs || loadingMembers ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {search ? "No team members match your search." : "No team members found."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">{member.name.split(" ").map((n) => n[0]).join("")}</span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{member.role}</td>
                    <td className="px-4 py-3">{member.department}</td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === "Active" ? "default" : "secondary"}>{member.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredMembers.length} of {members.length} results
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setInviteOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invite member</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInviteOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Add an existing user to <span className="font-medium">{selectedOrg?.name || "this organization"}</span> by email.
            </p>
            {inviteError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                {inviteError}
              </div>
            )}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <select
                  value={inviteDepartmentId}
                  onChange={(e) => setInviteDepartmentId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
