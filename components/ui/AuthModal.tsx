"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, User, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth, getDashboardPath } from "@/components/AuthContext";

type ViewState = "login" | "signup";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: ViewState;
}

export function AuthModal({ isOpen, onClose, initialView = "login" }: AuthModalProps) {
    const router = useRouter();
    const [view, setView] = useState<ViewState>(initialView);
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const { signIn, authError, clearError } = useAuth();

    // Login form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            // Save previously focused element for restoration
            previousActiveElement.current = document.activeElement as HTMLElement;

            document.body.style.overflow = "hidden";
            document.addEventListener("keydown", handleKeyDown);

            // Focus the modal for keyboard navigation
            requestAnimationFrame(() => {
                const firstInput = modalRef.current?.querySelector<HTMLInputElement>("input");
                if (firstInput) firstInput.focus();
            });
        } else {
            document.body.style.overflow = "unset";
            document.removeEventListener("keydown", handleKeyDown);

            // Restore focus on close
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = "unset";
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsSubmitting(true);

        try {
            const { error, role } = await signIn(email, password);

            setIsSubmitting(false);
            if (!error) {
                onClose();
                router.push(getDashboardPath(role));
            }
        } catch (err) {
            console.error("Login error:", err);
            setIsSubmitting(false);
        }
    };



    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            <div
                ref={modalRef}
                className="w-full max-w-[420px] sm:max-w-[460px] relative animate-in zoom-in-95 duration-200 slide-in-from-bottom-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-text-secondary hover:bg-slate-200 hover:text-text-primary transition-colors"
                    aria-label="Close login dialog"
                >
                    <X className="w-4 h-4" />
                </button>

                <Card className="w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <CardContent className="px-5 py-6 sm:px-8 sm:py-8 overflow-y-auto">

                        {/* Title Section */}
                        <div className="text-center mb-6 mt-2">
                            <h2 id="auth-modal-title" className="text-2xl font-bold text-text-primary mb-1.5">
                                {view === "login" ? "Welcome Back" : "Create Account"}
                            </h2>
                            <p className="text-sm text-text-secondary">
                                {view === "login" ? "Login to access your dashboard" : "Select your role to get started"}
                            </p>
                        </div>

                        {/* Login View */}
                        {view === "login" && (
                            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
                                {/* Error Display */}
                                {authError && (
                                    <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm text-danger font-medium">
                                        {authError}
                                    </div>
                                )}

                                <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <Input
                                        label="Password"
                                        type="password"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <div className="flex items-center justify-between mt-1 mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 transition-colors"
                                            />
                                            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                                                Remember me
                                            </span>
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                                            onClick={onClose}
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        className="h-12 text-base"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Signing in...
                                            </span>
                                        ) : (
                                            "Login"
                                        )}
                                    </Button>
                                </form>



                                <p className="text-sm text-center text-text-secondary mt-2">
                                    Don&apos;t have an account?{" "}
                                    <button
                                        type="button"
                                        className="font-medium text-primary hover:text-primary-hover transition-colors"
                                        onClick={() => { clearError(); setView("signup"); }}
                                    >
                                        Sign Up
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* Signup View / Role Select */}
                        {view === "signup" && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                {[
                                    { href: "/signup", icon: <User className="w-5 h-5" />, title: "Buyer", desc: "Search and connect with sellers" },
                                    { href: "/signup", icon: <Home className="w-5 h-5" />, title: "Tenant", desc: "Find rental properties" },
                                    // { href: "/signup", icon: <Building2 className="w-5 h-5" />, title: "Agent", desc: "Manage listings and leads" },
                                ].map((role) => (
                                    <Link
                                        key={role.title}
                                        href={role.href}
                                        onClick={onClose}
                                        className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                            {role.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{role.title}</h3>
                                            <p className="text-xs text-text-secondary mt-0.5">{role.desc}</p>
                                        </div>
                                    </Link>
                                ))}

                                <p className="text-sm text-center text-text-secondary mt-4">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        className="font-medium text-primary hover:text-primary-hover transition-colors"
                                        onClick={() => { clearError(); setView("login"); }}
                                    >
                                        Log in
                                    </button>
                                </p>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
