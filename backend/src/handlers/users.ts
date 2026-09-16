import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { db } from "../lib/prisma/db";

export const createUser = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;
    console.log("Received user data:", { firstName, lastName, email, password });
    try {
        if (!firstName || !lastName) return res.status(400).json({ error: 'First name and last name are required' });
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (!password) return res.status(400).json({ error: 'Password is required' });
        // Prevent duplicate emails early
        const existing = await db.orm.public.User.where({ email }).first();
        if (existing) {
            return res.status(409).json({ error: 'A user with that email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await db.orm.public.User.create({
            firstName,
            lastName,
            email,
            passwordHash,
        });

        res.status(201).json(user);
    } catch (error) {
        // Log the error for debugging
        console.error('Error creating user:', error);

        // Handle Postgres unique-violation (email) if surfaced as a SQL error
        // Postgres unique violation SQLSTATE is '23505'
        if (error && typeof error === 'object' && 'sqlState' in error && (error as any).sqlState === '23505') {
            return res.status(409).json({ error: 'A user with that email already exists' });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (!password) return res.status(400).json({ error: 'Password is required' });

        const user = await db.orm.public.User.where({
             email 
        }).first();

        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { passwordHash, ...safeUser } = user as any;
        res.status(200).json(safeUser);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};