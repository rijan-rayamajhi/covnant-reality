"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Lock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  fetchAgentProfile,
  updateAgentProfile,
  uploadAvatar,
  type AgentProfileRow,
} from "@/lib/supabase/agent-dashboard";

export function AdminProfileSettings() {
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");
  const [profile, setProfile] = useState<AgentProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg("Error: File size must be under 2MB.");
      setTimeout(() => setUploadMsg(null), 3000);
      return;
    }

    setUploadingAvatar(true);
    setUploadMsg(null);

    const { success, url, error } = await uploadAvatar(file);
    if (success && url) {
      if (profile) setProfile({ ...profile, avatar_url: url });
      await updateAgentProfile({ avatar_url: url });
      setUploadMsg("Avatar updated successfully!");
    } else {
      setUploadMsg(`Error: ${error || "Failed to upload avatar."}`);
    }

    setUploadingAvatar(false);
    setTimeout(() => setUploadMsg(null), 3000);
    e.target.value = "";
  };

  useEffect(() => {
    let cancelled = false;
    fetchAgentProfile()
      .then((p) => {
        if (!cancelled && p) {
          setProfile(p);
          setFullName(p.full_name ?? "");
          setEmail(p.email ?? "");
          setPhone(p.phone ?? "");
          setCity(p.city ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    const result = await updateAgentProfile({
      full_name: fullName,
      phone,
      city,
    });
    setSaving(false);
    if (result.success) {
      setSaveMsg("Profile updated successfully!");
      setTimeout(() => setSaveMsg(null), 3000);
    } else {
      setSaveMsg(`Error: ${result.error ?? "Failed to save"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Sidebar Menu & Avatar */}
      <div className="lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
        {/* Avatar Card */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-50 shadow-md relative group bg-slate-100 flex items-center justify-center transition-all group-hover:shadow-lg">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Admin Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white flex-col gap-1.5 backdrop-blur-[2px]">
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Update</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 leading-tight">
              {fullName || "Administrator"}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 font-bold text-[10px] text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin
            </div>

            {uploadMsg && (
              <div className={cn(
                "mt-4 text-xs font-bold px-4 py-2 rounded-xl transition-all animate-in fade-in slide-in-from-top-2",
                uploadMsg.startsWith('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              )}>
                {uploadMsg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Menu */}
        <Card className="border-slate-100 shadow-sm p-2">
          <CardContent className="p-0 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("general")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === "general"
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <User className="w-4 h-4 shrink-0" />
              General Details
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === "security"
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Lock className="w-4 h-4 shrink-0" />
              Security & Login
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === "general" && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="p-6 sm:p-8 border-b border-slate-50 bg-slate-50/30">
                <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                <p className="text-sm text-slate-400 font-medium mt-1">Manage your administrator details and how they appear in logs.</p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-300">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contact Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-300">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 00000 00000"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">City / Region</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-300">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Pune"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="flex-1">
                    {saveMsg && (
                      <p className={cn(
                        "text-sm font-bold animate-in fade-in slide-in-from-left-2",
                        saveMsg.startsWith("Error") ? "text-red-500" : "text-emerald-500"
                      )}>
                        {saveMsg}
                      </p>
                    )}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto px-10 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes…
                    </span>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="p-6 sm:p-8 border-b border-slate-50 bg-slate-50/30">
                <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                <p className="text-sm text-slate-400 font-medium mt-1">Updates to your login credentials for improved account safety.</p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-8">
                <div className="max-w-md space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-300">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-300">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-slate-300">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <Button className="w-full sm:w-auto px-10 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    Update Password
                </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
