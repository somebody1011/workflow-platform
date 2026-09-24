"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, User, Settings, Plus, Trash2, Loader2, Mail } from "lucide-react"
import { createWorkflow, updateWorkflow, getWorkflow, type Workflow, type WorkflowStep } from "@/lib/api/workflows"
import { useAuth } from "@/app/auth/AuthProvider"
import { listRoles, listDepartments, listOrganizationMembers } from "@/lib/api/organization-members"
import { listOrganizations } from "@/lib/api/organizations"

type StepType = "start" | "approver" | "end"

interface BuilderStep {
  id: string
  name: string
  type: StepType
  approverType: "user" | "role" | "department"
  approverRoleId: string
  approverUserId: string
  departmentId: string
  stepOrder: number
}

const EMPTY_STEP: Omit<BuilderStep, "id"> = {
  name: "",
  type: "approver",
  approverType: "role",
  approverRoleId: "",
  approverUserId: "",
  departmentId: "",
  stepOrder: 0,
}

export default function WorkflowBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")
  const { user } = useAuth()

  const [name, setName] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [active, setActive] = useState(true)
  const [steps, setSteps] = useState<BuilderStep[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [organizations, setOrganizations] = useState<{ id: string; name: string; type: string }[]>([])

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await listOrganizations()
        setOrganizations(data)
      } catch {
        // ignore
      }
    }
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (editId) return
    const org = organizations.find((o) => o.type !== "personal") || organizations[0]
    if (!org) return
    setLoadingLookups(true)
    Promise.all([
      listRoles(org.id),
      listDepartments(org.id),
      listOrganizationMembers(org.id),
    ])
      .then(([rolesData, departmentsData, membersData]) => {
        setRoles(rolesData)
        setDepartments(departmentsData)
        setUsers(membersData.map((m) => ({ id: m.userId, name: m.name, email: m.email })))
      })
      .catch(() => { })
      .finally(() => setLoadingLookups(false))
  }, [organizations, editId])

  useEffect(() => {
    if (!editId) return
    setLoading(true)
    setError(null)
    getWorkflow(editId)
      .then(async (workflow) => {
        setName(workflow.name)
        setDocumentType(workflow.documentType)
        setActive(workflow.status === "active")
        const memberLookup = await listOrganizationMembers(workflow.organizationId)
        const memberById = new Map(memberLookup.map((member) => [member.userId, member]))
        setSteps(
          workflow.steps.map((step) => ({
            id: step.id,
            name: "",
            type: "approver" as StepType,
            approverType: step.approverType,
            approverRoleId: step.approverRoleId ?? "",
            approverUserId: step.approverUserId ? memberById.get(step.approverUserId)?.email ?? step.approverUserId : "",
            departmentId: step.departmentId ?? "",
            stepOrder: step.stepOrder,
          }))
        )
        setLoadingLookups(true)
        try {
          const [rolesData, departmentsData, membersData] = await Promise.all([
            listRoles(workflow.organizationId),
            listDepartments(workflow.organizationId),
            Promise.resolve(memberLookup),
          ])
          setRoles(rolesData)
          setDepartments(departmentsData)
          setUsers(membersData.map((m) => ({ id: m.userId, name: m.name, email: m.email })))
        } catch {
          // ignore lookup errors
        } finally {
          setLoadingLookups(false)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load workflow"))
      .finally(() => setLoading(false))
  }, [editId])

  const updateStep = (id: string, patch: Partial<BuilderStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)))
  }

  const addStep = () => {
    const newStep: BuilderStep = {
      ...EMPTY_STEP,
      id: crypto.randomUUID(),
      stepOrder: steps.length + 1,
      name: `Step ${steps.length + 1}`,
    }
    setSteps((prev) => [...prev, newStep])
    setSelectedStepId(newStep.id)
  }

  const removeStep = (id: string) => {
    setSteps((prev) => {
      const next = prev.filter((step) => step.id !== id)
      return next.map((step, index) => ({ ...step, stepOrder: index + 1 }))
    })
    setSelectedStepId((current) => (current === id ? null : current))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name,
        documentType,
        status: active ? "active" : "inactive",
        steps: steps.map(({ id: _id, name: _name, type: _type, ...step }) => step),
      }

      if (editId) {
        await updateWorkflow(editId, payload)
      } else {
        await createWorkflow(payload)
      }
      router.push("/dashboard/workflows")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workflow")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading workflow...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{editId ? "Edit Workflow" : "Workflow Builder"}</h1>
          <p className="text-muted-foreground">Design and configure approval workflows for different document types.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/workflows")}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !documentType.trim() || steps.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editId ? "Update Workflow" : "Save Workflow"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input id="workflow-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>

            <div className="mb-4">
              <Label htmlFor="document-type">Document Type</Label>
              <Input id="document-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <Label>Step Configuration</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Active" : "Inactive"}</span>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>

            <div className="mt-6 relative">
              <div className="flex flex-col items-center gap-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 w-full">
                    <div
                      className={`flex w-full max-w-md items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${selectedStepId === step.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                        }`}
                      onClick={() => setSelectedStepId(step.id)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name || `Step ${step.stepOrder}`}</p>
                        <p className="text-sm text-muted-foreground">{step.approverType} · Order {step.stepOrder}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeStep(step.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {index < steps.length - 1 && <div className="h-8 w-0.5 bg-border" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Step Configuration</h3>
            {selectedStep ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="step-name">Step Name</Label>
                  <Input id="step-name" value={selectedStep.name} onChange={(e) => updateStep(selectedStep.id, { name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approver-type">Approver type</Label>
                  <select
                    id="approver-type"
                    value={selectedStep.approverType}
                    onChange={(e) => updateStep(selectedStep.id, { approverType: e.target.value as BuilderStep["approverType"] })}
                    className="h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="role">Role</option>
                    <option value="department">Department</option>
                    <option value="user">Specific user</option>
                  </select>
                </div>
                {selectedStep.approverType === "role" && (
                  <div className="space-y-2">
                    <Label htmlFor="approver-role">Role</Label>
                    <select
                      id="approver-role"
                      value={selectedStep.approverRoleId}
                      onChange={(e) => updateStep(selectedStep.id, { approverRoleId: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedStep.approverType === "department" && (
                  <div className="space-y-2">
                    <Label htmlFor="department-id">Department</Label>
                    <select
                      id="department-id"
                      value={selectedStep.departmentId}
                      onChange={(e) => updateStep(selectedStep.id, { departmentId: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="">Select a department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedStep.approverType === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="approver-user-email">User Email</Label>
                    <Input
                      id="approver-user-email"
                      type="email"
                      placeholder="user@example.com"
                      value={selectedStep.approverUserId}
                      onChange={(e) => updateStep(selectedStep.id, { approverUserId: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Enter the email of the specific user in this organization.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="step-order">Step Order</Label>
                  <Input id="step-order" type="number" value={selectedStep.stepOrder} onChange={(e) => updateStep(selectedStep.id, { stepOrder: Number(e.target.value) })} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a step to configure it.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
