import type { Request, Response } from "express"
import { db } from "../lib/prisma/db"
import type { AuthRequest } from "../middleware/auth"

export const listOrganizationMembers = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string | undefined)?.trim()

    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" })
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId,
    }).first()

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" })
    }

    const members = await db.orm.public.OrganizationMember.where({
      organizationId,
    })
      .include("user")
      .include("role")
      .include("department")
      .all()

    const team = members.map((member) => ({
      id: member.id,
      userId: member.userId,
      roleId: member.roleId,
      departmentId: member.departmentId,
      name: `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email,
      role: member.role?.name || "No Role",
      department: member.department?.name || "No Department",
      status: member.status === "active" ? "Active" : "Inactive",
    }))

    res.status(200).json(team)
  } catch (error) {
    console.error("List organization members error:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const listRoles = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string | undefined)?.trim()

    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" })
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId,
    }).first()

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" })
    }

    const roles = await db.orm.public.Role.where({
      organizationId,
    }).all()

    res.status(200).json(roles.map((role) => ({ id: role.id, name: role.name })))
  } catch (error) {
    console.error("List roles error:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const listDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string | undefined)?.trim()

    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" })
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId,
    }).first()

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" })
    }

    const departments = await db.orm.public.Department.where({
      organizationId,
    }).all()

    res.status(200).json(departments.map((department) => ({ id: department.id, name: department.name })))
  } catch (error) {
    console.error("List departments error:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = (req.body.organizationId as string | undefined)?.trim()
    const email = (req.body.email as string | undefined)?.trim()
    const roleId = req.body.roleId as string | undefined
    const departmentId = req.body.departmentId as string | undefined

    if (!organizationId || !email || !roleId || !departmentId) {
      return res.status(400).json({ error: "organizationId, email, role, and department are required" })
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId,
    }).first()

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" })
    }

    const user = await db.orm.public.User.where({ email }).first()

    if (!user) {
      return res.status(404).json({ error: "No user found with this email. Ask them to sign up first." })
    }

    if (roleId) {
      const role = await db.orm.public.Role.where({ id: roleId, organizationId }).first()
      if (!role) {
        return res.status(400).json({ error: "Selected role does not belong to this organization" })
      }
    }

    if (departmentId) {
      const department = await db.orm.public.Department.where({ id: departmentId, organizationId }).first()
      if (!department) {
        return res.status(400).json({ error: "Selected department does not belong to this organization" })
      }
    }

    const existingMember = await db.orm.public.OrganizationMember.where({
      userId: user.id,
      organizationId,
    }).first()

    if (existingMember) {
      return res.status(409).json({ error: "User is already a member of this organization" })
    }

    const member = await db.orm.public.OrganizationMember.create({
      userId: user.id,
      organizationId,
      roleId,
      departmentId,
      status: "active",
    })

    const created = await db.orm.public.OrganizationMember.where({
      id: member.id,
    })
      .include("user")
      .include("role")
      .include("department")
      .first()

    res.status(201).json({
      id: created!.id,
      userId: created!.userId,
      name: `${created!.user.firstName} ${created!.user.lastName}`,
      email: created!.user.email,
      role: created!.role?.name || "No Role",
      department: created!.department?.name || "No Department",
      status: created!.status === "active" ? "Active" : "Inactive",
    })
  } catch (error) {
    console.error("Invite member error:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
