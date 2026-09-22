import express, { type Response } from "express";
import {
  submitApprovalAction,
  listApprovalActions,
} from "../handlers/approval-actions";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/:id/actions", authenticate, (req: AuthRequest, res: Response) => {
  submitApprovalAction(req, res);
});
router.get("/:id/actions", authenticate, (req: AuthRequest, res: Response) => {
  listApprovalActions(req, res);
});

export default router;
