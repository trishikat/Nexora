"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";
const ORGANIZATION_ID = "cmub6mw420000t8s6fydeu1p5";

type Member = {
    id: string;
    name: string;
    email: string;
    role: string;
};

export default function TeamPage() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [roleSuccess, setRoleSuccess] = useState("");

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState("");

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const token = localStorage.getItem("nexora_token");

                if (!token) {
                    router.push("/login");
                    return;
                }
                const response = await fetch(
                    `${API_URL}/api/organizations/${ORGANIZATION_ID}/members`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Failed to load team members");
                    return;
                }

                setMembers(data.members);
            } catch (error) {
                console.error(error);
                setError("Unable to connect to Nexora API");
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const handleAddMember = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setAdding(true);
        setAddError("");
        setAddSuccess("");

        try {
            const token = localStorage.getItem("nexora_token");

            if (!token) {
                setAddError("Please sign in first.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/organizations/${ORGANIZATION_ID}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        email,
                        role,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setAddError(data.message || "Failed to add member");
                return;
            }

            const membersResponse = await fetch(
                `${API_URL}/api/organizations/${ORGANIZATION_ID}/members`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const membersData = await membersResponse.json();

            if (membersResponse.ok) {
                setMembers(membersData.members);
            }

            setEmail("");
            setRole("MEMBER");
            setAddSuccess("Member added successfully.");
        } catch (error) {
            console.error(error);
            setAddError("Unable to connect to Nexora API");
        } finally {
            setAdding(false);
        }
    };
    const handleRoleChange = async (
        userId: string,
        newRole: string
    ) => {
        try {
            const token = localStorage.getItem("nexora_token");

            if (!token) {
                setError("Please sign in first.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/organizations/${ORGANIZATION_ID}/members/${userId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        role: newRole,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to update member role");
                return;
            }

            setMembers((currentMembers) =>
                currentMembers.map((member) =>
                    member.id === userId
                        ? { ...member, role: newRole }
                        : member
                )
            );
            setRoleSuccess("Member role updated successfully.");
        } catch (error) {
            console.error(error);
            setError("Unable to connect to Nexora API");
        }
    };
    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <p className="text-sm text-indigo-400">
                        Nexora Workspace
                    </p>

                    <h1 className="mt-2 text-3xl font-bold">
                        Team
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage the members of your organization.
                    </p>
                </div>

                {loading && (
                    <p className="text-slate-400">
                        Loading team members...
                    </p>
                )}

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                        {error}
                    </div>
                )}
                {roleSuccess && (
                    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                        {roleSuccess}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-semibold">
                                Add Team Member
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Invite an existing Nexora user to your organization.
                            </p>

                            <form
                                onSubmit={handleAddMember}
                                className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto]"
                            >
                                <input
                                    type="email"
                                    placeholder="member@example.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                                />

                                <select
                                    value={role}
                                    onChange={(event) =>
                                        setRole(event.target.value)
                                    }
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>

                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {adding ? "Adding..." : "Add Member"}
                                </button>
                            </form>

                            {addError && (
                                <p className="mt-4 text-sm text-red-400">
                                    {addError}
                                </p>
                            )}

                            {addSuccess && (
                                <p className="mt-4 text-sm text-emerald-400">
                                    {addSuccess}
                                </p>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                            <div className="border-b border-slate-800 px-6 py-4">
                                <h2 className="font-semibold">
                                    Organization Members
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {members.length} member
                                    {members.length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            <div className="divide-y divide-slate-800">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {member.name}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {member.email}
                                            </p>
                                        </div>

                                        <select
                                            value={member.role}
                                            onChange={(event) =>
                                                handleRoleChange(member.id, event.target.value)
                                            }
                                            disabled={member.role === "OWNER"}
                                            className="w-fit rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-indigo-300 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="OWNER">Owner</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="MEMBER">Member</option>
                                            <option value="VIEWER">Viewer</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}