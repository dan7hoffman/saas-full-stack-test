// Account types
export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'INVESTMENT'
  | 'RETIREMENT'
  | 'PROPERTY'
  | 'VEHICLE'
  | 'CRYPTO'
  | 'OTHER';

// Liability types
export type LiabilityType =
  | 'CREDIT_CARD'
  | 'STUDENT_LOAN'
  | 'MORTGAGE'
  | 'AUTO_LOAN'
  | 'PERSONAL_LOAN'
  | 'OTHER';

// Balance entry
export interface Balance {
  id: string;
  accountId?: string;
  liabilityId?: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// Account model
export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  institution?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  balances?: Balance[];
}

// Liability model
export interface Liability {
  id: string;
  userId: string;
  name: string;
  type: LiabilityType;
  currency: string;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: number;
  institution?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  balances?: Balance[];
}

// Net worth data
export interface NetWorthData {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountCount?: number;
  liabilityCount?: number;
}

// API Request/Response types
export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  currency?: string;
  institution?: string;
  accountNumber?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
  institution?: string;
  accountNumber?: string;
  isActive?: boolean;
}

export interface CreateLiabilityRequest {
  name: string;
  type: LiabilityType;
  currency?: string;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: number;
  institution?: string;
  accountNumber?: string;
}

export interface UpdateLiabilityRequest {
  name?: string;
  type?: LiabilityType;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: number;
  institution?: string;
  accountNumber?: string;
  isActive?: boolean;
}

export interface CreateBalanceRequest {
  accountId?: string;
  liabilityId?: string;
  amount: number;
  date: string;
  note?: string;
}

export interface BulkBalanceEntry {
  accountId?: string;
  liabilityId?: string;
  amount: number;
}

export interface BulkUpdateBalancesRequest {
  date: string;
  balances: BulkBalanceEntry[];
  note?: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  meta?: {
    count?: number;
    timestamp?: string;
    [key: string]: any;
  };
}
