// NeWell RMS — Frontend Types
// Mirrors the backend Prisma models and API responses

export type UserRole = "OWNER" | "ADMIN" | "COBRADOR" | "TENANT";
export type PropStatus = "OCCUPIED" | "EMPTY" | "RESERVED" | "RTO" | "SOLD" | "ARCHIVED";
export type ContractType = "REGULAR" | "RTO";
export type ContractStatus = "ACTIVE" | "EXPIRED" | "RENEWED" | "CANCELLED";
export type PaymentStatus = "PAID_ON_TIME" | "PAID_LATE" | "PARTIAL" | "PENDING" | "NOT_APPLICABLE";
export type PaymentMethod = "HEMLANE" | "MONEY_ORDER" | "CASH" | "CHECK" | "ZELLE_MIKE" | "ZELLE_NADER";
export type AlertSeverity = "RED" | "YELLOW" | "GREEN";
export type AlertType = "CONTRACT_EXPIRING" | "CONTRACT_EXPIRED" | "PAYMENT_OVERDUE" | "PROPERTY_VACANT";

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  profileId: string;
  supabaseUid: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
}

export interface LoginResponse {
  user: { id: string; email: string } | null;
  access_token: string | null;
  refresh_token: string | null;
  profile: AuthUser | null;
}

// ─── Property ──────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  address: string;
  houseModel: string;
  city: string;
  baseRent: string; // Decimal serialized as string in API responses
  status: PropStatus;
  contractType: ContractType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenants?: TenantSummary[];
  contracts?: Contract[];
  paymentRecords?: PaymentRecord[];
  _count?: { contracts: number; paymentRecords: number };
}

/** Body for create/update property; backend expects baseRent as number */
export type PropertyCreateUpdateBody = Omit<Partial<Property>, "baseRent"> & {
  baseRent?: number;
};

export interface TenantSummary {
  id: string;
  displayName: string;
  rentAmount: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Tenant ────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  supabaseUid?: string | null;
  displayName: string;
  email: string;
  phone?: string | null;
  propertyId: string;
  moveInDate: string;
  rentAmount: string;
  preferredPayment?: PaymentMethod | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property?: PropertySummary;
  contracts?: Contract[];
  paymentRecords?: PaymentRecord[];
  tenantNotes?: TenantNote[];
}

export interface PropertySummary {
  id: string;
  address: string;
  city: string;
  houseModel: string;
}

// ─── Contract ──────────────────────────────────────────────────────────────

export interface Contract {
  id: string;
  tenantId: string;
  propertyId: string;
  type: ContractType;
  startDate: string;
  durationYears: number;
  endDate: string;
  status: ContractStatus;
  renewalNumber: number;
  parentContractId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: TenantSummary;
  property?: PropertySummary;
  rtoDetail?: RTODetail | null;
  renewals?: { id: string; status: ContractStatus }[];
}

export interface RTODetail {
  id: string;
  contractId: string;
  purchasePrice: string;
  egsFee: string;
  totalSalePrice: string;
  optionAgreementMonthly: string;
  initialDeposit: string;
  ceaseRentalDate?: string | null;
  closingDate?: string | null;
}

// ─── Payment ───────────────────────────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  contractId?: string | null;
  billingMonth: number;
  billingYear: number;
  rentAmount: string;
  securityDeposit: string;
  lastMonthDeposit: string;
  lateFeesAmount: string;
  amountPaid: string;
  pendingBalance: string;
  paymentStatus: PaymentStatus;
  paymentDate?: string | null;
  receivedBy?: string | null;
  paymentMethod?: PaymentMethod | null;
  depositConfirmed: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: { id: string; displayName: string; rentAmount: string; phone?: string | null; preferredPayment?: PaymentMethod | null };
  property?: { id: string; address: string; city: string };
  transactions?: PaymentTransaction[];
  // Enriched by backend
  lateFeeToday?: number;
  totalDueToday?: number;
}

export interface PaymentTransaction {
  id: string;
  paymentRecordId: string;
  amount: string;
  transactionDate: string;
  paymentMethod: PaymentMethod;
  receivedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ─── Notes ─────────────────────────────────────────────────────────────────

export interface TenantNote {
  id: string;
  tenantId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  author?: { name: string; role: UserRole };
}

// ─── Users ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  supabaseUid: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  properties: {
    total: number;
    empty: number;
    rto: number;
    soldThisYear: number;
    occupied: number;
  };
  tenants: { active: number };
  payments: {
    month: number;
    year: number;
    expected: number;
    collected: number;
    collectionRate: number;
    overdueCount: number;
    totalLateFees: number;
  };
  last12Months: { month: number; year: number; collected: number }[];
}

export interface DashboardAlerts {
  contracts: ContractAlert[];
  payments: PaymentAlert[];
  vacant: VacantAlert[];
  totals: { red: number; yellow: number; green: number };
}

export interface ContractAlert {
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  entityType: string;
  entityId: string;
  tenant: { id: string; displayName: string };
  property: { id: string; address: string; city: string };
  endDate: string;
}

export interface PaymentAlert {
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  entityType: string;
  entityId: string;
  tenant: { id: string; displayName: string; phone?: string | null };
  property: { id: string; address: string; city: string };
  rentAmount: number;
}

export interface VacantAlert {
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  entityType: string;
  entityId: string;
  property: { id: string; address: string; city: string; updatedAt: string };
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const HOUSE_MODELS = [
  "LANGDON", "EMELIA", "NINA", "AURORA", "DELANIE",
  "VIANA", "LOUSIANA", "DUPLEX", "RENTA_VARIABLE",
] as const;

export const CITIES = ["LABELLE", "LEHIGH"] as const;

export const PAYMENT_METHODS: PaymentMethod[] = [
  "HEMLANE", "MONEY_ORDER", "CASH", "CHECK", "ZELLE_MIKE", "ZELLE_NADER",
];

export const PROP_STATUSES: PropStatus[] = [
  "OCCUPIED", "EMPTY", "RESERVED", "RTO", "SOLD", "ARCHIVED",
];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
