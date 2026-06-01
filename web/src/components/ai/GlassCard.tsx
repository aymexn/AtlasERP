import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function GlassCard({ children, className = '', glow = true, ...props }: GlassCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-purple-500/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-500 hover:border-purple-500/40 shadow-sm ${
        glow ? 'hover:shadow-[0_0_40px_rgba(139,92,246,0.18)] hover:-translate-y-0.5' : 'hover:shadow-md'
      } ${className}`}
      {...props}
    >
      {/* Glow Effect Blobs */}
      {glow && (
        <>
          <div className="absolute -right-20 -top-20 -z-10 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl pointer-events-none transition-all duration-500" />
          <div className="absolute -left-20 -bottom-20 -z-10 h-44 w-44 rounded-full bg-pink-500/5 blur-3xl pointer-events-none transition-all duration-500" />
        </>
      )}
      {children}
    </div>
  );
}
