import express, { type Response } from "express"
import {
  listOrganizationMembers,
  listRoles,
  listDepartments,
  inviteMember,
} from "../handlers/organization-members"
import { authenticate, type AuthRequest } from "../middleware/auth"

const router = express.Router()

router.get("/", authenticate, (req: AuthRequest, res: Response) => {
  listOrganizationMembers(req, res)
})

router.get("/roles", authenticate, (req: AuthRequest, res: Response) => {
  listRoles(req, res)
})

router.get("/departments", authenticate, (req: AuthRequest, res: Response) => {
  listDepartments(req, res)
})

router.post("/invite", authenticate, (req: AuthRequest, res: Response) => {
  inviteMember(req, res)
})

export default router
