import { get } from '@/lib/db';
import { campaignState, registerSseClient, unregisterSseClient, broadcastSse } from '@/lib/email-campaign-state';

const DAILY_LIMIT = 450;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyDoc(dateStr: string) {
  const row = await get('settings', 'emailCounts', 'key');
  const counts: Record<string, any> = row ? (row.value || {}) : {};
  const day = counts[dateStr] || { count: 0, limit: DAILY_LIMIT };
  return { count: day.count || 0, limit: day.limit || DAILY_LIMIT };
}

export async function GET() {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let writeCallback: ((data: string) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      writeCallback = (payload: string) => {
        try { controller.enqueue(encoder.encode(payload)); } catch {}
      };

      registerSseClient(writeCallback);

      // Send initial daily stats
      (async () => {
        try {
          const { count, limit } = await getDailyDoc(todayStr());
          broadcastSse({ type: 'daily', count, limit, remaining: limit - count });
        } catch {
          broadcastSse({ type: 'daily', count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT });
        }
      })();

      // Send current campaign state
      const initData = {
        type: 'init',
        running: campaignState.running,
        sent: campaignState.sent,
        failed: campaignState.failed,
        skipped: campaignState.skipped,
        total: campaignState.total,
        logs: campaignState.logs,
      };
      writeCallback(`data: ${JSON.stringify(initData)}\n\n`);

      // Heartbeat ping
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 5000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (writeCallback) unregisterSseClient(writeCallback);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
