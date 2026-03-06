import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Building2, TrendingUp, Users, DollarSign, Home } from "lucide-react";

// ─── Decorative stat card (left panel) ───────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
      <Icon className="h-4 w-4 text-white/80" />
    </div>
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-sm font-semibold leading-tight text-white">{value}</p>
      {sub && <p className="text-[10px] text-white/40">{sub}</p>}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      {/* ── Left branded panel ────────────────────────────────────────────── */}
      <aside
        className="relative hidden w-[420px] shrink-0 flex-col overflow-hidden bg-sidebar lg:flex"
        aria-hidden="true"
      >
        {/* Gradient glow */}
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, oklch(0.60 0.17 255), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-[300px] w-[300px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, oklch(0.65 0.16 175), transparent 70%)",
          }}
        />

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div className="relative flex flex-1 flex-col justify-between p-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none tracking-tight text-white">
                NeWell RMS
              </p>
              <p className="text-[10px] leading-none text-white/40">Rental Management</p>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
              Manage your
              <br />
              properties
              <br />
              <span className="text-primary">smarter.</span>
            </h2>
            <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-white/50">
              Track tenants, contracts, and payments in one centralized platform built for efficiency.
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-2.5">
            <StatCard icon={Home}       label="Properties"      value="48 Units"       sub="Cape Coral & Fort Myers" />
            <StatCard icon={Users}      label="Active Tenants"  value="41 Families"    sub="98% occupancy rate" />
            <StatCard icon={DollarSign} label="Monthly Revenue" value="$52,400"        sub="Current month collected" />
            <StatCard icon={TrendingUp} label="On-time Rate"    value="94.2%"          sub="Last 12 months" />
          </div>
        </div>
      </aside>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6 md:px-10">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:invisible">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">NeWell RMS</span>
          </div>

          {/* Theme toggle — always visible */}
          <div className="ml-auto">
            <ThemeToggle variant="dropdown" />
          </div>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px]">
            {/* Form header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to access your dashboard
              </p>
            </div>

            <LoginForm />

            {/* Footer note */}
            <p className="mt-8 text-center text-xs text-muted-foreground/60">
              Access restricted to authorized users only.
              <br />
              Contact your administrator if you need access.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 pb-6 md:px-10">
          <p className="text-xs text-muted-foreground/40">
            © 2025 NeWell Homes. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">v1.0</p>
        </div>
      </main>
    </div>
  );
}
