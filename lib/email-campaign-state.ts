const DAILY_LIMIT = 450;

export const campaignState = {
  running: false,
  logs: [] as any[],
  sent: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  startedAt: 0,
};

let sseWriteCallbacks: ((data: string) => void)[] = [];

export function registerSseClient(write: (data: string) => void) {
  sseWriteCallbacks.push(write);
}

export function unregisterSseClient(write: (data: string) => void) {
  sseWriteCallbacks = sseWriteCallbacks.filter(c => c !== write);
}

export function broadcastSse(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseWriteCallbacks.forEach(write => write(payload));
}
