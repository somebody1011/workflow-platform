import express, { type Response } from "express";
import { createUser, loginUser, logoutUser } from "../handlers/users";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = express.Router();

import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


router.post("/", authLimiter, createUser);
router.post("/login", authLimiter, loginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, (req: AuthRequest, res: Response) => {
  res.status(200).json(req.user);
});

export default router;
