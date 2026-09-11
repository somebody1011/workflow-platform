import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const stats = [
  { label: "Total Documents", value: "128", change: "+12% from last month", trend: "up" },
  { label: "Pending", value: "14", change: "4 need your attention", trend: "neutral" },
  { label: "Approved", value: "102", change: "8.4% from last week", trend: "up" },
  { label: "Rejected", value: "12", change: "+2.1% from last week", trend: "down" },
]

const recentDocuments = [
  { name: "Budget 2026", submittedBy: "Elisha Mwangi", date: "Sep 10, 2026", status: "Approved" },
  { name: "Leave Request", submittedBy: "Mary", date: "Sep 9, 2026", status: "Pending" },
  { name: "Purchase Request", submittedBy: "Elisha Mwangi", date: "Sep 8, 2026", status: "In Review" },
  { name: "Contract #CT-0098", submittedBy: "David Ochieng", date: "Sep 7, 2026", status: "Approved" },
  { name: "Equipment Request", submittedBy: "IT", date: "Sep 6, 2026", status: "Pending" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back, Elisha! Here's what's happening with your documents today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                {stat.trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Documents</h3>
            <Link href="/dashboard/documents">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {recentDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Submitted by {doc.submittedBy}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                  <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Approvals</h3>
            <Link href="/dashboard/approvals">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {[
              { title: "Purchase Request #PR-1024", submittedBy: "John Mwangi", type: "Finance", time: "2h ago" },
              { title: "Equipment Request #EQ-0415", submittedBy: "Sarah Kimani", type: "IT", time: "4h ago" },
              { title: "Contract #CT-0098", submittedBy: "David Ochieng", type: "Legal", time: "1d ago" },
              { title: "Leave Request #LR-0037", submittedBy: "Mary Wanjiku", type: "HR", time: "2d ago" },
            ].map((approval, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{approval.title}</p>
                    <p className="text-xs text-muted-foreground">by {approval.submittedBy}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{approval.time}</p>
                  <span className="mt-1 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {approval.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
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