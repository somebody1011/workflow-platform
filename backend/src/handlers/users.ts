import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../lib/prisma/db";
import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const JWT_EXPIRY = "7d";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "First name and last name are required" });
    }
    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const existing = await db.orm.public.User.where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.orm.public.User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      passwordHash,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    res.status(201).json(safeUser);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await db.orm.public.User.where({ email }).first();

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: __, ...safeUser } = user as any;
    res.status(200).json(safeUser);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logoutUser = async (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};

export const getMyOrganizations = async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await db.orm.public.OrganizationMember.where({
      userId: req.user!.id,
    }).include("organization").all();

    const organizations = memberships.map((membership) => membership.organization);

    res.status(200).json(organizations);
  } catch (error) {
    console.error("Get organizations error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
