import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

const ROI_MAP: Record<string, { price: number; days: number; maxRoi: number }> = {
  starter: { price: 5, days: 30, maxRoi: 1.5 },
  builder: { price: 10, days: 45, maxRoi: 4.5 },
  pioneer: { price: 25, days: 60, maxRoi: 15 },
  elite: { price: 50, days: 90, maxRoi: 45 },
  titan: { price: 100, days: 120, maxRoi: 120 },
  dominion: { price: 250, days: 180, maxRoi: 450 },
  legacy: { price: 500, days: 365, maxRoi: 1825 },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const activePackage = user.active_package as string | null;
    const packageStatus = user.package_status as string;

    // ROI disabled — return inactive
    if (user.roi_enabled !== true || !activePackage || packageStatus !== 'active') {
      return NextResponse.json({
        active: false,
        packageId: null,
        packagePrice: 0,
        dailyRoi: 0,
        totalRoi: 0,
        totalClaimed: 0,
        remainingDays: 0,
        daysCompleted: 0,
        roiStartedAt: null,
        nextClaimAvailable: false,
      });
    }

    const pkg = ROI_MAP[activePackage];
    if (!pkg) {
      return NextResponse.json({
        active: false,
        packageId: activePackage,
        packagePrice: 0,
        dailyRoi: 0,
        totalRoi: 0,
        totalClaimed: 0,
        remainingDays: 0,
        daysCompleted: 0,
        roiStartedAt: null,
        nextClaimAvailable: false,
      });
    }

    const now = Date.now();
    const roiStartedAt = Number(user.roi_started_at) || 0;
    const daysElapsed = roiStartedAt ? Math.floor((now - roiStartedAt) / (1000 * 60 * 60 * 24)) : 0;
    const totalClaimed = Number(user.roi_total_claimed) || 0;
    const daysCompleted = Number(user.roi_days_completed) || 0;
    const dailyRoi = parseFloat((pkg.price * 0.01).toFixed(2));
    const periodComplete = daysElapsed >= pkg.days;
    const roiMaxed = totalClaimed >= pkg.maxRoi;

    const lastRoiClaim = Number(user.last_roi_claim) || 0;
    const nextClaimAvailable = lastRoiClaim === 0 || (now - lastRoiClaim) >= 24 * 60 * 60 * 1000;

    return NextResponse.json({
      active: !periodComplete && !roiMaxed,
      packageId: activePackage,
      packagePrice: pkg.price,
      dailyRoi,
      totalRoi: pkg.maxRoi,
      totalClaimed: parseFloat(totalClaimed.toFixed(2)),
      remainingDays: Math.max(0, pkg.days - daysElapsed),
      daysCompleted,
      roiStartedAt: roiStartedAt || null,
      nextClaimAvailable,
      periodComplete,
      roiMaxed,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
