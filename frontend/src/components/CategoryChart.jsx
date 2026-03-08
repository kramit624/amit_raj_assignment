/**
 * components/CategoryChart.jsx
 * -----------------------------
 * Bar chart (revenue) + Pie chart (order share) side by side.
 * GSAP: slides in from right on mount.
 */

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { fetchCategories } from "../api/index.js";
import { ChartSkeleton, ErrorState } from "./States.jsx";

const PALETTE = [
  "#00d4ff",
  "#7c3aed",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#818cf8",
];
const fmt = (v) =>
  `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-[#4b5563] text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold text-xs">
          {p.name === "total_revenue" ? fmt(p.value) : p.value + " orders"}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-[#e2e8f0] text-xs font-semibold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }} className="text-xs mt-0.5">
        {payload[0].value} orders
      </p>
    </div>
  );
}

export default function CategoryChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", delay: 0.45 },
    );
    fetchCategories()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div ref={cardRef} className="card opacity-0">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
          <BarChart2 size={14} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-display font-semibold text-[#e2e8f0]">
            Category Breakdown
          </h2>
          <p className="text-xs font-mono text-[#4b5563]">
            Revenue & order distribution
          </p>
        </div>
      </div>

      {loading && <ChartSkeleton />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          {/* Bar chart — revenue */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e2733"
                vertical={false}
              />
              <XAxis
                dataKey="category"
                tick={{
                  fontSize: 10,
                  fill: "#4b5563",
                  fontFamily: "JetBrains Mono",
                }}
                tickLine={false}
                axisLine={{ stroke: "#1e2733" }}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{
                  fontSize: 10,
                  fill: "#4b5563",
                  fontFamily: "JetBrains Mono",
                }}
                tickLine={false}
                axisLine={false}
                width={46}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar
                dataKey="total_revenue"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PALETTE[i % PALETTE.length]}
                    fillOpacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Pie chart — order share */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="num_orders"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => (
                    <span
                      style={{
                        color: "#4b5563",
                        fontSize: 11,
                        fontFamily: "JetBrains Mono",
                      }}
                    >
                      {v}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[#161c24] rounded-xl px-3 py-2.5
                           border border-[#1e2733] hover:border-[#2a3550] transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#e2e8f0] truncate">
                    {r.category}
                  </p>
                  <p className="text-xs font-mono text-[#4b5563]">
                    {r.num_orders} orders
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
