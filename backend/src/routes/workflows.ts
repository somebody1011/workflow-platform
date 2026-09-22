import express, { type Response } from "express";
import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "../handlers/workflows";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticate, (req: AuthRequest, res: Response) => {
  listWorkflows(req, res);
});
router.get("/:id", authenticate, (req: AuthRequest, res: Response) => {
  getWorkflow(req, res);
});
router.post("/", authenticate, (req: AuthRequest, res: Response) => {
  createWorkflow(req, res);
});
router.put("/:id", authenticate, (req: AuthRequest, res: Response) => {
  updateWorkflow(req, res);
});
router.delete("/:id", authenticate, (req: AuthRequest, res: Response) => {
  deleteWorkflow(req, res);
});

export default router;
