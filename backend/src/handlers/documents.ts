import multer from "multer";
import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";
import { uploadToCloudinary } from "../lib/cloudinary";
import { uploadToSupabase, getSupabaseSignedUrl } from "../lib/supabase";
import { validateDocument, IMAGE_MIME_TYPES, DOCUMENT_MIME_TYPES, normalizeMimeType } from "../validators/document";
import type { AuthRequest } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

async function canAccessAssignedDocument(
  userId: string,
  membership: { roleId: string | null; departmentId: string | null },
  documentId: string,
  organizationId: string
): Promise<boolean> {
  const requests = await db.orm.public.ApprovalRequest.where({
    documentId,
    organizationId,
  }).all();

  for (const request of requests) {
    if (request.status !== "pending" && request.status !== "inprogress") {
      continue;
    }

    const step = await db.orm.public.WorkflowStep.where({
      workflowId: request.workflowId,
      stepOrder: request.currentStep,
    }).first();

    if (!step) continue;
    if (step.approverType === "user" && step.approverUserId === userId) return true;
    if (step.approverType === "role" && step.approverRoleId === membership.roleId) return true;
    if (step.approverType === "department" && step.departmentId === membership.departmentId) return true;
  }

  return false;
}

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "File upload error" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const validation = validateDocument(
      file.originalname,
      file.mimetype,
      file.size,
      file.buffer
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
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
          return res.status(403).json({ error: "You do not have access to this organization" });
        }
      }

      const normalizedMimeType = normalizeMimeType(file.mimetype);

      let uploadResult;
      if (IMAGE_MIME_TYPES.has(normalizedMimeType)) {
        uploadResult = await uploadToCloudinary(
          file.buffer,
          normalizedMimeType,
          file.originalname
        );
      } else {
        uploadResult = await uploadToSupabase(
          file.buffer,
          normalizedMimeType,
          file.originalname
        );
      }

      const document = await db.orm.public.Document.create({
        organizationId,
        name: file.originalname.replace(/\.[^/.]+$/, ""),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: uploadResult.storageKey,
        url: uploadResult.url,
        checksum: validation.checksum,
        virusScanStatus: "pending",
        status: "active",
        uploadedBy: req.user!.id,
      });

      res.status(201).json({
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        url: `/api/v1/documents/${document.id}/download`,
        status: document.status,
        createdAt: document.createdAt,
      });
    } catch (error: any) {
      console.error("Document upload error:", error);
      const message =
        error?.message || error?.http_code || "Failed to upload document";
      res.status(500).json({ error: message });
    }
  });
};

export const listDocuments = async (req: AuthRequest, res: Response) => {
  try {
    let organizationId = (req.query.organizationId as string | undefined)?.trim();

    if (!organizationId) {
      const orgMember = await db.orm.public.OrganizationMember.where({
        userId: req.user!.id,
      }).first();

      if (!orgMember) {
        const user = await db.orm.public.User.where({
          id: req.user!.id,
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
        return res.status(403).json({ error: "You do not have access to this organization" });
      }
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this organization" });
    }

    const docs = await db.orm.public.Document.where({
      organizationId,
    }).orderBy((d) => d.createdAt.desc()).all();

    const visibleDocs = await Promise.all(
      docs.map(async (doc) => ({
        doc,
        visible:
          doc.uploadedBy === req.user!.id ||
          (await canAccessAssignedDocument(req.user!.id, membership, doc.id, organizationId)),
      }))
    );

    res.status(200).json(
      visibleDocs.filter(({ visible }) => visible).map(({ doc }) => ({
        id: doc.id,
        name: doc.name,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        url: `/api/v1/documents/${doc.id}/download`,
        status: doc.status,
        createdAt: doc.createdAt,
      }))
    );
  } catch (error: any) {
    console.error("Document list error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch documents" });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id as string;

    const doc = await db.orm.public.Document.where({
      id: documentId,
    }).first();

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId: doc.organizationId,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this document" });
    }

    const canAccess =
      doc.uploadedBy === req.user!.id ||
      (await canAccessAssignedDocument(req.user!.id, membership, doc.id, doc.organizationId));

    if (!canAccess) {
      return res.status(403).json({ error: "You do not have access to this document" });
    }

    await db.orm.public.Document.where({
      id: documentId,
    }).delete();

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Document delete error:", error);
    res.status(500).json({ error: error?.message || "Failed to delete document" });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id as string;

    const doc = await db.orm.public.Document.where({
      id: documentId,
    }).first();

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const membership = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
      organizationId: doc.organizationId,
    }).first();

    if (!membership) {
      return res.status(403).json({ error: "You do not have access to this document" });
    }

    const canAccess =
      doc.uploadedBy === req.user!.id ||
      (await canAccessAssignedDocument(req.user!.id, membership, doc.id, doc.organizationId));

    if (!canAccess) {
      return res.status(403).json({ error: "You do not have access to this document" });
    }

    if (!doc.url) {
      return res.status(404).json({ error: "File URL not available" });
    }

    if (doc.url.includes("supabase.co")) {
      try {
        const signedUrl = await getSupabaseSignedUrl(doc.storageKey);
        res.redirect(signedUrl);
      } catch (error: any) {
        console.error("Supabase signed URL error:", error);
        res.status(500).json({ error: "Failed to generate download link" });
      }
    } else {
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
      res.redirect(doc.url);
    }
  } catch (error: any) {
    console.error("Document download error:", error);
    res.status(500).json({ error: error?.message || "Failed to download document" });
  }
};
