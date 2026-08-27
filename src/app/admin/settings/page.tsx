"use client";

import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useState } from "react";
import { apiFetch } from "@/lib/client/http";
import { showToast } from "@/lib/client/toast-bridge";

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      showToast("error", "Email and password are required.");
      return;
    }
    setAddingAdmin(true);
    try {
      await apiFetch("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: adminEmail, password: adminPassword, role: "admin" })
      });
      showToast("success", "Admin user added successfully!");
      setAdminEmail("");
      setAdminPassword("");
    } catch (err: any) {
      if (err.message.includes("409")) {
        showToast("error", "A user with this email already exists.");
      } else {
        showToast("error", "Failed to add admin user.");
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Main Column (Spans 2/3) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* General Settings Card */}
          <section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <h3 className="font-heading font-semibold text-xl text-text-dark mb-4">General Information</h3>
            <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
            
            <form className="space-y-6">
              {/* Logo Upload Area */}
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 rounded-[12px] border border-[#F2EDE8] bg-[#FFFCFA] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  <Image src="/crushsvg.webp" alt="Organization Logo" fill className="object-contain p-4" />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <h4 className="font-body font-bold text-sm text-text-dark">Organization Logo</h4>
                  <p className="font-body text-sm text-text-muted">Recommended size: 256x256px. JPG, PNG, or SVG.</p>
                  <div className="flex gap-2 mt-2">
                    <button type="button" className="bg-[#FFFCFA] text-text-dark font-body font-semibold text-sm px-4 py-2 rounded-[8px] border border-[#F2EDE8] hover:bg-gray-50 transition-colors">
                      Upload New
                    </button>
                    <button type="button" className="text-red-600 font-body font-semibold text-sm px-4 py-2 rounded-[8px] hover:bg-red-50 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="font-body font-semibold text-sm text-text-muted">Site Name</label>
                  <input 
                    type="text" 
                    defaultValue="CrushSVG Production"
                    className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-body font-semibold text-sm text-text-muted">Support Email</label>
                  <input 
                    type="email" 
                    defaultValue="support@crushsvg.net"
                    className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button variant="solid" className="px-6 py-2.5 h-auto shadow-sm">Save Changes</Button>
              </div>
            </form>
          </section>

          {/* Admin Access Card */}
          <section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-semibold text-xl text-text-dark">Admin Access</h3>
              <p className="font-body text-sm text-text-muted hidden sm:block">Create login credentials for new admins</p>
            </div>
            <div className="w-full h-px bg-[#F2EDE8] mb-6"></div>
            
            <form className="space-y-6" onSubmit={handleAddAdmin}>
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
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] px-3 py-2.5 font-body text-text-dark focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
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

          {/* API Keys Card */}
          <section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] relative overflow-hidden">
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

        {/* Side Column (Spans 1/3) */}
        <div className="flex flex-col gap-6">
          
          {/* Billing & Subscription Card */}
          <section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col">
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

          {/* Permissions Card */}
          <section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)]">
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
          
        </div>
      </div>
    </div>
  );
}
