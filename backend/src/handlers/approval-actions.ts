import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";
import type { AuthRequest } from "../middleware/auth";

export const submitApprovalAction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.id as string;
    const { action, comment, stepNumber } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" });
    }

    const approvalRequest = await db.orm.public.ApprovalRequest.where({
      id: requestId,
      organizationId: membership.organizationId,
    }).first();

    if (!approvalRequest) {
      return res.status(404).json({ error: "Approval request not found" });
    }

    if (approvalRequest.status !== "pending" && approvalRequest.status !== "inprogress") {
      return res.status(400).json({ error: "This approval request has already been processed" });
    }

    const workflow = await db.orm.public.Workflow.where({
      id: approvalRequest.workflowId,
    }).first();

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const workflowSteps = await db.orm.public.WorkflowStep.where({
      workflowId: workflow.id,
    })
      .orderBy((s) => s.stepOrder.asc())
      .all();

    const currentStepNumber = stepNumber ?? approvalRequest.currentStep;

    const existingAction = await db.orm.public.ApprovalAction.where({
      approvalRequestId: requestId,
      actorId: userId,
      stepNumber: currentStepNumber,
    }).first();

    if (existingAction) {
      return res.status(409).json({ error: "You have already acted on this step" });
    }

    const approvalAction = await db.orm.public.ApprovalAction.create({
      approvalRequestId: requestId,
      actorId: userId,
      action,
      comment: comment?.trim() || null,
      stepNumber: currentStepNumber,
    });

    const currentStepActions = await db.orm.public.ApprovalAction.where({
      approvalRequestId: requestId,
      stepNumber: currentStepNumber,
    }).all();

    let newStatus = approvalRequest.status;
    let newCurrentStep = approvalRequest.currentStep;

    if (action === "reject") {
      newStatus = "rejected";
    } else if (currentStepActions.length >= workflowSteps.length) {
      newStatus = "approved";
    } else {
      newStatus = "inprogress";
      newCurrentStep = currentStepNumber + 1;
    }

    await db.orm.public.ApprovalRequest.where({
      id: requestId,
    }).update({
      status: newStatus,
      currentStep: newCurrentStep,
    });

    const actor = await db.orm.public.User.where({
      id: userId,
    }).first();

    res.status(201).json({
      id: approvalAction.id,
      action: approvalAction.action,
      comment: approvalAction.comment,
      stepNumber: approvalAction.stepNumber,
      createdAt: approvalAction.createdAt,
      actor: actor
        ? {
            id: actor.id,
            firstName: actor.firstName,
            lastName: actor.lastName,
            email: actor.email,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Submit approval action error:", error);
    res.status(500).json({ error: error?.message || "Failed to submit approval action" });
  }
};

export const listApprovalActions = async (req: AuthRequest, res: Response) => {
  try {
    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" });
    }

    const approvalRequest = await db.orm.public.ApprovalRequest.where({
      id: req.params.id as string,
      organizationId: membership.organizationId,
    }).first();

    if (!approvalRequest) {
      return res.status(404).json({ error: "Approval request not found" });
    }

    const actions = await db.orm.public.ApprovalAction.where({
      approvalRequestId: req.params.id as string,
    })
      .orderBy((a) => a.createdAt.desc())
      .all();

    const actors = await Promise.all(
      actions.map((action) => db.orm.public.User.where({ id: action.actorId }).first())
    );

    res.status(200).json(
      actions.map((action, index) => {
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
      })
    );
  } catch (error: any) {
    console.error("List approval actions error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch approval actions" });
  }
};
