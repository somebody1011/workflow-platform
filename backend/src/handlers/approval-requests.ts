import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";
import type { AuthRequest } from "../middleware/auth";

export const createApprovalRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { workflowId, documentId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!workflowId || !documentId) {
      return res.status(400).json({ error: "workflowId and documentId are required" });
    }

    const workflow = await db.orm.public.Workflow.where({
      id: workflowId,
    }).first();

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId,
      organizationId: workflow.organizationId,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this workflow" });
    }

    const document = await db.orm.public.Document.where({
      id: documentId,
      organizationId: workflow.organizationId,
    }).first();

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const existingRequest = await db.orm.public.ApprovalRequest.where({
      workflowId,
      documentId,
      status: "pending",
    }).first();

    if (existingRequest) {
      return res.status(409).json({ error: "An active approval request already exists for this document and workflow" });
    }

    const approvalRequest = await db.orm.public.ApprovalRequest.create({
      workflowId,
      documentId,
      organizationId: workflow.organizationId,
      submittedBy: userId,
      status: "pending",
      currentStep: 1,
    });

    const workflowSteps = await db.orm.public.WorkflowStep.where({
      workflowId,
    })
      .orderBy((s) => s.stepOrder.asc())
      .all();

    const submittedByUser = await db.orm.public.User.where({
      id: userId,
    }).first();

    res.status(201).json({
      id: approvalRequest.id,
      workflowId: approvalRequest.workflowId,
      documentId: approvalRequest.documentId,
      organizationId: approvalRequest.organizationId,
      submittedBy: approvalRequest.submittedBy,
      status: approvalRequest.status,
      currentStep: approvalRequest.currentStep,
      createdAt: approvalRequest.createdAt,
      updatedAt: approvalRequest.updatedAt,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        documentType: workflow.documentType,
        steps: workflowSteps.map((step) => ({
          id: step.id,
          stepOrder: step.stepOrder,
          approverType: step.approverType,
          approverRoleId: step.approverRoleId,
          departmentId: step.departmentId,
        })),
      },
      document: {
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        url: document.url,
      },
      submittedByUser: submittedByUser
        ? {
            id: submittedByUser.id,
            firstName: submittedByUser.firstName,
            lastName: submittedByUser.lastName,
            email: submittedByUser.email,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Create approval request error:", error);
    res.status(500).json({ error: error?.message || "Failed to create approval request" });
  }
};

export const listApprovalRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId,
    }).first();

    if (!membership) {
      const user = await db.orm.public.User.where({
        id: userId,
      }).first();

      if (!user) {
        return res.status(401).json({ error: "User not found" });
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

      return res.status(200).json([]);
    }

    const requests = await db.orm.public.ApprovalRequest.where({
      organizationId: membership.organizationId,
    })
      .orderBy((r) => r.createdAt.desc())
      .all();

    const result = await Promise.all(
      requests.map(async (request) => {
        const [workflow, document, submittedByUser] = await Promise.all([
          db.orm.public.Workflow.where({ id: request.workflowId }).first(),
          db.orm.public.Document.where({ id: request.documentId }).first(),
          db.orm.public.User.where({ id: request.submittedBy }).first(),
        ]);

        const workflowSteps = workflow
          ? await db.orm.public.WorkflowStep.where({
              workflowId: workflow.id,
            })
              .orderBy((s) => s.stepOrder.asc())
              .all()
          : [];

        return {
          id: request.id,
          workflowId: request.workflowId,
          documentId: request.documentId,
          organizationId: request.organizationId,
          submittedBy: request.submittedBy,
          status: request.status,
          currentStep: request.currentStep,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          workflow: workflow
            ? {
                id: workflow.id,
                name: workflow.name,
                documentType: workflow.documentType,
                steps: workflowSteps.map((step) => ({
                  id: step.id,
                  stepOrder: step.stepOrder,
                  approverType: step.approverType,
                  approverRoleId: step.approverRoleId,
                  departmentId: step.departmentId,
                })),
              }
            : null,
          document: document
            ? {
                id: document.id,
                name: document.name,
                originalName: document.originalName,
                url: document.url,
              }
            : null,
          submittedByUser: submittedByUser
            ? {
                id: submittedByUser.id,
                firstName: submittedByUser.firstName,
                lastName: submittedByUser.lastName,
                email: submittedByUser.email,
              }
            : null,
        };
      })
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("List approval requests error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch approval requests" });
  }
};

export const getApprovalRequest = async (req: AuthRequest, res: Response) => {
  try {
    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" });
    }

    const request = await db.orm.public.ApprovalRequest.where({
      id: req.params.id as string,
      organizationId: membership.organizationId,
    }).first();

    if (!request) {
      return res.status(404).json({ error: "Approval request not found" });
    }

    const [workflow, document, submittedByUser, actions] = await Promise.all([
      db.orm.public.Workflow.where({ id: request.workflowId }).first(),
      db.orm.public.Document.where({ id: request.documentId }).first(),
      db.orm.public.User.where({ id: request.submittedBy }).first(),
      db.orm.public.ApprovalAction.where({
        approvalRequestId: request.id,
      })
        .orderBy((a) => a.createdAt.desc())
        .all(),
    ]);

    const workflowSteps = workflow
      ? await db.orm.public.WorkflowStep.where({
          workflowId: workflow.id,
        })
          .orderBy((s) => s.stepOrder.asc())
          .all()
      : [];

    const actors = await Promise.all(
      actions.map((action) => db.orm.public.User.where({ id: action.actorId }).first())
    );

    res.status(200).json({
      id: request.id,
      workflowId: request.workflowId,
      documentId: request.documentId,
      organizationId: request.organizationId,
      submittedBy: request.submittedBy,
      status: request.status,
      currentStep: request.currentStep,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      workflow: workflow
        ? {
            id: workflow.id,
            name: workflow.name,
            documentType: workflow.documentType,
            steps: workflowSteps.map((step) => ({
              id: step.id,
              stepOrder: step.stepOrder,
              approverType: step.approverType,
              approverRoleId: step.approverRoleId,
              departmentId: step.departmentId,
            })),
          }
        : null,
      document: document
        ? {
            id: document.id,
            name: document.name,
            originalName: document.originalName,
            url: document.url,
          }
        : null,
      submittedByUser: submittedByUser
        ? {
            id: submittedByUser.id,
            firstName: submittedByUser.firstName,
            lastName: submittedByUser.lastName,
            email: submittedByUser.email,
          }
        : null,
      actions: actions.map((action, index) => {
        const actor = actors[index];
        return {
          id: action.id,
          action: action.action,
          comment: action.comment,
          stepNumber: action.stepNumber,
          createdAt: action.createdAt,
          actor: actor
            ? {
                id: actor.id,
                firstName: actor.firstName,
                lastName: actor.lastName,
                email: actor.email,
              }
            : null,
        };
      }),
    });
  } catch (error: any) {
    console.error("Get approval request error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch approval request" });
  }
};
