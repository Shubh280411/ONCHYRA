import { NextRequest, NextResponse } from 'next/server';
import { findWhere, update, set } from '@/lib/db';

const ROI_MAP: Record<string, { price: number; days: number; maxRoi: number }> = {
  starter: { price: 5, days: 30, maxRoi: 1.5 },
  builder: { price: 10, days: 45, maxRoi: 4.5 },
  pioneer: { price: 25, days: 60, maxRoi: 15 },
  elite: { price: 50, days: 90, maxRoi: 45 },
  titan: { price: 100, days: 120, maxRoi: 120 },
  dominion: { price: 250, days: 180, maxRoi: 450 },
  legacy: { price: 500, days: 365, maxRoi: 1825 },
};

export async function GET(_request: NextRequest) {
  const stats = { processed: 0, credited: 0, errors: 0, errorsList: [] as string[] };

  try {
    const activeUsers = await findWhere('users', { package_status: 'active' });
    stats.processed = activeUsers.length;

    const now = Date.now();

    for (const user of activeUsers) {
      try {
        const uid = user.uid as string;
        const activePackage = user.active_package as string;

        if (!activePackage || !ROI_MAP[activePackage]) continue;

        // Skip if ROI is disabled for this user
        if (user.roi_enabled !== true) continue;

        const pkg = ROI_MAP[activePackage];

        const roiStartedAt = Number(user.roi_started_at) || 0;
        if (!roiStartedAt) {
          await update('users', uid, { roi_started_at: now });
          user.roi_started_at = now;
        }

        const startTs = Number(user.roi_started_at) || now;
        const daysElapsed = Math.floor((now - startTs) / (1000 * 60 * 60 * 24));

        if (daysElapsed >= pkg.days) continue;

        const totalClaimed = Number(user.roi_total_claimed) || 0;
        if (totalClaimed >= pkg.maxRoi) continue;

        const lastRoiClaim = Number(user.last_roi_claim) || 0;
        if (lastRoiClaim > 0 && (now - lastRoiClaim) < 24 * 60 * 60 * 1000) continue;

        const dailyRoi = parseFloat((pkg.price * 0.01).toFixed(2));

        if (totalClaimed + dailyRoi > pkg.maxRoi) continue;

        const newBalance = (Number(user.balance) || 0) + dailyRoi;
        const newTotalClaimed = totalClaimed + dailyRoi;
        const newDaysCompleted = (Number(user.roi_days_completed) || 0) + 1;

        await update('users', uid, {
          balance: newBalance,
          roi_total_claimed: newTotalClaimed,
          roi_days_completed: newDaysCompleted,
          last_roi_claim: now,
        });

        const historyId = 'roi_' + uid + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        await set('roi_history', historyId, {
          id: historyId,
          uid,
          amount: dailyRoi,
          package_id: activePackage,
          day_number: newDaysCompleted,
          created_at: now,
        }, 'id');

        stats.credited++;
      } catch (err: unknown) {
        stats.errors++;
        const msg = err instanceof Error ? err.message : String(err);
        stats.errorsList.push(msg.slice(0, 100));
      }
    }

    return NextResponse.json({
      success: true,
      processed: stats.processed,
      credited: stats.credited,
      errors: stats.errors,
      errorsList: stats.errorsList,
      timestamp: now,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, ...stats }, { status: 500 });
  }
}
