export interface User {
  uid: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy: string;
  balance: number;
  walletBalance: number;
  status: 'active' | 'inactive';
  role: string;
  referrals: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  totalPackageSpend: number;
  teamBiz: number;
  totalDirects: number;
  activeDirects: number;
  commissionBalance: number;
  totalCommissions: number;
  activePackage: string;
  packageAmount: number;
  packageBoost: number;
  packageCap: number;
  packageUsage: number;
  packageStatus: string;
  rank: string;
  lastClaim: number;
  streakDays: number;
  totalEarnings: number;
  legABiz: number;
  legBBiz: number;
  createdAt: number;
  verifiedLeader?: boolean;
  leaderStatus?: string;
  purchasedPackages?: PackagePurchase[];
  adminNotes?: { text: string; addedBy: string; createdAt: number }[];
}

export interface Deposit {
  id: string;
  uid: string;
  address: string;
  network: string;
  amount: string;
  txHash: string;
  status: 'pending' | 'completed' | 'expired';
  token: string;
  polAmount: number;
  polPrice: number;
  detectedAt: number;
  createdAt: number;
}

export interface Withdrawal {
  id: string;
  uid: string;
  amount: string;
  wallet: string;
  fee: string;
  network: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  txHash?: string;
  createdAt: number;
  processedAt?: number;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  boost: number;
  cap: number;
}

export interface PackagePurchase {
  id: string;
  packageName: string;
  amount: number;
  purchasedAt: number;
}

export interface Commission {
  id: string;
  uid: string;
  fromUid: string;
  fromName: string;
  amount: number;
  level: number;
  type: string;
  packageName: string;
  createdAt: number;
}

export interface AchievementBonus {
  id: string;
  uid: string;
  amount: number;
  rank: string;
  createdAt: number;
}

export interface LeadershipReward {
  id: string;
  uid: string;
  amount: number;
  rank: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string;
  readBy: string[];
  createdAt: number;
  deleteAt?: number;
}

export interface Popup {
  id: string;
  title: string;
  message: string;
  active: boolean;
  expiresAt?: number;
}

export interface LeaderboardEntry {
  uid: string;
  name: string;
  rank: number;
  balance: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
}

export interface AdminStats {
  totalUsers: number;
  usersWithPackage: number;
  usersWithoutPackage: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  totalRewards: number;
  totalBonuses: number;
  totalPackageSales: number;
  packageCount: number;
  totalClaims: number;
  rankCounts: Record<string, number>;
  topDepositors: { uid: string; name: string; amount: number }[];
  pendingWithdrawalsList: { id: string; uid: string; amount: string; wallet: string; createdAt: number }[];
  packageBreakdown: { name: string; count: number; revenue: number }[];
  todayDeposits: number;
  todayWithdrawals: number;
  todayRewards: number;
  todayRegistrations: number;
  recentRewards: LeadershipReward[];
  recentDeposits: Deposit[];
  topWithdrawers: { uid: string; name: string; amount: number; count: number }[];
  recentUsers: User[];
  users: User[];
}

export interface TeamMember {
  uid: string;
  name: string;
  email: string;
  referralCode: string;
  referredBy: string;
  activePackage: string;
  packageStatus: string;
  totalPackageSpend: number;
  createdAt: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
}

export const PACKAGES: Package[] = [
  { id: 'starter', name: 'Starter', price: 5, boost: 1.0, cap: 50 },
  { id: 'builder', name: 'Builder', price: 10, boost: 1.5, cap: 150 },
  { id: 'pioneer', name: 'Pioneer', price: 25, boost: 2.0, cap: 500 },
  { id: 'elite', name: 'Elite', price: 50, boost: 3.0, cap: 1500 },
  { id: 'titan', name: 'Titan', price: 100, boost: 4.0, cap: 4000 },
  { id: 'dominion', name: 'Dominion', price: 250, boost: 5.0, cap: 12500 },
  { id: 'legacy', name: 'Legacy', price: 500, boost: 7.0, cap: 35000 },
];

export const RANKS = [
  { name: 'Ignition', minDirects: 3, minTeamBiz: 1000, dailyReward: 1 },
  { name: 'Momentum', minDirects: 5, minTeamBiz: 5000, dailyReward: 2 },
  { name: 'Velocity', minDirects: 8, minTeamBiz: 15000, dailyReward: 5 },
  { name: 'Quantum', minDirects: 12, minTeamBiz: 50000, dailyReward: 10 },
  { name: 'Fusion', minDirects: 16, minTeamBiz: 150000, dailyReward: 25 },
  { name: 'Infinity', minDirects: 20, minTeamBiz: 500000, dailyReward: 50 },
  { name: 'Titan', minDirects: 25, minTeamBiz: 1000000, dailyReward: 100 },
  { name: 'Apex', minDirects: 30, minTeamBiz: 1500000, dailyReward: 200 },
  { name: 'Zenith', minDirects: 35, minTeamBiz: 2000000, dailyReward: 350 },
  { name: 'Legacy', minDirects: 40, minTeamBiz: 2500000, dailyReward: 500 },
];
