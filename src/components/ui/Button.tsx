import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

export const Button = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'h-11 rounded-xl px-4 text-sm font-medium transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40',
      'bg-slate-900 text-white hover:bg-slate-800',
      className,
    )}
    {...props}
  />
);
