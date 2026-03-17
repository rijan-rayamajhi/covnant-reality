import { Metadata } from "next";
import { AdminProfileSettings } from "@/components/admin/AdminProfileSettings";

export const metadata: Metadata = {
    title: "Profile Settings | Admin Panel — Covnant Reality India PVT LTD",
};

export default function AdminProfilePage() {
    return (
        <div className="flex-1 p-4 md:p-8 lg:p-10 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight transition-all">Profile Settings</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your administrative account and security preferences.</p>
                </div>

                <AdminProfileSettings />
            </div>
        </div>
    );
}
