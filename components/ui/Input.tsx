import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, icon, ...props }, ref) => {
    return (
      <div className="relative mt-3.5">
        {label && (
          <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white text-sm font-[family-name:var(--font-inter)] outline-none transition-all duration-200 focus:border-[var(--primary)]/35 focus:bg-white/[0.06] placeholder:text-white/20 placeholder:font-medium ${icon ? 'pl-11' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
