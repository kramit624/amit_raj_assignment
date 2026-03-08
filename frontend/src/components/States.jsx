/**
 * components/States.jsx
 * ----------------------
 * Shimmer skeleton loader + error state used across all sections.
 */

import { AlertTriangle } from "lucide-react";

export function SkeletonLoader({ rows = 4 }) {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-8 w-full"
          style={{ opacity: 1 - i * 0.15, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-52 pt-4">
      {[65, 40, 80, 55, 90, 45, 70, 60, 85, 50, 75, 35].map((h, i) => (
        <div
          key={i}
          className="skeleton flex-1 rounded-t"
          style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
        <AlertTriangle size={18} className="text-rose-400" />
      </div>
      <p className="text-sm font-mono text-rose-400">
        {message || "Failed to load. Is the backend running?"}
      </p>
    </div>
  );
}
