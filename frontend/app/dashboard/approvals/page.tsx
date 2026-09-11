"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Filter, Check, X, MoreHorizontal } from "lucide-react"

const approvals = [
  { id: "PR-1024", title: "Purchase Request #PR-1024", submittedBy: "John Mwangi", department: "Finance", status: "Approved", date: "Sep 10, 2026" },
  { id: "EQ-0415", title: "Equipment Request #EQ-0415", submittedBy: "Sarah Kimani", department: "IT", status: "In Review", date: "Sep 9, 2026" },
  { id: "CT-0098", title: "Contract #CT-0098", submittedBy: "David Ochieng", department: "Legal", status: "Approved", date: "Sep 7, 2026" },
  { id: "LR-0037", title: "Leave Request #LR-0037", submittedBy: "Mary Wanjiku", department: "HR", status: "Pending", date: "Sep 6, 2026" },
  { id: "TA-0012", title: "Travel Allowance #TA-0012", submittedBy: "Grace Njonge", department: "Finance", status: "Pending", date: "Sep 5, 2026" },
]

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Approvals</h1>
        <p className="text-muted-foreground">14 documents require your attention</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search approvals..."
              className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {approvals.map((approval) => (
            <div key={approval.id} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{approval.title}</p>
                  <p className="text-sm text-muted-foreground">
                    by {approval.submittedBy} · {approval.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{approval.date}</p>
                  <StatusBadge status={approval.status} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                    <X className="h-4 w-4" />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "In Review": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}