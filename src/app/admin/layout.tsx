"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/client/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest" || (status === "authed" && user?.role !== "admin")) {
      router.push("/");
    }
  }, [status, user, router]);

  if (status === "loading" || status === "guest" || user?.role !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-[250px] bg-white border-r border-[#F2EDE8] hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="font-heading font-bold text-xl text-text-dark">Admin Panel</h2>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-2">
          <Link href="/admin" className="px-4 py-2 rounded-lg bg-gray-100 text-brand-primary font-medium font-body">Dashboard</Link>
          <Link href="/admin/users" className="px-4 py-2 rounded-lg text-text-body hover:bg-gray-50 font-medium font-body">Users</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
