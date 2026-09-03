"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/client/auth-context";
import Image from "next/image";
import { IMAGES } from "@/lib/shared/images";
import { AuthCard } from "@/components/auth/AuthCard";

// Inline SVGs to avoid dependency issues
const SvgDashboard = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const SvgUsers = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const SvgFileText = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
const SvgHistory = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
const SvgSettings = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const SvgLogOut = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const SvgMenu = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
const SvgBell = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const SvgUser = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.photoURL]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const touchStartXRef = React.useRef<number | null>(null);
  const dragInfoRef = React.useRef({ startX: 0, hasDragged: false });

  useEffect(() => {
    // Drag behavior removed per user request: click only.
  }, [isDesktopSidebarOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    if (status === "authed" && user?.role !== "admin") {
      router.push("/");
    }
  }, [status, user, router]);

  const isLoading = status === "loading";
  const isGuest = status === "guest";
  const isNonAdmin = status === "authed" && user?.role !== "admin";
  const showOverlay = isLoading || isGuest || isNonAdmin;

  const navLinks = [
    { href: "/admin", label: "Overview", icon: SvgDashboard },
    { href: "/admin/users", label: "User Management", icon: SvgUsers },
    { href: "/admin/conversions", label: "Conversion logs", icon: SvgFileText },
    { href: "/admin/audits", label: "System Audit logs", icon: SvgHistory },
    { href: "/admin/settings", label: "Settings", icon: SvgSettings },
  ];

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    router.push('/');
  };

  return (
    <div className="w-full min-h-screen bg-[#FFFCFA] font-body text-text-body antialiased flex overflow-hidden">
      {/* Auth overlay — always rendered, same outer div */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FFFCFA]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <Image src={IMAGES.logo} alt="Loading" width={48} height={48} className="object-contain opacity-80" />
            </div>
          )}
          {isGuest && !isLoggingOut && (
            <AuthCard type="login" returnTo={pathname} />
          )}
          {isGuest && isLoggingOut && (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <Image src={IMAGES.logo} alt="Loading" width={48} height={48} className="object-contain opacity-80" />
            </div>
          )}
          {isNonAdmin && (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <Image src={IMAGES.logo} alt="Loading" width={48} height={48} className="object-contain opacity-80" />
            </div>
          )}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar edge toggle */}
      <div
        onMouseDown={(e) => {
          dragInfoRef.current = { startX: e.clientX, hasDragged: false };
          const handleMouseMove = (moveEvent: MouseEvent) => {
            const diff = dragInfoRef.current.startX - moveEvent.clientX;
            if (Math.abs(diff) > 10) {
              dragInfoRef.current.hasDragged = true;
            }
            if (isDesktopSidebarOpen && diff > 50) {
              setIsDesktopSidebarOpen(false);
              cleanup();
            } else if (!isDesktopSidebarOpen && diff < -50) {
              setIsDesktopSidebarOpen(true);
              cleanup();
            }
          };
          
          const cleanup = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", cleanup);
          };
          
          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", cleanup);
          e.preventDefault();
        }}
        onClick={() => {
          if (!dragInfoRef.current.hasDragged) {
            setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
          }
        }}
        className={`hidden md:flex fixed top-0 bottom-0 z-40 w-4 cursor-pointer items-center justify-center transition-all duration-300 group focus:outline-none select-none ${
          isDesktopSidebarOpen ? "left-[256px]" : "left-[68px]"
        }`}
        title={isDesktopSidebarOpen ? "Click to close sidebar" : "Click to open sidebar"}
      >
        {/* Hover area line */}
        <div className="absolute inset-0 w-1 bg-transparent group-hover:bg-brand-primary/30 transition-colors" style={{ left: '1.5px' }} />
        
        {/* Center handle indicator - visible on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-10 rounded-full bg-brand-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-30 group-hover:scale-110">
          <svg
            className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
              isDesktopSidebarOpen ? "" : "rotate-180"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      </div>

      <nav 
        onTouchStart={(e) => {
          touchStartXRef.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (touchStartXRef.current === null) return;
          const diff = touchStartXRef.current - e.touches[0].clientX;
          if (diff > 50) {
            setIsMobileMenuOpen(false);
            touchStartXRef.current = null;
          }
        }}
        onTouchEnd={() => {
          touchStartXRef.current = null;
        }}
        className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-30
        flex flex-col ${isDesktopSidebarOpen ? 'w-[260px]' : 'md:w-[72px] w-[260px]'} h-screen pt-3 pb-6 bg-white border-r border-[#F2EDE8] justify-between
        transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        md:translate-x-0 md:shadow-none
      `}>
        <div>
          {/* Header - Fixed height container to prevent any layout shift */}
          <div className="mb-6 h-[40px] relative">
            {/* Logo - Always in same position, just fade in/out */}
            <div className={`absolute inset-0 px-6 flex items-center justify-between transition-opacity duration-200 ${isDesktopSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:pointer-events-none'}`}>
              <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Image
                  src={IMAGES.logo}
                  alt="CrushSVG Logo"
                  width={26}
                  height={26}
                  className="w-[26px] h-[26px] object-contain flex-shrink-0"
                />
                <span className="font-heading font-bold text-2xl text-text-dark whitespace-nowrap">
                  Crush<span className="text-brand-primary">SVG</span>
                </span>
              </Link>
              
              {/* Close button */}
              <button 
                className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-50 text-text-muted transition-colors"
                onClick={() => setIsDesktopSidebarOpen(false)}
                title="Close sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18"/>
                  <line x1="6" x2="18" y1="6" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Hamburger - Always in same position, just fade in/out */}
            <div className={`absolute inset-0 px-3 flex items-center justify-center transition-opacity duration-200 ${!isDesktopSidebarOpen ? 'opacity-100 md:opacity-100 pointer-events-auto md:pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-0 md:pointer-events-none'}`}>
              <button 
                className="hidden md:flex items-center justify-center w-full rounded-lg hover:bg-gray-50 text-text-muted transition-colors"
                onClick={() => setIsDesktopSidebarOpen(true)}
                title="Open sidebar"
              >
                <SvgMenu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <ul className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={`flex items-center py-3 transition-colors ${
                      isDesktopSidebarOpen 
                        ? 'space-x-3 px-6 border-l-4' 
                        : 'md:justify-center md:px-0 md:border-l-0 md:space-x-0 space-x-3 px-6 border-l-4'
                    } ${
                      isActive 
                        ? "text-brand-primary font-bold border-brand-primary" 
                        : "text-text-muted hover:bg-gray-50 border-transparent"
                    }`}
                    title={!isDesktopSidebarOpen ? link.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`whitespace-nowrap overflow-hidden ${isDesktopSidebarOpen ? 'opacity-100' : 'md:opacity-0 md:w-0 md:h-0'}`}>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Profile / Logout */}
        <div className={`pb-6 ${isDesktopSidebarOpen ? 'px-6' : 'px-3 md:flex md:flex-col md:items-center'}`}>
          <div className={`flex items-center mb-4 ${isDesktopSidebarOpen ? 'space-x-3' : 'md:justify-center md:space-x-0 space-x-3'}`}>
            {user?.photoURL && !imageError ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email || "Admin"}
                className="w-8 h-8 min-w-[32px] rounded-full object-cover border border-[#F2EDE8] flex-shrink-0"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-orange-100 text-brand-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
            )}
            <div className={`truncate text-sm text-text-muted font-medium ${isDesktopSidebarOpen ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:h-0'}`}>
              {user?.displayName || user?.email || "admin@example.com"}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={`flex items-center text-text-muted hover:text-brand-primary transition-colors w-full ${isDesktopSidebarOpen ? 'space-x-3 pl-1' : 'md:justify-center md:space-x-0 space-x-3 pl-1'}`}
            title={!isDesktopSidebarOpen ? "Logout" : undefined}
          >
            <SvgLogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden ${isDesktopSidebarOpen ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0'}`}>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TopAppBar (Header) */}
        <header className="flex justify-between items-center w-full px-6 lg:px-10 h-[70px] flex-shrink-0 bg-white border-b border-[#F2EDE8]">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Icon */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 text-text-muted transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <SvgMenu className="w-6 h-6" />
            </button>
            <h1 className="font-heading font-semibold text-xl text-text-dark">
              Admin {"/"} {navLinks.find(l => l.href === pathname)?.label || "Overview"}
            </h1>
          </div>
        </header>

        {/* Canvas */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-10 mx-auto max-w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
