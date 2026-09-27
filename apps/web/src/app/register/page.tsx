"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                return;
            }

            setSuccess("Account created successfully! Redirecting to login...");

            setTimeout(() => {
                router.push("/login");
            }, 1200);
        } catch (error) {
            console.error(error);
            setError("Unable to connect to Nexora API");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold shadow-lg shadow-violet-600/20">
                        N
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Create your Nexora account
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                        Start managing your projects and tasks.
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-7 shadow-2xl">
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-300">
                                Full name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Your name"
                                required
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-300">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-zinc-300">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Create a password"
                                minLength={8}
                                required
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                            />

                            <p className="mt-2 text-xs text-zinc-500">
                                Use at least 8 characters.
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-400">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="font-medium text-violet-400 hover:text-violet-300"
                        >
                            Sign in
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}