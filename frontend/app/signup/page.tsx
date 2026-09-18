"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as z from "zod"

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }).max(100),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }).max(100),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

type FormValues = z.infer<typeof formSchema>

type FieldErrors = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  form?: string
}

type OnboardingChoice = "personal" | "create" | "join" | null

export default function SigninPage() {
  const [step, setStep] = useState<"form" | "onboarding">("form")
  const [form, setForm] = useState<FormValues>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [onboardingChoice, setOnboardingChoice] = useState<OnboardingChoice>(null)
  const [orgName, setOrgName] = useState("")
  const [orgError, setOrgError] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = formSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof FieldErrors | undefined
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:5000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
        credentials: "include",
      })

      const data = await response.json()
      if (!response.ok) {
        setErrors({ form: data.error || "Something went wrong" })
        return
      }

      setStep("onboarding")
    } catch {
      setErrors({ form: "Unable to reach the server. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      setOrgError("Organization name is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:5000/api/v1/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), type: "organization" }),
        credentials: "include",
      })

      const data = await response.json()
      if (!response.ok) {
        setOrgError(data.error || "Failed to create organization")
        return
      }

      window.location.href = "/dashboard"
    } catch {
      setOrgError("Unable to reach the server. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoinOrg = async () => {
    if (!joinCode.trim()) {
      setJoinError("Organization ID or invitation code is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:5000/api/v1/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: joinCode.trim() }),
        credentials: "include",
      })

      const data = await response.json()
      if (!response.ok) {
        setJoinError(data.error || "Failed to join organization")
        return
      }

      window.location.href = "/dashboard"
    } catch {
      setJoinError("Unable to reach the server. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePersonal = () => {
    window.location.href = "/dashboard"
  }

  if (step === "onboarding") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-background p-8 shadow-lg">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary" />
            <h1 className="text-2xl font-bold">Welcome to FlowApprove</h1>
            <p className="text-sm text-muted-foreground">How do you plan to use FlowApprove?</p>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handlePersonal}
              disabled={submitting}
            >
              Personal use
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setOnboardingChoice("create")}
              disabled={submitting}
            >
              Create company/organization
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setOnboardingChoice("join")}
              disabled={submitting}
            >
              Join existing organization
            </Button>
          </div>

          {onboardingChoice === "create" && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="orgName" className="text-sm font-medium">Organization name</label>
                <input
                  id="orgName"
                  type="text"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => { setOrgName(e.target.value); setOrgError("") }}
                  className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {orgError && <p className="text-xs text-red-500">{orgError}</p>}
              </div>
              <Button type="button" className="w-full" onClick={handleCreateOrg} disabled={submitting}>
                {submitting ? "Creating..." : "Create Organization"}
              </Button>
            </div>
          )}

          {onboardingChoice === "join" && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="joinCode" className="text-sm font-medium">Organization ID or invitation code</label>
                <input
                  id="joinCode"
                  type="text"
                  placeholder="Enter ID or code"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setJoinError("") }}
                  className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {joinError && <p className="text-xs text-red-500">{joinError}</p>}
              </div>
              <Button type="button" className="w-full" onClick={handleJoinOrg} disabled={submitting}>
                {submitting ? "Joining..." : "Join Organization"}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-background p-8 shadow-lg">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary" />
          <h1 className="text-2xl font-bold">Sign up</h1>
          <p className="text-sm text-muted-foreground">Create an account to get started</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Create password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>
            {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </Button>
          </div>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline">Google</Button>
          <Button variant="outline">Microsoft</Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
