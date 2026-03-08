/**
 * App.jsx
 * --------
 * Root layout. Collapsible sidebar + main content area.
 * GSAP: header and sidebar entrance on first load.
 * Fully responsive — sidebar collapses to bottom nav on mobile.
 */

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  PieChart,
  Globe,
  Menu,
  X,
  Activity,
  Zap,
} from "lucide-react";

import KpiCards from "./components/Kpicards.jsx";
import RevenueChart from "./components/RevenueChart.jsx";
import TopCustomersTable from "./components/TopCustomersTable.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import RegionSummary from "./components/RegionSummary.jsx";

import {
  fetchRevenue,
  fetchCustomers,
  fetchCategories,
  fetchRegions,
} from "./api/index.js";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "customers", label: "Customers", icon: Users },
  { id: "categories", label: "Categories", icon: PieChart },
  { id: "regions", label: "Regions", icon: Globe },
];

export default function App() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const headerRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);

  // Fetch summary stats for KPI cards
  useEffect(() => {
    Promise.all([fetchRevenue(), fetchCustomers(), fetchCategories()])
      .then(([rev, cust, cats]) => {
        const totalRevenue = rev.reduce(
          (s, r) => s + (r.total_revenue || 0),
          0,
        );
        const totalOrders = cats.reduce((s, c) => s + (c.num_orders || 0), 0);
        const totalAvgOV =
          cats.reduce((s, c) => s + (c.avg_order_value || 0), 0) /
          (cats.length || 1);
        setStats({
          revenue: Math.round(totalRevenue),
          orders: totalOrders,
          customers: cust.length,
          avg: Math.round(totalAvgOV),
        });
      })
      .catch(() => {});
  }, []);

  // GSAP entrance
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -24 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
    );
    tl.fromTo(
      sidebarRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
      "-=0.3",
    );
    tl.fromTo(
      mainRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.2",
    );
  }, []);

  // Animate section change
  useEffect(() => {
    if (!mainRef.current) return;
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, [active]);

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        onClick={() => {
          setActive(item.id);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                    font-medium transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                        : "text-[#4b5563] hover:text-[#e2e8f0] hover:bg-[#161c24]"
                    }`}
      >
        <Icon
          size={16}
          className={
            isActive
              ? "text-cyan-400"
              : "text-[#4b5563] group-hover:text-[#e2e8f0]"
          }
        />
        <span className="font-display tracking-wide">{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </button>
    );
  };

  const renderContent = () => {
    switch (active) {
      case "overview":
        return (
          <div className="space-y-5">
            <KpiCards stats={stats} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <RevenueChart />
              <CategoryChart />
            </div>
            <TopCustomersTable />
            <RegionSummary />
          </div>
        );
      case "revenue":
        return (
          <div className="space-y-5">
            <KpiCards stats={stats} />
            <RevenueChart />
          </div>
        );
      case "customers":
        return (
          <div className="space-y-5">
            <TopCustomersTable />
          </div>
        );
      case "categories":
        return (
          <div className="space-y-5">
            <CategoryChart />
          </div>
        );
      case "regions":
        return (
          <div className="space-y-5">
            <RegionSummary />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#080b10] bg-grid text-[#e2e8f0] flex flex-col">
      {/* ── Top header ───────────────────────────────────── */}
      <header
        ref={headerRef}
        className="opacity-0 sticky top-0 z-40 flex items-center justify-between
                   px-4 sm:px-6 h-14 bg-[#080b10]/90 backdrop-blur-md
                   border-b border-[#1e2733]"
      >
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden w-8 h-8 flex items-center justify-center
                       rounded-lg border border-[#1e2733] text-[#4b5563]
                       hover:text-[#e2e8f0] hover:border-[#2a3550] transition-colors"
          >
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg bg-cyan-400/15 border border-cyan-400/30
                            flex items-center justify-center"
            >
              <Activity size={14} className="text-cyan-400" />
            </div>
            <span className="font-display font-bold text-sm tracking-wide text-[#e2e8f0]">
              Sales<span className="text-cyan-400">IQ</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#4b5563]
                          bg-[#0f1318] border border-[#1e2733] rounded-full px-3 py-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API Live
          </div>
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500
                          flex items-center justify-center"
          >
            <Zap size={12} className="text-white" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar — desktop ────────────────────────────── */}
        <aside
          ref={sidebarRef}
          className="opacity-0 hidden lg:flex flex-col w-56 flex-shrink-0
                     border-r border-[#1e2733] bg-[#080b10] pt-6 px-3 pb-4"
        >
          <p className="text-xs font-mono text-[#4b5563] uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>
          <nav className="space-y-1 flex-1">
            {NAV.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-[#1e2733] px-3">
            <p className="text-xs font-mono text-[#4b5563]">
              v1.0.0 · Pipeline Output
            </p>
          </div>
        </aside>

        {/* ── Sidebar — mobile overlay ─────────────────────── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-64 bg-[#0f1318] border-r border-[#1e2733] pt-6 px-3 pb-4 flex flex-col">
              <p className="text-xs font-mono text-[#4b5563] uppercase tracking-widest px-3 mb-3">
                Navigation
              </p>
              <nav className="space-y-1">
                {NAV.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* ── Main content ──────────────────────────────────── */}
        <main
          ref={mainRef}
          className="opacity-0 flex-1 overflow-y-auto px-4 sm:px-6 py-5"
        >
          {/* Page title */}
          <div className="mb-5">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-[#e2e8f0] tracking-tight">
              {NAV.find((n) => n.id === active)?.label}
            </h1>
            <p className="text-xs font-mono text-[#4b5563] mt-0.5">
              Real-time analytics ·{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {renderContent()}
        </main>
      </div>

      {/* ── Bottom nav — mobile ───────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30
                      bg-[#0f1318]/95 backdrop-blur-md border-t border-[#1e2733]
                      flex items-center justify-around px-2 py-2"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl
                          transition-all duration-200
                          ${isActive ? "text-cyan-400" : "text-[#4b5563]"}`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-mono">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
