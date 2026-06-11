import { cn } from '../utils';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-2xl bg-white border border-[#E8E2D9]', className)} {...props}>
      {children}
    </div>
  );
}

export function Btn({ variant = 'primary', className, children, disabled, onClick, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold text-sm px-4 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-[#1A1A1A] text-white hover:bg-[#2d2d2d]',
    secondary: 'bg-[#FAF8F5] border border-[#E8E2D9] text-[#1A1A1A] hover:bg-[#F0EDE8]',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-[#666] hover:bg-[#F0EDE8]',
  };
  return (
    <button className={cn(base, variants[variant] || variants.primary, className)} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function Badge({ label, tone, className }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', tone, className)}>
      {label}
    </span>
  );
}

export function Input({ label, className, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-semibold text-[#666]">{label}</label>}
      <input
        className={cn(
          'w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1A1A1A]',
          'focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-colors',
          className
        )}
        {...props}
      />
    </div>
  );
}

export function StatCard({ label, value, sub, color, className }) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#999] mb-1">{label}</p>
      <p className={cn('text-3xl font-black', color || 'text-[#1A1A1A]')}>{value}</p>
      {sub && <p className="text-xs text-[#999] mt-0.5">{sub}</p>}
    </Card>
  );
}

export function Spinner({ className }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="h-8 w-8 rounded-full border-2 border-[#E8E2D9] border-t-[#C9A96E] animate-spin" />
    </div>
  );
}

export function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="font-bold text-[#1A1A1A] mb-1">{title}</p>
      {sub && <p className="text-sm text-[#999] max-w-xs mb-4">{sub}</p>}
      {action}
    </div>
  );
}
