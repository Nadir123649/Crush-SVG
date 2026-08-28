"use client";

import React, { useState } from "react";
  
import { useSearchParams, usePathname } from "next/navigation";

const SvgSearch = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;
const SvgFilter = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

export function UserFilters({ 
  onSearchChange, 
  onRoleChange, 
  onStatusChange 
}: { 
  onSearchChange: (value: string) => void; 
  onRoleChange: (value: string) => void; 
  onStatusChange: (value: string) => void; 
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  const onSearchInputChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const onRoleSelectChange = (value: string) => {
    setRole(value);
    onRoleChange(value);
  };

  const onStatusRadioChange = (value: string) => {
    setStatus(value);
    onStatusChange(value);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Card */}
      <div className="bg-white border border-[#F2EDE8] p-6 rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)]">
        <label className="font-body font-semibold text-sm text-text-dark mb-3 block">Search Users</label>
        <div className="relative flex items-center">
          <SvgSearch className="absolute left-3 text-text-muted w-5 h-5" />
          <input 
            type="text"
            value={search}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Name or email..."
            className="w-full bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] py-2.5 pl-10 pr-3 font-body text-sm text-text-dark focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-[#F2EDE8] p-6 rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)]">
        <h3 className="font-body font-bold text-sm text-text-dark mb-5 flex items-center gap-2">
          <SvgFilter className="w-4 h-4" />
          Filters
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="font-body font-semibold text-sm text-text-muted mb-2 block">Role</label>
            <select 
              value={role}
              onChange={(e) => onRoleSelectChange(e.target.value)}
              className="w-full bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] py-2.5 px-3 font-body text-sm text-text-dark focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="font-body font-semibold text-sm text-text-muted mb-2 block">Status</label>
            <div className="flex flex-col gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer font-body text-sm text-text-dark px-3 py-2 rounded-[8px] border border-[#F2EDE8] bg-[#FFFCFA] hover:border-brand-primary/40 transition-colors"
                >
                  <input
                    type="radio"
                    name="status-filter"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => onStatusRadioChange(opt.value)}
                    className="accent-brand-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}