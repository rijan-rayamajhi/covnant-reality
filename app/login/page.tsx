"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthContext";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const { signIn, authError, clearError } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsSubmitting(true);

        try {
            const { error } = await signIn(email, password);

            if (!error) {
                // Process pending save directly via Supabase (avoids context race condition)
                const pendingSave = localStorage.getItem("pendingSaveProperty");
                if (pendingSave) {
                    try {
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            await supabase
                                .from("saved_properties")
                                .upsert(
                                    { user_id: user.id, property_id: pendingSave },
                                    { onConflict: "user_id,property_id", ignoreDuplicates: true }
                                );
                        }
                    } catch (e) {
                        console.error("[Login] Failed to save pending property:", e);
                    } finally {
                        localStorage.removeItem("pendingSaveProperty");
                    }
                }

                const searchParams = new URLSearchParams(window.location.search);
                const redirectPath = searchParams.get("redirect");

                if (redirectPath && redirectPath.startsWith('/')) {
                    router.push(redirectPath);
                } else {
                    router.push('/');
                }
            }
        } catch (err) {
            console.error("Login error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <AuthLayout>
            <section className="flex flex-col gap-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Login to access your dashboard
                    </p>
                </div>

                {/* Error Display */}
                {authError && (
                    <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-sm font-medium text-danger">{authError}</p>
                    </div>
                )}

                {/* Form */}
                <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                    <div className="flex flex-col gap-4">
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
                    </div>

                    {/* Options */}
                    <div className="flex items-center justify-between mt-1">
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
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        className="mt-2 text-base h-12"
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

                {/* Footer Link */}
                <div className="text-center">
                    <p className="text-sm text-text-secondary">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </section>
        </AuthLayout>
    );
}
