import express, { type Response } from "express";
import {
  createOrganization,
  joinOrganization,
  getMyOrganizations,
} from "../handlers/organizations";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/", authenticate, createOrganization);
router.post("/join", authenticate, joinOrganization);
router.get("/", authenticate, (req: AuthRequest, res: Response) => {
  getMyOrganizations(req, res);
});

export default router;
