"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Filter, Plus, MoreHorizontal, Mail } from "lucide-react"

const team = [
  { id: 1, name: "Elisha Mwangi", email: "elisha@example.com", role: "Developer", department: "Engineering", status: "Active" },
  { id: 2, name: "Sarah Kimani", email: "sarah@example.com", role: "Manager", department: "IT", status: "Active" },
  { id: 3, name: "John Mwangi", email: "john@example.com", role: "Finance", department: "Finance", status: "Active" },
  { id: 4, name: "Mary Wanjiku", email: "mary@example.com", role: "HR", department: "Human Resources", status: "Active" },
  { id: 5, name: "David Ochieng", email: "david@example.com", role: "Legal", department: "Legal", status: "Inactive" },
  { id: 6, name: "Grace Njonge", email: "grace@example.com", role: "Finance", department: "Finance", status: "Active" },
]

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <Button>
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
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{member.name.split(" ").map(n => n[0]).join("")}</span>
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 1 to 6 of 6 results</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}