import { NextRequest, NextResponse } from 'next/server';

const RANKS = [
  { name: 'Ignition', reqDirect: 3, reqTeam: 1000, reqLeg: 500, bonus: 25, rewardDay: 5, rewardDays: 5 },
  { name: 'Momentum', reqDirect: 5, reqTeam: 5000, reqLeg: 2500, bonus: 100, rewardDay: 10, rewardDays: 10 },
  { name: 'Velocity', reqDirect: 7, reqTeam: 10000, reqLeg: 5000, bonus: 250, rewardDay: 20, rewardDays: 15 },
  { name: 'Quantum', reqDirect: 10, reqTeam: 25000, reqLeg: 12500, bonus: 500, rewardDay: 40, rewardDays: 20 },
  { name: 'Fusion', reqDirect: 12, reqTeam: 50000, reqLeg: 25000, bonus: 1000, rewardDay: 75, rewardDays: 25 },
  { name: 'Infinity', reqDirect: 15, reqTeam: 100000, reqLeg: 50000, bonus: 2500, rewardDay: 150, rewardDays: 30 },
  { name: 'Titan', reqDirect: 20, reqTeam: 250000, reqLeg: 125000, bonus: 5000, rewardDay: 300, rewardDays: 30 },
  { name: 'Apex', reqDirect: 25, reqTeam: 500000, reqLeg: 250000, bonus: 10000, rewardDay: 600, rewardDays: 30 },
  { name: 'Zenith', reqDirect: 30, reqTeam: 1000000, reqLeg: 500000, bonus: 25000, rewardDay: 1250, rewardDays: 30 },
  { name: 'Legacy', reqDirect: 40, reqTeam: 2500000, reqLeg: 1250000, bonus: 50000, rewardDay: 3000, rewardDays: 30 },
];

export async function GET(_request: NextRequest) {
  return NextResponse.json(RANKS);
}
