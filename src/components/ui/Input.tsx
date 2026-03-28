"use client";

import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#9B8FC0]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B8FC0]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F8F4FF] placeholder-[#9B8FC0]/60",
              "focus:border-[#FF6B35]/60 focus:bg-white/8 focus:ring-2 focus:ring-[#FF6B35]/20",
              "hover:border-white/20",
              icon && "pl-11",
              error && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-[#9B8FC0]">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
