import express, { type Response } from "express";
import {
  createApprovalRequest,
  listApprovalRequests,
  getApprovalRequest,
} from "../handlers/approval-requests";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/", authenticate, (req: AuthRequest, res: Response) => {
  createApprovalRequest(req, res);
});
router.get("/", authenticate, (req: AuthRequest, res: Response) => {
  listApprovalRequests(req, res);
});
router.get("/:id", authenticate, (req: AuthRequest, res: Response) => {
  getApprovalRequest(req, res);
});

export default router;
