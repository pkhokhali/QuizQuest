/** userId -> socket, maintained by the battle namespace; used for online flags and challenges. */
export const onlineSockets = new Map();

export function isOnline(userId) {
  return onlineSockets.has(userId);
}
