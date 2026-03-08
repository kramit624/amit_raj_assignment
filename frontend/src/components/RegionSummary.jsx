/**
 * components/RegionSummary.jsx
 * -----------------------------
 * Radar chart + KPI cards per region.
 * GSAP: cards stagger up on load.
 */

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Globe,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { fetchRegions } from "../api/index.js";
import { SkeletonLoader, ErrorState } from "./States.jsx";

const REGION_COLORS = {
  North: "#00d4ff",
  South: "#7c3aed",
  East: "#f59e0b",
  West: "#10b981",
  Central: "#f43f5e",
  Unknown: "#4b5563",
};

function RadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-[#e2e8f0] text-xs font-semibold mb-1">
        {payload[0]?.payload?.region}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-mono" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function RegionSummary() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.55 },
    );
    fetchRegions()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!gridRef.current || loading || !data.length) return;
    const cards = gridRef.current.querySelectorAll(".region-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.07,
        ease: "power2.out",
      },
    );
  }, [loading]);

  // Normalise data for radar (0-100 scale per metric)
  const radarData = data.map((r) => {
    const maxOrders = Math.max(...data.map((d) => d.num_orders));
    const maxRevenue = Math.max(...data.map((d) => d.total_revenue));
    const maxCustomers = Math.max(...data.map((d) => d.num_customers));
    return {
      region: r.region,
      Orders: Math.round((r.num_orders / maxOrders) * 100),
      Revenue: Math.round((r.total_revenue / maxRevenue) * 100),
      Customers: Math.round((r.num_customers / maxCustomers) * 100),
    };
  });

  return (
    <div ref={cardRef} className="card opacity-0">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
          <Globe size={14} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-display font-semibold text-[#e2e8f0]">
            Regional Summary
          </h2>
          <p className="text-xs font-mono text-[#4b5563]">
            Performance by geography
          </p>
        </div>
      </div>

      {loading && <SkeletonLoader rows={3} />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Radar chart */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <p className="text-xs font-mono text-[#4b5563] uppercase tracking-wider mb-3">
              Relative Performance
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart
                data={radarData}
                margin={{ top: 0, right: 20, bottom: 0, left: 20 }}
              >
                <PolarGrid stroke="#1e2733" />
                <PolarAngleAxis
                  dataKey="region"
                  tick={{
                    fontSize: 10,
                    fill: "#4b5563",
                    fontFamily: "JetBrains Mono",
                  }}
                />
                <Tooltip content={<RadarTooltip />} />
                {["Orders", "Revenue", "Customers"].map((key, i) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={["#00d4ff", "#7c3aed", "#f59e0b"][i]}
                    fill={["#00d4ff", "#7c3aed", "#f59e0b"][i]}
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* KPI cards grid */}
          <div
            ref={gridRef}
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {data.map((r, i) => {
              const color = REGION_COLORS[r.region] || "#4b5563";
              return (
                <div
                  key={i}
                  className="region-card bg-[#161c24] border border-[#1e2733] rounded-2xl p-4
                             hover:border-[#2a3550] transition-all duration-300
                             hover:-translate-y-0.5 hover:shadow-lg group opacity-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-display font-bold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {r.region}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: color }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Users, val: r.num_customers, label: "Customers" },
                      {
                        icon: ShoppingCart,
                        val: r.num_orders,
                        label: "Orders",
                      },
                      {
                        icon: DollarSign,
                        val: `$${Number(r.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        label: "Revenue",
                      },
                      {
                        icon: TrendingUp,
                        val: `$${Number(r.avg_revenue_per_customer).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        label: "Avg/Customer",
                      },
                    ].map(({ icon: Icon, val, label }, j) => (
                      <div key={j}>
                        <p className="font-mono font-semibold text-sm text-[#e2e8f0] leading-none mb-1">
                          {val}
                        </p>
                        <p className="text-xs text-[#4b5563] flex items-center gap-1">
                          <Icon size={10} />
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
