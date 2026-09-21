import express, { type Response } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { uploadDocument, listDocuments, deleteDocument, downloadDocument } from "../handlers/documents";

const router = express.Router();

router.get("/", authenticate, listDocuments);
router.post("/upload", authenticate, uploadDocument);
router.delete("/:id", authenticate, deleteDocument);
router.get("/:id/download", authenticate, downloadDocument);

export default router;
