// สถานะปัจจุบัน → สถานะที่เปลี่ยนไปได้
export const ORDER_STATUS_TRANSITIONS = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_TRANSITIONS);

export function canTransition(from, to) {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}