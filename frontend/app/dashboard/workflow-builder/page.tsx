"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, User, Settings, Plus, Trash2 } from "lucide-react"

const initialSteps = [
  { id: 1, name: "Start", type: "start" },
  { id: 2, name: "Finance Manager", type: "approver", role: "Finance Manager" },
  { id: 3, name: "Director", type: "approver", role: "Director" },
  { id: 4, name: "End", type: "end" },
]

export default function WorkflowBuilderPage() {
  const [steps, setSteps] = useState(initialSteps)
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflow Builder</h1>
          <p className="text-muted-foreground">Design and configure approval workflows for different document types.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Workflow</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input id="workflow-name" defaultValue="Purchase Request" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <Label>Step Configuration</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active</span>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="mt-6 relative">
              <div className="flex flex-col items-center gap-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 w-full">
                    <div
                      className={`flex w-full max-w-md items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        activeStep === step.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => setActiveStep(step.id)}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        step.type === "start" || step.type === "end" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {step.type === "start" || step.type === "end" ? (
                          step.type === "start" ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        {step.role && <p className="text-sm text-muted-foreground">{step.role}</p>}
                      </div>
                      {step.type === "approver" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="h-8 w-0.5 bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Step Configuration</h3>
            {activeStep ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="step-name">Step Name</Label>
                  <Input id="step-name" defaultValue={steps.find(s => s.id === activeStep)?.name} />
                </div>
                {steps.find(s => s.id === activeStep)?.type === "approver" && (
                  <div className="space-y-2">
                    <Label htmlFor="approver-role">Approver Role</Label>
                    <Input id="approver-role" defaultValue={steps.find(s => s.id === activeStep)?.role} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (hours)</Label>
                  <Input id="timeout" type="number" defaultValue={24} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification">Notification Type</Label>
                  <Input id="notification" defaultValue="Email" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">Allow Rejection</p>
                    <p className="text-sm text-muted-foreground">Enable rejection option</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">Require Comments</p>
                    <p className="text-sm text-muted-foreground">Mandatory comments for approval</p>
                  </div>
                  <Switch />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a step to configure it.</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Workflow Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">Auto-approve</p>
                  <p className="text-sm text-muted-foreground">Auto-approve after timeout</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">Parallel Approval</p>
                  <p className="text-sm text-muted-foreground">Allow parallel approvals</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">Escalation</p>
                  <p className="text-sm text-muted-foreground">Escalate on timeout</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}