import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PropStatus, ContractStatus, PaymentStatus, AlertSeverity } from "@/lib/types";

// ─── Property Status ────────────────────────────────────────────────────────

const PROP_STATUS_STYLES: Record<PropStatus, string> = {
  OCCUPIED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  EMPTY:    "bg-amber-500/15 text-amber-400 border-amber-500/20",
  RESERVED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  RTO:      "bg-purple-500/15 text-purple-400 border-purple-500/20",
  SOLD:     "bg-slate-500/15 text-slate-400 border-slate-500/20",
  ARCHIVED: "bg-slate-500/10 text-slate-500 border-slate-500/10",
};

export const PropStatusBadge = ({ status }: { status: PropStatus }) => (
  <Badge
    variant="outline"
    className={cn("text-xs font-medium", PROP_STATUS_STYLES[status])}
  >
    {status}
  </Badge>
);

// ─── Contract Status ────────────────────────────────────────────────────────

const CONTRACT_STATUS_STYLES: Record<ContractStatus, string> = {
  ACTIVE:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  EXPIRED:   "bg-red-500/15 text-red-400 border-red-500/20",
  RENEWED:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CANCELLED: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

export const ContractStatusBadge = ({ status }: { status: ContractStatus }) => (
  <Badge
    variant="outline"
    className={cn("text-xs font-medium", CONTRACT_STATUS_STYLES[status])}
  >
    {status}
  </Badge>
);

// ─── Payment Status ─────────────────────────────────────────────────────────

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID_ON_TIME:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  PAID_LATE:      "bg-amber-500/15 text-amber-400 border-amber-500/20",
  PARTIAL:        "bg-blue-500/15 text-blue-400 border-blue-500/20",
  PENDING:        "bg-red-500/15 text-red-400 border-red-500/20",
  NOT_APPLICABLE: "bg-slate-500/10 text-slate-500 border-slate-500/10",
};

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge
    variant="outline"
    className={cn("text-xs font-medium", PAYMENT_STATUS_STYLES[status])}
  >
    {status.replace(/_/g, " ")}
  </Badge>
);

// ─── Alert Severity ─────────────────────────────────────────────────────────

const ALERT_SEVERITY_STYLES: Record<AlertSeverity, string> = {
  RED:    "bg-red-500/15 text-red-400 border-red-500/20",
  YELLOW: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  GREEN:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export const AlertSeverityDot = ({ severity }: { severity: AlertSeverity }) => (
  <span
    className={cn(
      "inline-block h-2 w-2 rounded-full",
      severity === "RED" ? "bg-red-500" : severity === "YELLOW" ? "bg-amber-400" : "bg-emerald-500"
    )}
    aria-label={severity}
  />
);

export const AlertSeverityBadge = ({ severity }: { severity: AlertSeverity }) => (
  <Badge
    variant="outline"
    className={cn("text-xs font-medium", ALERT_SEVERITY_STYLES[severity])}
  >
    {severity}
  </Badge>
);
