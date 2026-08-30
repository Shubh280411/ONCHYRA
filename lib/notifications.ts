import { set } from './db';

export async function createNotification(
  uid: string,
  title: string,
  message: string,
  type: string = 'info'
) {
  const id = 'notif_' + uid + '_' + Date.now();
  await set('notifications', id, {
    user_id: uid,
    title,
    message,
    type,
    readBy: [],
    created_at: Date.now(),
  });
}
