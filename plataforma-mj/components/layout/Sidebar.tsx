"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  UserCog,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { logoutFromBackend } from "@/lib/api/auth";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  href: string;
  roles: UserRole[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  exact?: boolean;
  children?: NavChild[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// ─── Navigation Definition ───────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["OWNER", "ADMIN", "COBRADOR"],
        exact: true,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Properties",
        href: "/dashboard/properties",
        icon: Building2,
        roles: ["OWNER", "ADMIN"],
      },
      {
        label: "Tenants",
        href: "/dashboard/tenants",
        icon: Users,
        roles: ["OWNER", "ADMIN", "COBRADOR"],
      },
      {
        label: "Contracts",
        href: "/dashboard/contracts",
        icon: FileText,
        roles: ["OWNER", "ADMIN"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Payments",
        href: "/dashboard/payments",
        icon: CreditCard,
        roles: ["OWNER", "ADMIN", "COBRADOR"],
        children: [
          {
            label: "Collect Today",
            href: "/dashboard/payments/collect",
            roles: ["OWNER", "ADMIN", "COBRADOR"],
          },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Team",
        href: "/dashboard/users",
        icon: UserCog,
        roles: ["OWNER", "ADMIN"],
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["OWNER", "ADMIN"],
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const ROLE_COLORS: Record<UserRole, string> = {
  OWNER:    "text-amber-400",
  ADMIN:    "text-blue-400",
  COBRADOR: "text-emerald-400",
  TENANT:   "text-slate-400",
};

const ROLE_DOT: Record<UserRole, string> = {
  OWNER:    "bg-amber-400",
  ADMIN:    "bg-blue-400",
  COBRADOR: "bg-emerald-400",
  TENANT:   "bg-slate-400",
};

// ─── Active Logic ─────────────────────────────────────────────────────────────

const isItemActive = (href: string, pathname: string, exact?: boolean): boolean => {
  if (exact) return pathname === href;
  if (pathname === href) return true;
  return pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
};

const isParentActive = (item: NavItem, pathname: string): boolean => {
  if (item.exact) return pathname === item.href;
  if (item.children) {
    const childMatches = item.children.some((c) => pathname === c.href);
    if (childMatches) return false;
  }
  return isItemActive(item.href, pathname, item.exact);
};

const isParentExpanded = (item: NavItem, pathname: string): boolean => {
  if (!item.children) return false;
  return pathname.startsWith(item.href + "/") || pathname === item.href;
};

// ─── Sub-item ────────────────────────────────────────────────────────────────

const NavChildItem = ({ child, pathname }: { child: NavChild; pathname: string }) => {
  const active = pathname === child.href;
  return (
    <Link
      href={child.href}
      className={cn(
        "group flex items-center gap-2 rounded-md py-1.5 pl-9 pr-3 text-xs font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
          active
            ? "bg-primary"
            : "bg-sidebar-foreground/20 group-hover:bg-sidebar-foreground/50"
        )}
      />
      {child.label}
    </Link>
  );
};

// ─── Nav Item ─────────────────────────────────────────────────────────────────

const NavItemRow = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const Icon = item.icon;
  const active = isParentActive(item, pathname);
  const expanded = isParentExpanded(item, pathname);
  const hasChildren = !!item.children?.length;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
          active
            ? "bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm"
            : expanded
            ? "bg-sidebar-accent/50 text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white/50" />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active
              ? "text-sidebar-primary-foreground"
              : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {hasChildren &&
          (expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-sidebar-foreground/40" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-sidebar-foreground/40" />
          ))}
      </Link>

      {hasChildren && expanded && (
        <ul className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <NavChildItem key={child.href} child={child} pathname={pathname} />
          ))}
        </ul>
      )}
    </li>
  );
};

// ─── Theme Toggle ─────────────────────────────────────────────────────────────


// ─── Sidebar ─────────────────────────────────────────────────────────────────

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  const handleLogout = async () => {
    try {
      await logoutFromBackend();
    } catch {
      // clear locally regardless
    }
    clearUser();
    router.push("/login");
    toast.success("Signed out successfully");
  };

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => user && item.roles.includes(user.role)),
  })).filter((g) => g.items.length > 0);

  return (
    <aside className="flex h-screen w-[224px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-semibold leading-none tracking-tight text-sidebar-foreground">
            NeWell RMS
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-sidebar-foreground/40">
            Rental Management
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-4">
          {visibleGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemRow key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent/50">
          <div className="relative shrink-0">
            <Avatar className="h-7 w-7 text-[10px]">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground/80 text-[10px] font-semibold">
                {user ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            {user && (
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-sidebar",
                  ROLE_DOT[user.role]
                )}
              />
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium leading-none text-sidebar-foreground">
              {user?.name ?? "—"}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide",
                user ? ROLE_COLORS[user.role] : "text-sidebar-foreground/30"
              )}
            >
              {user?.role ?? "—"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-sidebar-foreground/30 transition-colors hover:bg-destructive/15 hover:text-destructive"
            aria-label="Sign out"
            tabIndex={0}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
