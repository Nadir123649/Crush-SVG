"use client";

import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { apiFetch, authFetch } from "@/lib/client/http";
import { showToast } from "@/lib/client/toast-bridge";

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "CrushSVG Production",
    supportEmail: "support@crushsvg.net",
    logoUrl: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiFetch<{ settings: any }>("/api/v1/admin/settings");
        if (response?.settings) {
          setSettings(response.settings);
        }
      } catch (err) {
        showToast("error", "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const response = await apiFetch<{ settings: any }>("/api/v1/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          siteName: settings.siteName,
          supportEmail: settings.supportEmail,
        }),
      });
      if (response?.settings) {
        setSettings(response.settings);
        showToast("success", "Settings saved successfully!");
      }
    } catch (err) {
      showToast("error", "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      showToast("error", "Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "File too large. Maximum size is 2MB for logos.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await authFetch("/api/v1/uploads", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image");
      }
      
      const uploadData = await uploadRes.json();

      const logoUrl = uploadData?.payload?.url;
      if (logoUrl) {
        const response = await apiFetch<{ settings: any }>("/api/v1/admin/settings", {
          method: "PATCH",
          body: JSON.stringify({ logoUrl }),
        });
        if (response?.settings) {
          setSettings(response.settings);
          showToast("success", "Logo updated successfully!");
        }
      }
    } catch (err) {
      showToast("error", "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings.logoUrl) return;
    setUploadingLogo(true);
    try {
      const response = await apiFetch<{ settings: any }>("/api/v1/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ logoUrl: "" }),
      });
      if (response?.settings) {
        setSettings(response.settings);
        showToast("success", "Logo removed successfully!");
      }
    } catch (err) {
      showToast("error", "Failed to remove logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      showToast("error", "Email and password are required.");
      return;
    }
    setAddingAdmin(true);
    try {
      const res = await apiFetch<{ message?: string }>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: adminEmail, password: adminPassword, role: "admin" })
      });
      showToast("success", res?.message || `Admin created! Verification email sent to ${adminEmail}`);
      setAdminEmail("");
      setAdminPassword("");
    } catch (err: any) {
      if (err.status === 409) {
        showToast("error", "A user with this email already exists.");
      } else {
        showToast("error", err.message || "Failed to add admin user.");
      }
    } finally {
      setAddingAdmin(false);
    }
  };
  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Title */}
      <div className="mb-2">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Settings</h2>
        <p className="font-body text-text-muted">Manage your organization's preferences, API keys, and billing.</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        {/* ROW 1 */}
        {/* General Settings Card */}
        <section className="xl:col-span-2 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col h-full">
          <h3 className="font-heading font-semibold text-xl text-text-dark mb-4">General Information</h3>
          <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
          
          <form className="space-y-6 flex-1 flex flex-col" onSubmit={handleSaveSettings}>
            {/* Logo Upload Area */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-[12px] border border-[#F2EDE8] bg-[#FFFCFA] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {settings.logoUrl ? (
                  <Image src={settings.logoUrl} alt="Organization Logo" fill className="object-contain p-4" />
                ) : (
                  <Image src="/crushsvg.webp" alt="Organization Logo" fill className="object-contain p-4 opacity-30" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <h4 className="font-body font-bold text-sm text-text-dark">Organization Logo</h4>
                <p className="font-body text-sm text-text-muted">Recommended size: 256x256px. JPG, PNG, or SVG.</p>
                <div className="flex gap-2 mt-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleLogoUpload}
                  />
                  <button type="button" disabled={uploadingLogo} onClick={() => fileInputRef.current?.click()} className="bg-[#FFFCFA] text-text-dark font-body font-semibold text-sm px-4 py-2 rounded-[8px] border border-[#F2EDE8] hover:bg-gray-50 transition-colors disabled:opacity-50">
                    Upload New
                  </button>
                  <button type="button" disabled={uploadingLogo || !settings.logoUrl} onClick={handleRemoveLogo} className="text-red-600 font-body font-semibold text-sm px-4 py-2 rounded-[8px] hover:bg-red-50 transition-colors disabled:opacity-50">
                    Remove
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-body font-semibold text-sm text-text-muted">Site Name</label>
                <input 
                  type="text" 
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-body font-semibold text-sm text-text-muted">Support Email</label>
                <input 
                  type="email" 
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-auto pt-6">
              <Button variant="solid" type="submit" disabled={savingSettings || loading} className="px-6 py-2.5 h-auto shadow-sm">
                {savingSettings ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </section>

        {/* Billing & Subscription Card */}
        <section className="xl:col-span-1 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col h-full">
          <h3 className="font-heading font-semibold text-xl text-text-dark mb-4">Subscription</h3>
          <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
          
          <div className="bg-[#FFFCFA] rounded-[8px] p-5 border border-[#F2EDE8] mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-0"></div>
            <div className="relative z-10">
              <span className="bg-orange-100 text-brand-primary font-body font-bold text-[12px] px-2.5 py-1 rounded-[6px] mb-3 inline-block uppercase tracking-wider">Pro Plan</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-bold text-4xl text-text-dark">$49</span>
                <span className="font-body text-sm text-text-muted">/ mo</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex justify-between items-end mb-1">
              <span className="font-body font-bold text-sm text-text-dark">API Requests</span>
              <span className="font-body text-sm text-text-muted">42k / 100k</span>
            </div>
            <div className="w-full h-2 bg-[#F2EDE8] rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full w-[42%]"></div>
            </div>
          </div>
          
          <button type="button" className="w-full bg-white border border-[#F2EDE8] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.04)] text-text-dark font-body font-semibold text-sm px-4 py-2.5 rounded-[8px] hover:bg-gray-50 transition-colors mt-auto">
            Manage Billing
          </button>
        </section>

        {/* ROW 2 */}
        {/* Admin Access Card */}
        <section className="xl:col-span-2 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-semibold text-xl text-text-dark">Admin Access</h3>
            <p className="font-body text-sm text-text-muted hidden sm:block">Create login credentials for new admins</p>
          </div>
          <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
          
          <form className="space-y-6 flex-1 flex flex-col" onSubmit={handleAddAdmin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-body font-semibold text-sm text-text-muted">Admin Email</label>
                <input 
                  type="email" 
                  placeholder="admin@crushsvg.net"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-body font-semibold text-sm text-text-muted">Password</label>
                <div className="relative w-full">
                  <input 
                    type={showAdminPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 pr-10 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((v) => !v)}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-black flex items-center justify-center w-[20px] h-[20px]"
                    aria-label={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {!showAdminPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-auto pt-6">
              <Button variant="solid" className="px-6 py-2.5 h-auto shadow-sm gap-2" disabled={addingAdmin} type="submit">
                {addingAdmin ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                )}
                {addingAdmin ? "Adding..." : "Add Admin"}
              </Button>
            </div>
          </form>
        </section>

        {/* Permissions Card */}
        <section className="xl:col-span-1 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col h-full">
          <h3 className="font-heading font-semibold text-xl text-text-dark mb-4">Security</h3>
          <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
          
          <div className="flex flex-col gap-5">
            {/* Toggle Item */}
            <div className="flex items-center justify-between group">
              <div className="flex flex-col gap-0.5">
                <span className="font-body font-bold text-sm text-text-dark">Two-Factor Auth</span>
                <span className="font-body text-sm text-text-muted">Require 2FA for all admins</span>
              </div>
              {/* Custom Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>
            
            {/* Toggle Item */}
            <div className="flex items-center justify-between group">
              <div className="flex flex-col gap-0.5">
                <span className="font-body font-bold text-sm text-text-dark">SSO Enforcement</span>
                <span className="font-body text-sm text-text-muted">Require Google Workspace SSO</span>
              </div>
              {/* Custom Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* ROW 3 */}
        {/* API Keys Card */}
        <section className="xl:col-span-3 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-semibold text-xl text-text-dark">API Credentials</h3>
            <button type="button" className="flex items-center gap-1.5 text-brand-primary font-body font-semibold text-sm bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-[8px] transition-colors border border-orange-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              Generate Key
            </button>
          </div>
          <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
          
          <div className="flex flex-col gap-4">
            {/* Key Item */}
            <div className="flex items-center justify-between p-4 rounded-[8px] border border-[#F2EDE8] bg-[#FFFCFA]">
              <div className="flex flex-col gap-1">
                <span className="font-body font-bold text-sm text-text-dark">Production Live Key</span>
                <span className="font-body text-sm text-text-muted font-mono blur-sm hover:blur-none transition-all cursor-pointer">sk_live_98a7sd98f7asdf890a8sdf</span>
              </div>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-brand-primary transition-colors p-2 rounded-full hover:bg-gray-50" title="Copy to clipboard">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Revoke key">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
              </div>
            </div>
            
            {/* Key Item */}
            <div className="flex items-center justify-between p-4 rounded-[8px] border border-[#F2EDE8] bg-[#FFFCFA]">
              <div className="flex flex-col gap-1">
                <span className="font-body font-bold text-sm text-text-dark">Development Test Key</span>
                <span className="font-body text-sm text-text-muted font-mono">sk_test_1234567890abcdef</span>
              </div>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-brand-primary transition-colors p-2 rounded-full hover:bg-gray-50" title="Copy to clipboard">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Revoke key">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
