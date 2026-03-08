/**
 * components/TopCustomersTable.jsx
 * ---------------------------------
 * Sortable table with search. GSAP stagger animates rows in on load.
 * Bonus: search by name or region.
 */

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { fetchCustomers } from "../api/index.js";
import { SkeletonLoader, ErrorState } from "./States.jsx";

export default function TopCustomersTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("total_spend");
  const [sortAsc, setSortAsc] = useState(false);
  const cardRef = useRef(null);
  const tbodyRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.35 },
    );
    fetchCustomers()
      .then((rows) => {
        setData(rows);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!tbodyRef.current || loading) return;
    const rows = tbodyRef.current.querySelectorAll("tr");
    gsap.fromTo(
      rows,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" },
    );
  }, [loading, search, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col)
      return <ChevronsUpDown size={11} className="text-[#4b5563] ml-1" />;
    return sortAsc ? (
      <ChevronUp size={11} className="text-cyan-400 ml-1" />
    ) : (
      <ChevronDown size={11} className="text-cyan-400 ml-1" />
    );
  };

  const filtered = data
    .filter(
      (r) =>
        (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.region || "").toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const va = a[sortKey],
        vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      return sortAsc ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });

  const cols = [
    { key: "name", label: "Customer" },
    { key: "region", label: "Region" },
    { key: "total_spend", label: "Total Spend" },
    { key: "last_order_date", label: "Last Order" },
    { key: "churned", label: "Status" },
  ];

  return (
    <div ref={cardRef} className="card opacity-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
            <Users size={14} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-display font-semibold text-[#e2e8f0]">
              Top Customers
            </h2>
            <p className="text-xs font-mono text-[#4b5563]">
              Ranked by total spend
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or region…"
            className="bg-[#161c24] border border-[#1e2733] rounded-lg pl-8 pr-3 py-1.5
                       text-xs font-mono text-[#e2e8f0] placeholder:text-[#4b5563]
                       outline-none focus:border-violet-400/50 transition-colors w-52 sm:w-60"
          />
        </div>
      </div>

      {loading && <SkeletonLoader rows={5} />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.key} onClick={() => handleSort(c.key)}>
                    <span className="flex items-center">
                      {c.label}
                      <SortIcon col={c.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {filtered.map((r, i) => (
                <tr key={i} className="group">
                  <td className="font-semibold text-[#e2e8f0]">{r.name}</td>
                  <td>
                    <span
                      className="inline-block bg-[#161c24] border border-[#1e2733] rounded-full
                                     px-2.5 py-0.5 text-xs font-mono text-[#4b5563]"
                    >
                      {r.region}
                    </span>
                  </td>
                  <td className="font-mono font-semibold text-amber-400">
                    ${Number(r.total_spend).toLocaleString()}
                  </td>
                  <td className="font-mono text-[#4b5563] text-xs">
                    {r.last_order_date?.slice(0, 10)}
                  </td>
                  <td>
                    {r.churned ? (
                      <span
                        className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20
                                         text-rose-400 text-xs font-mono rounded-full px-2.5 py-0.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Churned
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20
                                         text-emerald-400 text-xs font-mono rounded-full px-2.5 py-0.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
