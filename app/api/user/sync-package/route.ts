import { NextRequest, NextResponse } from 'next/server';
import { update } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      uid,
      name,
      email,
      activePackage,
      packageAmount,
      packageBoost,
      packageCap,
      packageUsage,
      packageStatus,
      totalPackageSpend,
      walletBalance,
      purchasedPackages,
    } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (activePackage !== undefined) updates.active_package = activePackage;
    if (packageAmount !== undefined) updates.package_amount = packageAmount;
    if (packageBoost !== undefined) updates.package_boost = packageBoost;
    if (packageCap !== undefined) updates.package_cap = packageCap;
    if (packageUsage !== undefined) updates.package_usage = packageUsage;
    if (packageStatus !== undefined) updates.package_status = packageStatus;
    if (totalPackageSpend !== undefined) updates.total_package_spend = totalPackageSpend;
    if (walletBalance !== undefined) updates.wallet_balance = walletBalance;
    if (purchasedPackages !== undefined)
      updates.purchased_packages = JSON.stringify(purchasedPackages);
    updates.updated_at = Date.now();

    await update('users', uid, updates);
    return NextResponse.json({ synced: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
