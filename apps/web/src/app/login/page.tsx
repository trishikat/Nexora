"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

            localStorage.setItem("nexora_token", data.token);
            localStorage.setItem("nexora_user", JSON.stringify(data.user));

            router.push("/");
        } catch (error) {
            console.error(error);
            setError("Unable to connect to Nexora API");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Nexora<span className="text-indigo-400">.</span>
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Sign in to your workspace
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm text-slate-300">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-slate-600">
                    Nexora • Full-stack SaaS workspace
                </p>
            </div>
        </main>
    );
}