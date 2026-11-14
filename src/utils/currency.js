export function formatNpr(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'NPR 0';
  return `NPR ${amount.toLocaleString()}`;
}
