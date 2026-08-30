import { NextRequest, NextResponse } from 'next/server';
import { get, update, set } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

const ROI_MAP: Record<string, { price: number; days: number; maxRoi: number }> = {
  starter: { price: 5, days: 30, maxRoi: 1.5 },
  builder: { price: 10, days: 45, maxRoi: 4.5 },
  pioneer: { price: 25, days: 60, maxRoi: 15 },
  elite: { price: 50, days: 90, maxRoi: 45 },
  titan: { price: 100, days: 120, maxRoi: 120 },
  dominion: { price: 250, days: 180, maxRoi: 450 },
  legacy: { price: 500, days: 365, maxRoi: 1825 },
};

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.package_status !== 'active' || !user.active_package) {
      return NextResponse.json({ error: 'No active package' }, { status: 400 });
    }

    const pkg = ROI_MAP[user.active_package as string];
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const now = Date.now();
    const roiStartedAt = Number(user.roi_started_at) || 0;
    let startTimestamp = roiStartedAt;

    if (!startTimestamp) {
      startTimestamp = now;
      await update('users', uid, { roi_started_at: startTimestamp });
    }

    const daysElapsed = Math.floor((now - startTimestamp) / (1000 * 60 * 60 * 24));

    if (daysElapsed >= pkg.days) {
      return NextResponse.json({ error: 'ROI period completed' }, { status: 400 });
    }

    const dailyRoi = parseFloat((pkg.price * 0.01).toFixed(2));
    const totalClaimed = Number(user.roi_total_claimed) || 0;

    if (totalClaimed + dailyRoi > pkg.maxRoi) {
      return NextResponse.json({ error: 'Maximum ROI already reached' }, { status: 400 });
    }

    const lastRoiClaim = Number(user.last_roi_claim) || 0;
    if (lastRoiClaim > 0 && (now - lastRoiClaim) < 24 * 60 * 60 * 1000) {
      const hoursLeft = ((24 * 60 * 60 * 1000) - (now - lastRoiClaim)) / (1000 * 60 * 60);
      return NextResponse.json({ error: `Next claim available in ${hoursLeft.toFixed(1)} hours` }, { status: 400 });
    }

    const newBalance = (Number(user.balance) || 0) + dailyRoi;
    const newTotalClaimed = totalClaimed + dailyRoi;
    const newDaysCompleted = (Number(user.roi_days_completed) || 0) + 1;

    await update('users', uid, {
      balance: newBalance,
      roi_total_claimed: newTotalClaimed,
      roi_days_completed: newDaysCompleted,
      last_roi_claim: now,
    });

    const historyId = 'roi_' + uid + '_' + Date.now();
    await set('roi_history', historyId, {
      id: historyId,
      uid,
      amount: dailyRoi,
      package_id: user.active_package,
      day_number: newDaysCompleted,
      created_at: now,
    }, 'id');

    const remainingDays = pkg.days - daysElapsed - 1;
    const remainingRoi = pkg.maxRoi - newTotalClaimed;

    await createNotification(uid, 'ROI Claimed', `Daily ROI of ${dailyRoi.toFixed(4)} ONC credited to your balance`, 'roi');

    return NextResponse.json({
      success: true,
      amount: dailyRoi,
      totalClaimed: newTotalClaimed,
      remainingDays: Math.max(0, remainingDays),
      maxRoi: pkg.maxRoi,
      remainingRoi: parseFloat(remainingRoi.toFixed(2)),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
