import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";
import type { AuthRequest } from "../middleware/auth";

const APPROVER_TYPES = new Set(["user", "role", "department"]);

export interface CreateWorkflowInput {
  name: string;
  documentType: string;
  steps: CreateWorkflowStepInput[];
}

export interface CreateWorkflowStepInput {
  stepOrder: number;
  approverType: "user" | "role" | "department";
  approverRoleId?: string;
  approverUserId?: string;
  departmentId?: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  documentType?: string;
  status?: string;
  steps?: CreateWorkflowStepInput[];
}

export function validateWorkflowName(name: unknown): string {
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Workflow name is required");
  }
  return name.trim();
}

export function validateDocumentType(documentType: unknown): string {
  if (typeof documentType !== "string" || !documentType.trim()) {
    throw new Error("Document type is required");
  }
  return documentType.trim();
}

export function validateStatus(status: unknown): string {
  if (typeof status !== "string") {
    throw new Error("Status must be a string");
  }
  return status;
}

export function validateSteps(steps: unknown): CreateWorkflowStepInput[] {
  if (!Array.isArray(steps)) {
    throw new Error("Steps must be an array");
  }

  const validated: CreateWorkflowStepInput[] = [];

  for (const [index, step] of steps.entries()) {
    if (typeof step !== "object" || step === null) {
      throw new Error(`Step ${index + 1} must be an object`);
    }

    const stepOrder = (step as Record<string, unknown>).stepOrder;
    if (typeof stepOrder !== "number" || stepOrder < 1) {
      throw new Error(`Step ${index + 1} must have a valid stepOrder`);
    }

    const approverType = (step as Record<string, unknown>).approverType;
    if (typeof approverType !== "string" || !APPROVER_TYPES.has(approverType)) {
      throw new Error(`Step ${index + 1} must have a valid approverType (user, role, or department)`);
    }

    const validatedStep: CreateWorkflowStepInput = {
      stepOrder,
      approverType: approverType as CreateWorkflowStepInput["approverType"],
    };

    if (approverType === "role") {
      const approverRoleId = (step as Record<string, unknown>).approverRoleId;
      if (typeof approverRoleId !== "string" || !approverRoleId.trim()) {
        throw new Error(`Step ${index + 1} with approverType 'role' must have approverRoleId`);
      }
      validatedStep.approverRoleId = approverRoleId.trim();
    }

    if (approverType === "department") {
      const departmentId = (step as Record<string, unknown>).departmentId;
      if (typeof departmentId !== "string" || !departmentId.trim()) {
        throw new Error(`Step ${index + 1} with approverType 'department' must have departmentId`);
      }
      validatedStep.departmentId = departmentId.trim();
    }

    if (approverType === "user") {
      const approverUserId = (step as Record<string, unknown>).approverUserId;
      if (typeof approverUserId !== "string" || !approverUserId.trim()) {
        throw new Error(`Step ${index + 1} with approverType 'user' must have approverUserId`);
      }
      validatedStep.approverUserId = approverUserId.trim();
    }

    validated.push(validatedStep);
  }

  return validated;
}

export async function resolveOrganizationId(req: AuthRequest): Promise<string> {
  let organizationId = (req.body?.organizationId as string | undefined)?.trim();

  if (!organizationId) {
    const orgMember = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
    }).first();

    if (!orgMember) {
      const user = await db.orm.public.User.where({
        id: req.user!.id,
      }).first();

      if (!user) {
        throw new Error("User not found");
      }

      const personalOrg = await db.orm.public.Organization.create({
        name: `${user.firstName} ${user.lastName}'s Personal Space`,
        type: "personal",
      });

      await db.orm.public.OrganizationMember.create({
        userId: user.id,
        organizationId: personalOrg.id,
        status: "active",
      });

      organizationId = personalOrg.id;
    } else {
      organizationId = orgMember.organizationId;
    }
  } else {
    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId,
    }).first();

    if (!membership) {
      throw new Error("You do not have access to this organization");
    }
  }

  return organizationId;
}

export async function verifyWorkflowAccess(
  workflowId: string,
  organizationId: string
): Promise<{ id: string; name: string }> {
  const workflow = await db.orm.public.Workflow.where({
    id: workflowId,
    organizationId,
  }).first();

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  return { id: workflow.id, name: workflow.name };
}
