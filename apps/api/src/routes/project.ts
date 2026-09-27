import { Router } from "express";
import prisma from "../prisma.js";
import {
    authenticateToken,
    AuthRequest,
} from "../middleware/auth.js";

const router = Router();

router.post(
    "/",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const { organizationId, name, description } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            if (!organizationId || !name) {
                return res.status(400).json({
                    success: false,
                    message: "Organization ID and project name are required",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: req.userId,
                        organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            if (
                membership.role !== "OWNER" &&
                membership.role !== "ADMIN"
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to create projects",
                });
            }

            const project = await prisma.project.create({
                data: {
                    name,
                    description: description || null,
                    organizationId,
                },
            });

            res.status(201).json({
                success: true,
                message: "Project created successfully",
                project,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to create project",
            });
        }
    }
);
router.get(
    "/:organizationId",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const organizationId = req.params.organizationId as string;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: req.userId,
                        organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const projects = await prisma.project.findMany({
                where: {
                    organizationId,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            res.json({
                success: true,
                projects,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch projects",
            });
        }
    }
);

export default router;