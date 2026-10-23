import React from "react";

type AuthStaticFormProps = { type: "login" | "signup" | "forgot" | "reset" };

const content = {
  login: { title: "Log in", fields: [["Email", "email"], ["Password", "password"]] },
  signup: { title: "Create your account", fields: [["Name", "text"], ["Email", "email"], ["Password", "password"]] },
  forgot: { title: "Reset your password", fields: [["Email", "email"]] },
  reset: { title: "Choose a new password", fields: [["New password", "password"], ["Confirm password", "password"]] },
} as const;

export function AuthStaticForm({ type }: AuthStaticFormProps) {
  const form = content[type];
  return (
    <div aria-hidden="true" className="w-full max-w-[440px] rounded-[8px] border border-[#F2EDE8] bg-[#FFFCFA] p-[24px_16px] shadow-[0px_4px_44px_0px_rgba(0,0,0,0.06)] sm:p-[24px_32px]">
      <h2 className="mb-5 text-center font-heading text-xl font-bold text-[#202427]">{form.title}</h2>
      <div className="flex flex-col gap-3">
        {form.fields.map(([label, inputType]) => (
          <label key={label} className="flex flex-col gap-1 font-body text-sm font-medium text-[#475569]">
            {label}<input type={inputType} disabled tabIndex={-1} placeholder={label} className="h-10 rounded border border-[#D1D5DB] bg-white px-3" />
          </label>
        ))}
        <button type="button" disabled className="mt-2 h-10 rounded-lg bg-[#D94A1E] text-white opacity-70">{form.title}</button>
      </div>
    </div>
  );
}
