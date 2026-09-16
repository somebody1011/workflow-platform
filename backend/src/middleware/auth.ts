import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decodedPayload = jwt.verify(token, JWT_SECRET) as unknown;

    if (!decodedPayload || typeof decodedPayload !== 'object') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const maybe = decodedPayload as Record<string, unknown>;
    const id = maybe.id as string | undefined;
    const email = maybe.email as string | undefined;
    const firstName = maybe.firstName as string | undefined;
    const lastName = maybe.lastName as string | undefined;

    if (!id || !email || !firstName || !lastName) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = { id, email, firstName, lastName };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
