import React from "react";

interface KpiCardProps {
  title: string;
  icon: React.ElementType;
  value: string | number;
  description: string;
}

export function KpiCard({ title, icon: Icon, value, description }: KpiCardProps) {
  return (
    <div className="bg-[#FFFCFA] border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="font-heading font-semibold text-[14px] text-text-muted uppercase tracking-wider">
          {title}
        </span>
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#D94A1E]" />
        </div>
      </div>
      <div>
        <span className="font-heading font-bold text-4xl text-text-dark block">
          {value}
        </span>
        <span className="font-body text-sm text-text-muted mt-2 block">
          {description}
        </span>
      </div>
    </div>
  );
}
