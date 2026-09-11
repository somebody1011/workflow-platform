"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react"

const stats = [
  { title: "Total Documents", value: "128", change: "+12%", icon: BarChart3 },
  { title: "Approval Rate", value: "94%", change: "+3%", icon: TrendingUp },
  { title: "Active Users", value: "24", change: "+2", icon: Users },
  { title: "Avg. Processing Time", value: "2.4 days", change: "-0.5 days", icon: Clock },
]

const monthlyData = [
  { month: "Jan", documents: 45, approved: 42 },
  { month: "Feb", documents: 52, approved: 48 },
  { month: "Mar", documents: 61, approved: 58 },
  { month: "Apr", documents: 48, approved: 45 },
  { month: "May", documents: 72, approved: 68 },
  { month: "Jun", documents: 85, approved: 80 },
]

export default function ReportsPage() {
  const [range, setRange] = useState("6months")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights for your approval workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">Export</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Documents Overview</h3>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex gap-1 items-end h-48 w-full justify-center">
                  <div className="w-4 bg-primary rounded-t" style={{ height: `${(data.documents / 100) * 100}%` }} />
                  <div className="w-4 bg-primary/50 rounded-t" style={{ height: `${(data.approved / 100) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{data.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Department Breakdown</h3>
          <div className="space-y-4">
            {[
              { department: "Finance", percentage: 35, count: 45 },
              { department: "IT", percentage: 25, count: 32 },
              { department: "HR", percentage: 20, count: 26 },
              { department: "Legal", percentage: 12, count: 15 },
              { department: "Operations", percentage: 8, count: 10 },
            ].map((item) => (
              <div key={item.department} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.department}</span>
                  <span className="text-muted-foreground">{item.count} docs</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}