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
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: "Organization name is required",
                });
            }

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const slug = name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

            const existingOrganization =
                await prisma.organization.findUnique({
                    where: { slug },
                });

            if (existingOrganization) {
                return res.status(409).json({
                    success: false,
                    message: "Organization with this name already exists",
                });
            }

            const organization = await prisma.organization.create({
                data: {
                    name,
                    slug,
                    memberships: {
                        create: {
                            userId: req.userId,
                            role: "OWNER",
                        },
                    },
                },
                include: {
                    memberships: true,
                },
            });

            res.status(201).json({
                success: true,
                message: "Organization created successfully",
                organization,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to create organization",
            });
        }
    }
);

router.get(
    "/",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const memberships = await prisma.membership.findMany({
                where: {
                    userId: req.userId,
                },
                include: {
                    organization: true,
                },
            });

            res.json({
                success: true,
                organizations: memberships.map((membership) => ({
                    id: membership.organization.id,
                    name: membership.organization.name,
                    slug: membership.organization.slug,
                    role: membership.role,
                })),
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch organizations",
            });
        }
    }
);
router.post(
    "/:organizationId/members",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const organizationId = req.params.organizationId as string;
            const { email, role } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            if (!email || !role) {
                return res.status(400).json({
                    success: false,
                    message: "Email and role are required",
                });
            }

            const allowedRoles = ["ADMIN", "MEMBER", "VIEWER"];

            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role",
                });
            }

            const requesterMembership =
                await prisma.membership.findUnique({
                    where: {
                        userId_organizationId: {
                            userId: req.userId,
                            organizationId,
                        },
                    },
                });

            if (!requesterMembership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            if (
                requesterMembership.role !== "OWNER" &&
                requesterMembership.role !== "ADMIN"
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to add members",
                });
            }

            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const existingMembership =
                await prisma.membership.findUnique({
                    where: {
                        userId_organizationId: {
                            userId: user.id,
                            organizationId,
                        },
                    },
                });

            if (existingMembership) {
                return res.status(409).json({
                    success: false,
                    message: "User is already a member of this organization",
                });
            }

            const membership = await prisma.membership.create({
                data: {
                    userId: user.id,
                    organizationId,
                    role,
                },
            });

            res.status(201).json({
                success: true,
                message: "Member added successfully",
                membership,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to add member",
            });
        }
    }
);
router.patch(
    "/:organizationId/members/:userId",
    authenticateToken,
    async (req: AuthRequest, res) => {
        try {
            const organizationId = req.params.organizationId as string;
            const userId = req.params.userId as string;
            const { role } = req.body;

            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                });
            }

            const allowedRoles = ["ADMIN", "MEMBER", "VIEWER"];

            if (!role || !allowedRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role",
                });
            }

            const requesterMembership =
                await prisma.membership.findUnique({
                    where: {
                        userId_organizationId: {
                            userId: req.userId,
                            organizationId,
                        },
                    },
                });

            if (!requesterMembership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            if (
                requesterMembership.role !== "OWNER" &&
                requesterMembership.role !== "ADMIN"
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to update member roles",
                });
            }

            const targetMembership =
                await prisma.membership.findUnique({
                    where: {
                        userId_organizationId: {
                            userId,
                            organizationId,
                        },
                    },
                });

            if (!targetMembership) {
                return res.status(404).json({
                    success: false,
                    message: "Member not found",
                });
            }

            if (targetMembership.role === "OWNER") {
                return res.status(403).json({
                    success: false,
                    message: "The organization owner role cannot be changed",
                });
            }

            const updatedMembership =
                await prisma.membership.update({
                    where: {
                        userId_organizationId: {
                            userId,
                            organizationId,
                        },
                    },
                    data: {
                        role,
                    },
                });

            res.json({
                success: true,
                message: "Member role updated successfully",
                membership: updatedMembership,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to update member role",
            });
        }
    }
);
router.get(
    "/:organizationId/members",
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

            const requesterMembership =
                await prisma.membership.findUnique({
                    where: {
                        userId_organizationId: {
                            userId: req.userId,
                            organizationId,
                        },
                    },
                });

            if (!requesterMembership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a member of this organization",
                });
            }

            const memberships = await prisma.membership.findMany({
                where: {
                    organizationId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            res.json({
                success: true,
                members: memberships.map((membership) => ({
                    id: membership.user.id,
                    name: membership.user.name,
                    email: membership.user.email,
                    role: membership.role,
                })),
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch organization members",
            });
        }
    }
);
export default router;