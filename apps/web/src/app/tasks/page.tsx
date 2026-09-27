"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";


type Task = {
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: string;
};

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem("nexora_token");

                if (!token) {
                    router.push("/login");
                    return;
                }

                const organizationsResponse = await fetch(
                    `${API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const organizationsData =
                    await organizationsResponse.json();

                if (
                    !organizationsResponse.ok ||
                    !organizationsData.organizations?.length
                ) {
                    setError("No organization found");
                    return;
                }

                const organizationId =
                    organizationsData.organizations[0].id;

                const projectsResponse = await fetch(
                    `${API_URL}/api/projects/${organizationId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const projectsData = await projectsResponse.json();

                if (
                    !projectsResponse.ok ||
                    !projectsData.projects?.length
                ) {
                    setError("No project found");
                    return;
                }

                const projectId = projectsData.projects[0].id;

                const response = await fetch(
                    `${API_URL}/api/tasks/project/${projectId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Failed to load tasks");
                    return;
                }

                setTasks(data.tasks);
            } catch (error) {
                console.error(error);
                setError("Unable to connect to Nexora API");
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [router]);
    const updateTaskStatus = async (
        taskId: string,
        status: "TODO" | "IN_PROGRESS" | "DONE"
    ) => {
        try {
            const token = localStorage.getItem("nexora_token");

            if (!token) {
                setError("Please sign in first.");
                return;
            }

            const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to update task");
                return;
            }

            setTasks((currentTasks) =>
                currentTasks.map((task) =>
                    task.id === taskId ? data.task : task
                )
            );
        } catch (error) {
            console.error(error);
            setError("Unable to connect to Nexora API");
        }
    };

    return (
        <main className="min-h-screen bg-[#09090b] px-8 py-10 text-white">
            <div className="mx-auto max-w-6xl">
                <div className="mb-10">
                    <p className="mb-2 text-sm font-medium text-violet-400">
                        NEXORA WORKSPACE
                    </p>

                    <h1 className="text-4xl font-bold tracking-tight">
                        Tasks
                    </h1>

                    <p className="mt-2 text-zinc-400">
                        Manage your project tasks and track progress.
                    </p>
                </div>

                {loading && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-zinc-400">
                        Loading tasks...
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                        {error}
                    </div>
                )}

                {!loading && !error && tasks.length === 0 && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-zinc-400">
                        No tasks found for this project.
                    </div>
                )}

                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl"
                        >
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-semibold">
                                            {task.title}
                                        </h2>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${task.priority === "HIGH"
                                                ? "bg-red-500/10 text-red-400"
                                                : task.priority === "MEDIUM"
                                                    ? "bg-yellow-500/10 text-yellow-400"
                                                    : "bg-green-500/10 text-green-400"
                                                }`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>

                                    {task.description && (
                                        <p className="mt-2 text-sm text-zinc-400">
                                            {task.description}
                                        </p>
                                    )}
                                </div>

                                <select
                                    value={task.status}
                                    onChange={(event) =>
                                        updateTaskStatus(
                                            task.id,
                                            event.target.value as Task["status"]
                                        )
                                    }
                                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
