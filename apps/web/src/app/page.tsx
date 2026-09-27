"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";



type Project = {
  id: string;
  name: string;
  description: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  project?: {
    name: string;
  };
};

type Member = {
  id: string;
  role: string;
  user: {
    name: string;
    email: string;
  };
};

type Payment = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  description: string | null;
};

export default function Home() {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("nexora_token");
    localStorage.removeItem("nexora_user");
    router.push("/login");
  };
  const pathname = usePathname();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(true);

  const activePage =
    pathname === "/"
      ? "Dashboard"
      : pathname === "/projects"
        ? "Projects"
        : pathname === "/tasks"
          ? "Tasks"
          : pathname === "/team"
            ? "Team"
            : pathname === "/payments"
              ? "Payments"
              : "Dashboard";

  useEffect(() => {
    const token = localStorage.getItem("nexora_token");
    const storedUser = localStorage.getItem("nexora_user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || "");
    }
  }, [router]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("nexora_token");

        if (!token) {
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const organizationsResponse = await fetch(
          `${API_URL}/api/organizations`,
          { headers }
        );

        const organizationsData = await organizationsResponse.json();

        if (!organizationsResponse.ok || !organizationsData.organizations?.length) {
          setLoading(false);
          return;
        }

        const currentOrganization = organizationsData.organizations[0];
        setUserRole(currentOrganization.role || "");
        setOrganizationName(currentOrganization.name || "");
        setOrganizationId(currentOrganization.id);

        const projectsResponse = await fetch(
          `${API_URL}/api/projects/${currentOrganization.id}`,
          { headers }
        );

        const projectsData = await projectsResponse.json();

        if (!projectsResponse.ok) {
          setLoading(false);
          return;
        }

        const loadedProjects = projectsData.projects || [];

        setProjects(loadedProjects);

        if (!loadedProjects.length) {
          setLoading(false);
          return;
        }

        const currentProject = loadedProjects[0];

        setProjectId(currentProject.id);

        const [tasksResponse, membersResponse, paymentsResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/tasks/project/${currentProject.id}`,
              { headers }
            ),
            fetch(
              `${API_URL}/api/organizations/${currentOrganization.id}/members`,
              { headers }
            ),
            fetch(
              `${API_URL}/api/payments/project/${currentProject.id}`,
              { headers }
            ),
          ]);

        const tasksData = await tasksResponse.json();
        const membersData = await membersResponse.json();
        const paymentsData = await paymentsResponse.json();



        if (projectsResponse.ok) {
          setProjects(projectsData.projects || []);
        }

        if (tasksResponse.ok) {
          setTasks(tasksData.tasks || []);
        }

        if (membersResponse.ok) {
          setMembers(membersData.members || []);
        }

        if (paymentsResponse.ok) {
          setPayments(paymentsData.payments || []);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === "PENDING"
  ).length;

  const completedPayments = payments.filter(
    (payment) => payment.status === "COMPLETED"
  ).length;

  const totalPaymentAmount = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const stats = [
    {
      label: "Projects",
      value: projects.length,
      description: "Active workspace projects",
      href: "/projects",
    },
    {
      label: "Tasks",
      value: tasks.length,
      description:
        inProgressTasks > 0
          ? `${inProgressTasks} in progress`
          : `${completedTasks} completed`,
      href: "/tasks",
    },
    {
      label: "Team Members",
      value: members.length,
      description: "Workspace members",
      href: "/team",
    },
    {
      label: "Payments",
      value: `${totalPaymentAmount.toFixed(2)} ETH`,
      description:
        pendingPayments > 0
          ? `${pendingPayments} pending`
          : `${completedPayments} completed`,
      href: "/payments",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-950 p-6 md:block">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight">
              Nexora<span className="text-indigo-400">.</span>
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              SaaS workspace
            </p>
          </div>

          <nav className="space-y-2">
            {[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/projects" },
              { label: "Tasks", href: "/tasks" },
              { label: "Team", href: "/team" },
              { label: "Payments", href: "/payments" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm transition ${pathname === item.href
                  ? "bg-indigo-500/10 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500">
              Workspace
            </p>

            <p className="mt-1 font-medium">
              {organizationName}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {userRole}
            </p>
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1">

          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5 md:px-10">
            <div>
              <p className="text-sm text-slate-500">
                Workspace
              </p>

              <h2 className="text-xl font-semibold">
                {activePage}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Logout
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 font-semibold">
                T
              </div>
            </div>
          </header>

          {/* Dashboard content */}
          <div className="p-6 md:p-10">

            {/* Hero */}
            <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-medium text-indigo-400">
                  Welcome back, {userName}
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                  Your workspace at a glance.
                </h1>

                <p className="mt-3 max-w-2xl text-slate-400">
                  Manage projects, tasks, your team and
                  Web3 payments from one workspace.
                </p>
              </div>

              <Link
                href="/projects"
                className="rounded-xl bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                View Projects
              </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900"
                >
                  <p className="text-sm text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {loading ? "—" : stat.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {loading
                      ? "Loading..."
                      : stat.description}
                  </p>
                </Link>
              ))}
            </div>

            {/* Main grid */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">

              {/* Tasks */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Recent Tasks
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Track your current work.
                    </p>
                  </div>

                  <Link
                    href="/tasks"
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {loading ? (
                    <p className="text-sm text-slate-500">
                      Loading tasks...
                    </p>
                  ) : tasks.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No tasks yet.
                    </p>
                  ) : (
                    tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {task.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {task.project?.name ||
                              "Nexora project"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                            {task.status.replace(
                              "_",
                              " "
                            )}
                          </span>

                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workspace overview */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-500/10 to-slate-900 p-6">
                <p className="text-sm text-slate-500">
                  Workspace Overview
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  {organizationName}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Your centralized workspace for project
                  management, collaboration and Web3
                  payments.
                </p>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/projects"
                    className="block rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    Manage Projects
                  </Link>

                  <Link
                    href="/team"
                    className="block rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    Manage Team
                  </Link>

                  <Link
                    href="/payments"
                    className="block rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Open Web3 Payments
                  </Link>
                </div>
              </div>
            </div>

            {/* Payment summary */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Payment Overview
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Recent Web3 payment activity.
                  </p>
                </div>

                <Link
                  href="/payments"
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  View payments
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-500">
                    Total Payments
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {loading ? "—" : payments.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-500">
                    Completed
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {loading ? "—" : completedPayments}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-500">
                    Pending
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-400">
                    {loading ? "—" : pendingPayments}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}