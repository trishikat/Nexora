import { Router } from "express";
import prisma from "../prisma.js";
import {
    authenticateToken,
    AuthRequest,
} from "../middleware/auth.js";

const router = Router();

// Create a task
router.post(
    "/",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const { projectId, title, description, priority } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            if (!projectId || !title) {
                return res.status(400).json({
                    success: false,
                    message: "Project ID and task title are required",
                });
            }

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: req.userId,
                        organizationId: project.organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    description: description || null,
                    priority: priority || "MEDIUM",
                    projectId,
                },
            });

            res.status(201).json({
                success: true,
                message: "Task created successfully",
                task,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to create task",
            });
        }
    }
);
router.get(
    "/project/:projectId",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const projectId = req.params.projectId as string;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: req.userId,
                        organizationId: project.organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const tasks = await prisma.task.findMany({
                where: {
                    projectId,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            res.json({
                success: true,
                tasks,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch tasks",
            });
        }
    }
);
router.patch(
    "/:taskId",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const taskId = req.params.taskId as string;
            const { title, description, status, priority } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const task = await prisma.task.findUnique({
                where: {
                    id: taskId,
                },
                include: {
                    project: true,
                },
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: req.userId,
                        organizationId: task.project.organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const updatedTask = await prisma.task.update({
                where: {
                    id: taskId,
                },
                data: {
                    title: title ?? task.title,
                    description: description ?? task.description,
                    status: status ?? task.status,
                    priority: priority ?? task.priority,
                },
            });

            res.json({
                success: true,
                message: "Task updated successfully",
                task: updatedTask,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to update task",
            });
        }
    }
);
router.delete(
    "/:taskId",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const taskId = req.params.taskId as string;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const task = await prisma.task.findUnique({
                where: {
                    id: taskId,
                },
                include: {
                    project: true,
                },
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: req.userId,
                        organizationId: task.project.organizationId,
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
                    message: "You do not have permission to delete tasks",
                });
            }

            await prisma.task.delete({
                where: {
                    id: taskId,
                },
            });

            res.json({
                success: true,
                message: "Task deleted successfully",
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to delete task",
            });
        }
    }
);
export default router;