export function toDDMMYYYY(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T00:00:00Z');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export function parseDDMMYYYY(str) {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T00:00:00Z');
  const monthStr = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  return `${monthStr}-${year}`;
}
