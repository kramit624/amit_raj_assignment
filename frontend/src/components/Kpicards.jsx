/**
 * components/KpiCards.jsx
 * ------------------------
 * 4 top-level stat cards with GSAP counter animations on mount.
 * Derived from all API data combined.
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";

const cards = [
  {
    key: "revenue",
    label: "Total Revenue",
    icon: DollarSign,
    color: "cyan",
    prefix: "$",
    format: (v) =>
      Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }),
  },
  {
    key: "orders",
    label: "Total Orders",
    icon: ShoppingCart,
    color: "violet",
    prefix: "",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "customers",
    label: "Top Customers",
    icon: Users,
    color: "amber",
    prefix: "",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "avg",
    label: "Avg Order Value",
    icon: TrendingUp,
    color: "green",
    prefix: "$",
    format: (v) =>
      Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }),
  },
];

const colorMap = {
  cyan: {
    icon: "text-cyan-400",
    ring: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  violet: {
    icon: "text-violet-400",
    ring: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  amber: {
    icon: "text-amber-400",
    ring: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  green: {
    icon: "text-emerald-400",
    ring: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
};

export default function KpiCards({ stats }) {
  const refs = useRef([]);

  useEffect(() => {
    if (!stats) return;
    refs.current.forEach((el, i) => {
      if (!el) return;
      const card = cards[i];
      const final = stats[card.key] ?? 0;
      gsap.fromTo(
        el,
        { innerText: 0 },
        {
          innerText: final,
          duration: 1.4,
          delay: i * 0.12,
          ease: "power2.out",
          snap: { innerText: 1 },
          onUpdate() {
            el.innerText =
              card.prefix + card.format(Math.round(parseFloat(el.innerText)));
          },
        },
      );
    });
  }, [stats]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => {
        const c = colorMap[card.color];
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`card glow-${card.color === "cyan" ? "cyan" : card.color === "violet" ? "violet" : "amber"} group`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-9 h-9 rounded-xl ${c.ring} border ${c.border} flex items-center justify-center`}
              >
                <Icon size={16} className={c.icon} />
              </div>
              <span className={`text-xs font-mono ${c.icon} opacity-60`}>
                #{String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <p
              ref={(el) => (refs.current[i] = el)}
              className={`stat-num text-2xl sm:text-3xl ${c.icon} mb-1`}
            >
              {stats ? card.prefix + card.format(stats[card.key] ?? 0) : "—"}
            </p>
            <p className="text-xs text-[#4b5563] uppercase tracking-widest font-mono">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
