import React from "react";

export interface AlertProps {
  variant?: "error" | "success" | "warning";
  message: string;
  onClose?: () => void;
  className?: string;
  width?: string;
}

export function Alert({
  variant = "error",
  message,
  onClose,
  className = "",
  width,
}: AlertProps) {
  const isError = variant === "error" || variant === "warning";

  return (
    <div
      className={`flex items-center justify-between min-h-[41px] p-[12px] rounded-[4px] gap-[10px] text-white font-afacad text-[14px] font-normal leading-[130%] transition-all ${
        isError
          ? "bg-[#D94A1E] w-[433px] max-w-full"
          : "bg-[#D94A1E] w-[366px] max-w-full"
      } ${className}`}
      style={width ? { width } : undefined}
    >
      <div className="flex items-center gap-[10px] overflow-hidden">
        {/* Left Icon */}
        {isError ? (
          <div className="w-[18px] h-[18px] rounded-full bg-[#FFE3DA] flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="9" cy="9" r="9" fill="#FFE3DA" />
              <path
                d="M9 5V9.5M9 12.5V13"
                stroke="#D94A1E"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : (
          <div className="w-[18px] h-[18px] rounded-full bg-[#FFE3DA] flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="9" cy="9" r="9" fill="#FFE3DA" />
              <path
                d="M5.5 9L8 11.5L12.5 6.5"
                stroke="#D94A1E"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Message Text */}
        <span className="truncate sm:whitespace-normal">{message}</span>
      </div>

      {/* Right Close Icon */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-white hover:opacity-80 transition-opacity shrink-0 ml-[4px] p-0.5 cursor-pointer"
          aria-label="Close alert"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

{/* Error / Warning Alert Component (#D94A1E - Fixed 433px width) */}
export function PasswordResetErrorAlert({
  message = "A password reset email has already been sent. Please wait and try again later",
  onClose,
  className = "",
}: {
  message?: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <Alert
      variant="error"
      message={message}
      onClose={onClose}
      className={className}
    />
  );
}

{/* Success Alert Component (#10B981 - Hug 366px width) */}
export function PasswordResetSuccessAlert({
  message = "Password reset email sent successfully. Please check your inbox.",
  onClose,
  className = "",
}: {
  message?: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <Alert
      variant="success"
      message={message}
      onClose={onClose}
      className={className}
    />
  );
}
