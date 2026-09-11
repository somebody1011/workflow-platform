"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Filter, Plus, MoreHorizontal, Play } from "lucide-react"

const workflows = [
  { id: "WF-001", name: "Purchase Approval", steps: 3, lastModified: "2 days ago", status: "Active" },
  { id: "WF-002", name: "Leave Request", steps: 2, lastModified: "1 week ago", status: "Active" },
  { id: "WF-003", name: "Contract Review", steps: 4, lastModified: "3 days ago", status: "Active" },
  { id: "WF-004", name: "Equipment Request", steps: 3, lastModified: "1 month ago", status: "Inactive" },
  { id: "WF-005", name: "Travel Reimbursement", steps: 2, lastModified: "2 weeks ago", status: "Active" },
]

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">Manage your document approval workflows.</p>
        </div>
        <Link href="/dashboard/workflow-builder">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search workflows..."
              className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{workflow.name}</h3>
                  <p className="text-sm text-muted-foreground">{workflow.id} · {workflow.steps} steps</p>
                </div>
                <Badge variant={workflow.status === "Active" ? "default" : "secondary"}>{workflow.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Last modified {workflow.lastModified}</p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}