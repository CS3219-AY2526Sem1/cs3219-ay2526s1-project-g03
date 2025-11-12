import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  // --- FIX: Add your new variants here ---
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'Easy' | 'Medium' | 'Hard';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-input bg-background',
      destructive: 'bg-destructive text-destructive-foreground',
      // Difficulty badge colors matching the design
      Easy: 'bg-[#58BB88] text-white border-transparent',
      Medium: 'bg-[#F79F74] text-white border-transparent',
      Hard: 'bg-[#F23B3B] text-white border-transparent',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };