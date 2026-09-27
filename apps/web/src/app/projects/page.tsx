"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";

type Project = {
    id: string;
    name: string;
    description: string | null;
    organizationId: string;
    createdAt: string;
};

export default function ProjectsPage() {
    const router = useRouter();
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
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

                const organizationsData = await organizationsResponse.json();

                if (
                    !organizationsResponse.ok ||
                    !organizationsData.organizations?.length
                ) {
                    setError("No organization found");
                    return;
                }

                const organizationId =
                    organizationsData.organizations[0].id;

                const response = await fetch(
                    `${API_URL}/api/projects/${organizationId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Failed to load projects");
                    return;
                }

                setProjects(data.projects);
            } catch (error) {
                console.error(error);
                setError("Unable to connect to Nexora API");
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleCreateProject = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setCreating(true);
        setCreateError("");

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

            const organizationsData = await organizationsResponse.json();

            if (
                !organizationsResponse.ok ||
                !organizationsData.organizations?.length
            ) {
                setCreateError("No organization found");
                return;
            }

            const organizationId =
                organizationsData.organizations[0].id;

            const response = await fetch(`${API_URL}/api/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    organizationId: organizationId,
                    name: projectName,
                    description: projectDescription,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setCreateError(data.message || "Failed to create project");
                return;
            }

            setProjects((currentProjects) => [
                data.project,
                ...currentProjects,
            ]);

            setProjectName("");
            setProjectDescription("");
        } catch (error) {
            console.error(error);
            setCreateError("Unable to connect to Nexora API");
        } finally {
            setCreating(false);
        }
    };
    return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white md:px-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-10">
                    <p className="text-sm text-indigo-400">Workspace</p>

                    <h1 className="mt-2 text-4xl font-bold tracking-tight">
                        Projects
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage the projects inside your Nexora workspace.
                    </p>
                </div>
                <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">
                        Create a project
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Add a new project to your workspace.
                    </p>

                    <form
                        onSubmit={handleCreateProject}
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-sm text-slate-300">
                                Project name
                            </label>

                            <input
                                type="text"
                                value={projectName}
                                onChange={(event) => setProjectName(event.target.value)}
                                placeholder="e.g. Mobile App"
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">
                                Description
                            </label>

                            <textarea
                                value={projectDescription}
                                onChange={(event) =>
                                    setProjectDescription(event.target.value)
                                }
                                placeholder="Describe the project..."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                            />
                        </div>

                        {createError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {createError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={creating}
                            className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creating ? "Creating..." : "Create Project"}
                        </button>
                    </form>
                </div>

                {loading && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
                        Loading projects...
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-indigo-500/40"
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                                    P
                                </div>

                                <h2 className="text-xl font-semibold">
                                    {project.name}
                                </h2>

                                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
                                    {project.description || "No description provided."}
                                </p>

                                <div className="mt-6 border-t border-slate-800 pt-4">
                                    <p className="text-xs text-slate-500">
                                        Project ID
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-400">
                                        {project.id}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && projects.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
                        <h2 className="text-xl font-semibold">
                            No projects yet
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Create your first project to get started.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}