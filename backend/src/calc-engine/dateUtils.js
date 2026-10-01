// Excel's epoch: December 30, 1899
const EXCEL_EPOCH = new Date(1899, 11, 30);

function excelSerialToDate(serial) {
  const date = new Date(EXCEL_EPOCH.getTime() + serial * 24 * 60 * 60 * 1000);
  return date;
}

function excelTimeFractionToHHMM(fraction) {
  if (fraction == null || fraction === 0) return null;
  const hours = Math.floor(fraction * 24);
  const minutes = Math.round((fraction * 24 - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDDMMYYYY(str) {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function formatMonthLabel(isoDateStr) {
  if (!isoDateStr) return null;
  const date = new Date(isoDateStr + 'T00:00:00Z');
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  return `${month}-${year}`;
}

function daysBetween(isoDateA, isoDateB) {
  if (!isoDateA || !isoDateB) return null;
  const dateA = new Date(isoDateA + 'T00:00:00Z');
  const dateB = new Date(isoDateB + 'T00:00:00Z');
  const diffMs = dateB - dateA;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

function todayISO() {
  const today = new Date();
  return toISODate(today);
}

module.exports = {
  excelSerialToDate,
  excelTimeFractionToHHMM,
  toISODate,
  parseDDMMYYYY,
  formatMonthLabel,
  daysBetween,
  todayISO,
};
