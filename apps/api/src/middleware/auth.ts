import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token required",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as { userId: string };

        req.userId = decoded.userId;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};