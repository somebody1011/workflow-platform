import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";
import {
  validateWorkflowName,
  validateDocumentType,
  validateStatus,
  validateSteps,
  resolveOrganizationId,
  verifyWorkflowAccess,
  type CreateWorkflowInput,
  type UpdateWorkflowInput,
} from "../validators/workflow";
import type { AuthRequest } from "../middleware/auth";

export const listWorkflows = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = await resolveOrganizationId(req);

    const workflows = await db.orm.public.Workflow.where({
      organizationId,
    })
      .orderBy((w) => w.updatedAt.desc())
      .all();

    const result = await Promise.all(
      workflows.map(async (workflow) => {
        const steps = await db.orm.public.WorkflowStep.where({
          workflowId: workflow.id,
        })
          .orderBy((s) => s.stepOrder.asc())
          .all();

        return {
          id: workflow.id,
          name: workflow.name,
          documentType: workflow.documentType,
          status: workflow.status,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          steps: steps.map((step) => ({
            id: step.id,
            stepOrder: step.stepOrder,
            approverType: step.approverType,
            approverRoleId: step.approverRoleId,
            departmentId: step.departmentId,
          })),
        };
      })
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("List workflows error:", error);
    res.status(400).json({ error: error?.message || "Failed to fetch workflows" });
  }
};

export const getWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = await resolveOrganizationId(req);
    const workflowId = req.params.id as string;

    const workflow = await db.orm.public.Workflow.where({
      id: workflowId,
      organizationId,
    }).first();

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const steps = await db.orm.public.WorkflowStep.where({
      workflowId,
    })
      .orderBy((s) => s.stepOrder.asc())
      .all();

    res.status(200).json({
      id: workflow.id,
      name: workflow.name,
      documentType: workflow.documentType,
      status: workflow.status,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      steps: steps.map((step) => ({
        id: step.id,
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        approverRoleId: step.approverRoleId,
        departmentId: step.departmentId,
      })),
    });
  } catch (error: any) {
    console.error("Get workflow error:", error);
    res.status(400).json({ error: error?.message || "Failed to fetch workflow" });
  }
};

export const createWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = await resolveOrganizationId(req);
    const { name, documentType, steps }: CreateWorkflowInput = req.body;

    const validatedName = validateWorkflowName(name);
    const validatedDocumentType = validateDocumentType(documentType);
    const validatedSteps = validateSteps(steps);

    const workflow = await db.orm.public.Workflow.create({
      name: validatedName,
      documentType: validatedDocumentType,
      organizationId,
    });

    for (const step of validatedSteps) {
      await db.orm.public.WorkflowStep.create({
        workflowId: workflow.id,
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        approverRoleId: step.approverRoleId || null,
        departmentId: step.departmentId || null,
      });
    }

    const createdSteps = await db.orm.public.WorkflowStep.where({
      workflowId: workflow.id,
    })
      .orderBy((s) => s.stepOrder.asc())
      .all();

    res.status(201).json({
      id: workflow.id,
      name: workflow.name,
      documentType: workflow.documentType,
      status: workflow.status,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      steps: createdSteps.map((step) => ({
        id: step.id,
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        approverRoleId: step.approverRoleId,
        departmentId: step.departmentId,
      })),
    });
  } catch (error: any) {
    console.error("Create workflow error:", error);
    res.status(400).json({ error: error?.message || "Failed to create workflow" });
  }
};

export const updateWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = await resolveOrganizationId(req);
    const workflowId = req.params.id as string;
    const updates: UpdateWorkflowInput = req.body;

    await verifyWorkflowAccess(workflowId, organizationId);

    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      updateData.name = validateWorkflowName(updates.name);
    }

    if (updates.documentType !== undefined) {
      updateData.documentType = validateDocumentType(updates.documentType);
    }

    if (updates.status !== undefined) {
      updateData.status = validateStatus(updates.status);
    }

    if (updates.steps !== undefined) {
      const validatedSteps = validateSteps(updates.steps);

      const existingSteps = await db.orm.public.WorkflowStep.where({
        workflowId,
      }).all();

      for (const step of existingSteps) {
        await db.orm.public.WorkflowStep.where({
          id: step.id,
        }).delete();
      }

      for (const step of validatedSteps) {
        await db.orm.public.WorkflowStep.create({
          workflowId,
          stepOrder: step.stepOrder,
          approverType: step.approverType,
          approverRoleId: step.approverRoleId || null,
          departmentId: step.departmentId || null,
        });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.orm.public.Workflow.where({
        id: workflowId,
        organizationId,
      }).update(updateData);
    }

    const updatedWorkflow = await db.orm.public.Workflow.where({
      id: workflowId,
    }).first();

    const updatedSteps = await db.orm.public.WorkflowStep.where({
      workflowId,
    })
      .orderBy((s) => s.stepOrder.asc())
      .all();

    res.status(200).json({
      id: updatedWorkflow!.id,
      name: updatedWorkflow!.name,
      documentType: updatedWorkflow!.documentType,
      status: updatedWorkflow!.status,
      createdAt: updatedWorkflow!.createdAt,
      updatedAt: updatedWorkflow!.updatedAt,
      steps: updatedSteps.map((step) => ({
        id: step.id,
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        approverRoleId: step.approverRoleId,
        departmentId: step.departmentId,
      })),
    });
  } catch (error: any) {
    console.error("Update workflow error:", error);
    res.status(400).json({ error: error?.message || "Failed to update workflow" });
  }
};

export const deleteWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = await resolveOrganizationId(req);
    const workflowId = req.params.id as string;

    await verifyWorkflowAccess(workflowId, organizationId);

    await db.orm.public.Workflow.where({
      id: workflowId,
      organizationId,
    }).delete();

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Delete workflow error:", error);
    res.status(400).json({ error: error?.message || "Failed to delete workflow" });
  }
};
