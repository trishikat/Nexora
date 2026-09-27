"use client";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import escrowArtifact from "@/contracts/NexoraEscrow.json";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const API_URL = "http://localhost:5000";

const ESCROW_CONTRACT_ADDRESS =
    "0x0165878A594ca255338adfa4d48449f69242Eb8F";

const ESCROW_ABI = [
    "constructor(address payable _seller)",
    "function getBalance() view returns (uint256)",
    "function status() view returns (uint8)",
    "function releaseFunds()",
    "function refundBuyer()",
];

const SELLER_ADDRESS =
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
type Payment = {
    id: string;
    amount: string;
    currency: string;
    status: string;
    description: string | null;
    escrowAddress: string | null;
    transactionHash: string | null;
    createdAt: string;
};

export default function PaymentsPage() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState("");
    const [error, setError] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState("");
    const [projectId, setProjectId] = useState("");

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const token = localStorage.getItem("nexora_token");

                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/payments/project/${projectId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Failed to load payments");
                    return;
                }

                setPayments(data.payments);
            } catch (error) {
                console.error(error);
                setError("Unable to connect to Nexora API");
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);
    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                setError("Please install MetaMask first.");
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);

            const network = await provider.getNetwork();

            if (network.chainId !== BigInt(31337)) {
                setError("Please switch MetaMask to Hardhat Localhost.");
                return;
            }

            await provider.send("eth_requestAccounts", []);

            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setWalletAddress(address);
            setError("");
        } catch (error) {
            console.error(error);
            setError("Failed to connect MetaMask.");
        }
    };
    const releaseEscrow = async (
        escrowAddress: string,
        paymentId: string
    ) => {
        try {
            setError("");
            setSuccess("");

            if (!window.ethereum) {
                setError("Please install MetaMask first.");
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);

            const network = await provider.getNetwork();

            if (network.chainId !== BigInt(31337)) {
                setError("Please switch MetaMask to Hardhat Localhost.");
                return;
            }

            const signer = await provider.getSigner();

            const escrowContract = new ethers.Contract(
                escrowAddress,
                ESCROW_ABI,
                signer
            );

            const transaction = await escrowContract.releaseFunds();

            setSuccess("Release transaction submitted. Waiting for confirmation...");

            await transaction.wait();

            await updatePaymentStatus(paymentId, "COMPLETED");

            setSuccess("Funds released successfully.");

        } catch (error) {
            console.error(error);
            setError("Failed to release escrow funds.");
        }
    };
    const refundEscrow = async (
        escrowAddress: string,
        paymentId: string
    ) => {
        try {
            setError("");
            setSuccess("");

            if (!window.ethereum) {
                setError("Please install MetaMask first.");
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);

            const network = await provider.getNetwork();

            if (network.chainId !== BigInt(31337)) {
                setError("Please switch MetaMask to Hardhat Localhost.");
                return;
            }

            const signer = await provider.getSigner();

            const escrowContract = new ethers.Contract(
                escrowAddress,
                ESCROW_ABI,
                signer
            );

            const transaction = await escrowContract.refundBuyer();

            setSuccess(
                "Refund transaction submitted. Waiting for confirmation..."
            );

            await transaction.wait();

            await updatePaymentStatus(paymentId, "REFUNDED");

            setSuccess("Funds refunded successfully.");
        } catch (error) {
            console.error(error);
            setError("Failed to refund escrow funds.");
        }
    };
    const createEscrowPayment = async () => {
        try {
            setError("");
            setSuccess("");

            if (!walletAddress) {
                setError("Please connect MetaMask first.");
                return;
            }

            if (!amount) {
                setError("Please enter a payment amount.");
                return;
            }

            if (!window.ethereum) {
                setError("Please install MetaMask first.");
                return;
            }

            const token = localStorage.getItem("nexora_token");

            if (!token) {
                setError("Please sign in first.");
                return;
            }

            setCreating(true);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const EscrowFactory = new ethers.ContractFactory(
                ESCROW_ABI,
                escrowArtifact.bytecode,
                signer
            );

            console.log("Deploying new escrow...");

            const escrow = await EscrowFactory.deploy(
                SELLER_ADDRESS,
                {
                    value: ethers.parseEther(amount),
                }
            );

            await escrow.waitForDeployment();

            const escrowAddress = await escrow.getAddress();

            const deploymentTransaction = escrow.deploymentTransaction();
            const transactionHash = deploymentTransaction?.hash ?? "";

            console.log("Escrow deployed:", escrowAddress);
            console.log("Transaction:", transactionHash);

            const response = await fetch(`${API_URL}/api/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    projectId: projectId,
                    amount,
                    currency: "ETH",
                    description,
                    escrowAddress,
                    transactionHash,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Escrow was created but payment record failed."
                );
                return;
            }

            setPayments((currentPayments) => [
                data.payment,
                ...currentPayments,
            ]);

            setAmount("");
            setDescription("");

            setSuccess(
                `Escrow payment created successfully: ${escrowAddress}`
            );
        } catch (error) {
            console.error(error);
            setError("Failed to create escrow payment.");
        } finally {
            setCreating(false);
        }
    };
    const createPayment = async () => {
        try {
            setError("");
            setSuccess("");

            if (!amount) {
                setError("Please enter a payment amount.");
                return;
            }

            const token = localStorage.getItem("nexora_token");

            if (!token) {
                setError("Please sign in first.");
                return;
            }

            setCreating(true);

            const response = await fetch(`${API_URL}/api/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    projectId: projectId,
                    amount,
                    currency: "ETH",
                    description,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to create payment");
                return;
            }

            setPayments((currentPayments) => [
                data.payment,
                ...currentPayments,
            ]);

            setAmount("");
            setDescription("");
            setSuccess("Payment created successfully.");
        } catch (error) {
            console.error(error);
            setError("Unable to connect to Nexora API");
        } finally {
            setCreating(false);
        }
    };

    const updatePaymentStatus = async (
        paymentId: string,
        status: string
    ) => {
        try {
            setError("");
            setSuccess("");

            const token = localStorage.getItem("nexora_token");

            if (!token) {
                setError("Please sign in first.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/payments/${paymentId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || "Failed to update payment status"
                );
                return;
            }

            setPayments((currentPayments) =>
                currentPayments.map((payment) =>
                    payment.id === paymentId
                        ? data.payment
                        : payment
                )
            );

            setSuccess("Payment status updated successfully.");
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
                        Payments
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage payments, transactions, and Web3 escrow.
                    </p>
                    <div className="mt-4">
                        {walletAddress ? (
                            <p className="text-sm text-emerald-400">
                                Wallet connected: {walletAddress}
                            </p>
                        ) : (
                            <button
                                onClick={connectWallet}
                                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                            >
                                Connect MetaMask
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-lg font-semibold">
                        Create Payment
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Create a payment record for this project.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="Amount in ETH"
                            value={amount}
                            onChange={(event) =>
                                setAmount(event.target.value)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                        />

                        <input
                            type="text"
                            placeholder="Payment description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                        />
                    </div>

                    <button
                        onClick={createEscrowPayment}
                        disabled={creating}
                        className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Create Escrow Payment
                    </button>
                    <button
                        onClick={createPayment}
                        disabled={creating}
                        className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Create Payment"}
                    </button>

                    {success && (
                        <p className="mt-4 text-sm text-emerald-400">
                            {success}
                        </p>
                    )}

                    {error && (
                        <p className="mt-4 text-sm text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <p className="text-sm text-slate-400">
                            Total Payments
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {payments.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <p className="text-sm text-slate-400">
                            Pending
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {
                                payments.filter(
                                    (payment) =>
                                        payment.status === "PENDING"
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <p className="text-sm text-slate-400">
                            Completed
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {
                                payments.filter(
                                    (payment) =>
                                        payment.status === "COMPLETED"
                                ).length
                            }
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-lg font-semibold">
                        Payment Activity
                    </h2>

                    {loading && (
                        <p className="mt-4 text-sm text-slate-500">
                            Loading payments...
                        </p>
                    )}

                    {!loading && error && (
                        <p className="mt-4 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    {!loading && !error && (
                        <>
                            {payments.length === 0 ? (
                                <p className="mt-2 text-sm text-slate-500">
                                    No payments have been created yet.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">
                                                    {payment.amount}{" "}
                                                    {payment.currency}
                                                </p>

                                                <div className="flex items-center">
                                                    <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                                                        {payment.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {payment.description && (
                                                <p className="mt-2 text-sm text-slate-400">
                                                    {payment.description}
                                                </p>
                                            )}
                                            {payment.escrowAddress && (
                                                <p className="mt-2 break-all text-xs text-slate-500">
                                                    Escrow: {payment.escrowAddress}
                                                </p>
                                            )}
                                            {payment.escrowAddress && payment.status === "PENDING" && (
                                                <button
                                                    onClick={() =>
                                                        releaseEscrow(payment.escrowAddress!, payment.id)
                                                    }
                                                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                                                >
                                                    Release Funds
                                                </button>
                                            )}
                                            {payment.escrowAddress && payment.status === "PENDING" && (
                                                <button
                                                    onClick={() =>
                                                        refundEscrow(payment.escrowAddress!, payment.id)
                                                    }
                                                    className="mt-4 ml-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                                                >
                                                    Refund Funds
                                                </button>
                                            )}
                                            {payment.transactionHash && (
                                                <p className="mt-2 break-all text-xs text-slate-500">
                                                    Transaction: {payment.transactionHash}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-slate-500">
                                                {new Date(
                                                    payment.createdAt
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}