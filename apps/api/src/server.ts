import taskRoutes from "./routes/task.js";
import organizationRoutes from "./routes/organization.js";
import { authenticateToken, AuthRequest } from "./middleware/auth.js";
import projectRoutes from "./routes/project.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payment";
import prisma from "./prisma.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payments", paymentRoutes);
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Welcome to Nexora API 🚀",
    });
});

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Nexora API is running 🚀",
    });
});
app.get("/api/test-db", async (_req, res) => {
    try {
        const userCount = await prisma.user.count();

        res.json({
            success: true,
            message: "Database connection is working 🚀",
            userCount,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});
app.get("/api/protected", authenticateToken, (req, res) => {
    const authReq = req as AuthRequest;

    res.json({
        success: true,
        message: "You have access to this protected route 🚀",
        userId: authReq.userId,
    });
});

app.listen(PORT, () => {
    console.log(`Nexora API running on http://localhost:${PORT}`);
});