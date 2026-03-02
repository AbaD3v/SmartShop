import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200',
      className,
    )}
    {...props}
  />
);
