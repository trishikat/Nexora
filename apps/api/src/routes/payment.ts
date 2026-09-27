import { Router } from "express";
import prisma from "../prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

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
                include: {
                    organization: {
                        include: {
                            memberships: true,
                        },
                    },
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }

            const isMember = project.organization.memberships.some(
                (membership) => membership.userId === req.userId
            );

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const payments = await prisma.payment.findMany({
                where: {
                    projectId,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            res.json({
                success: true,
                payments,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch payments",
            });
        }
    }
);
router.post(
    "/",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const {
                projectId,
                amount,
                currency,
                description,
                escrowAddress,
                transactionHash,
            } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            if (!projectId || !amount) {
                return res.status(400).json({
                    success: false,
                    message: "Project ID and amount are required",
                });
            }

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                },
                include: {
                    organization: {
                        include: {
                            memberships: true,
                        },
                    },
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }

            const isMember = project.organization.memberships.some(
                (membership) => membership.userId === req.userId
            );

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const payment = await prisma.payment.create({
                data: {
                    projectId,
                    amount,
                    currency,
                    description,
                    escrowAddress,
                    transactionHash,
                },
            });

            res.status(201).json({
                success: true,
                message: "Payment created successfully",
                payment,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to create payment",
            });
        }
    }
);
router.patch(
    "/:paymentId/status",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const paymentId = req.params.paymentId as string;
            const { status } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const allowedStatuses = [
                "PENDING",
                "COMPLETED",
                "FAILED",
                "REFUNDED",
            ];

            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment status",
                });
            }

            const payment = await prisma.payment.findUnique({
                where: {
                    id: paymentId,
                },
                include: {
                    project: {
                        include: {
                            organization: {
                                include: {
                                    memberships: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            const isMember =
                payment.project.organization.memberships.some(
                    (membership) => membership.userId === req.userId
                );

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not a member of this organization",
                });
            }

            const updatedPayment = await prisma.payment.update({
                where: {
                    id: paymentId,
                },
                data: {
                    status,
                },
            });

            res.json({
                success: true,
                message: "Payment status updated successfully",
                payment: updatedPayment,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to update payment status",
            });
        }
    }
);

export default router;