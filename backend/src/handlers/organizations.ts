import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";
import type { AuthRequest } from "../middleware/auth";

export const createOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, type = "organization" } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!name?.trim()) {
      return res.status(400).json({ error: "Organization name is required" });
    }

    const organization = await db.orm.public.Organization.create({
      name: name.trim(),
      type,
    });

    await db.orm.public.OrganizationMember.create({
      userId,
      organizationId: organization.id,
      status: "active",
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error("Create organization error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const joinOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { organizationId, invitationCode } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!organizationId && !invitationCode) {
      return res.status(400).json({ error: "Organization ID or invitation code is required" });
    }

    let organizationIdToJoin = organizationId;

    if (invitationCode) {
      const invitation = await db.orm.public.Organization.where({
        id: invitationCode,
      }).first();

      if (!invitation) {
        return res.status(404).json({ error: "Invalid invitation code" });
      }

      organizationIdToJoin = invitation.id;
    }

    const existingMember = await db.orm.public.OrganizationMember.where({
      userId,
      organizationId: organizationIdToJoin,
    }).first();

    if (existingMember) {
      return res.status(409).json({ error: "You are already a member of this organization" });
    }

    await db.orm.public.OrganizationMember.create({
      userId,
      organizationId: organizationIdToJoin,
      status: "active",
    });

     const organization = await db.orm.public.Organization.where({
      id: organizationIdToJoin,
    }).first()

    res.status(200).json(organization);
  } catch (error) {
    console.error("Join organization error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
    })
    .include("organization")
    .all();

    const organizations = memberships.map((m) => m.organization);

    res.status(200).json(organizations);
  } catch (error) {
    console.error("Get organizations error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
