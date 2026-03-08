/**
 * components/RevenueChart.jsx
 * ----------------------------
 * Area line chart — monthly revenue trend.
 * GSAP: card slides in from left on mount.
 * Bonus: date-range filter dropdowns.
 */

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Filter } from "lucide-react";
import { fetchRevenue } from "../api/index.js";
import { ChartSkeleton, ErrorState } from "./States.jsx";

const fmt = (v) =>
  `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-[#4b5563] text-xs mb-1">{label}</p>
      <p className="text-cyan-400 font-semibold">{fmt(payload[0].value)}</p>
    </div>
  );
}

export default function RevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.7, ease: "power3.out", delay: 0.2 },
    );
    fetchRevenue()
      .then((rows) => {
        setData(rows);
        if (rows.length) {
          setFrom(rows[0].order_year_month);
          setTo(rows[rows.length - 1].order_year_month);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const months = [...new Set(data.map((r) => r.order_year_month))].sort();
  const filtered = data.filter(
    (r) =>
      (!from || r.order_year_month >= from) &&
      (!to || r.order_year_month <= to),
  );

  return (
    <div ref={cardRef} className="card opacity-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
            <TrendingUp size={14} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-display font-semibold text-[#e2e8f0]">
              Revenue Trend
            </h2>
            <p className="text-xs font-mono text-[#4b5563]">
              Completed orders only
            </p>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-[#4b5563]" />
          {[
            ["from", from, setFrom],
            ["to", to, setTo],
          ].map(([label, val, setter]) => (
            <label
              key={label}
              className="flex items-center gap-1.5 text-xs font-mono text-[#4b5563]"
            >
              <span className="uppercase tracking-wider">{label}</span>
              <select
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="bg-[#161c24] border border-[#1e2733] text-[#e2e8f0] text-xs font-mono
                           rounded-lg px-2 py-1.5 outline-none cursor-pointer
                           focus:border-cyan-400/50 transition-colors"
              >
                {months.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {loading && <ChartSkeleton />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={filtered}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" />
            <XAxis
              dataKey="order_year_month"
              tick={{
                fontSize: 10,
                fill: "#4b5563",
                fontFamily: "JetBrains Mono",
              }}
              tickLine={false}
              axisLine={{ stroke: "#1e2733" }}
              interval="preserveStartEnd"
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
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total_revenue"
              stroke="#00d4ff"
              strokeWidth={2}
              fill="url(#revenueGrad)"
              dot={{ r: 3, fill: "#00d4ff", strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: "#00d4ff",
                stroke: "#080b10",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
