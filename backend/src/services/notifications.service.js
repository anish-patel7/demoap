const db = require('../db');
const { todayISO } = require('../calc-engine/dateUtils');

// Signed whole-day difference (toISO - fromISO). Positive = in the future.
// Returns null if either date is missing or unparseable.
function signedDays(fromISO, toISO) {
  if (!fromISO || !toISO) return null;
  const a = new Date(`${fromISO}T00:00:00Z`);
  const b = new Date(`${String(toISO).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

// Build the notification list. Currently: broker password expiry alerts derived
// from each active account's password_expiry_date.
function getNotifications({ warnDays = 14 } = {}) {
  const today = todayISO();
  const accounts = db.all(
    `SELECT id, account_name, broker_name, password_expiry_date
       FROM accounts
      WHERE is_active = 1 AND password_expiry_date IS NOT NULL`,
    []
  );

  const alerts = [];
  for (const a of accounts) {
    const days = signedDays(today, a.password_expiry_date);
    if (days === null) continue;

    if (days < 0) {
      alerts.push({
        type: 'password_expired',
        severity: 'high',
        account_id: a.id,
        title: `${a.broker_name} password expired`,
        message: `${a.account_name}: password expired ${Math.abs(days)} day(s) ago`,
        date: a.password_expiry_date,
        days,
      });
    } else if (days <= warnDays) {
      alerts.push({
        type: 'password_expiring',
        severity: days <= 3 ? 'high' : 'medium',
        account_id: a.id,
        title: `${a.broker_name} password expiring`,
        message:
          days === 0
            ? `${a.account_name}: password expires today`
            : `${a.account_name}: password expires in ${days} day(s)`,
        date: a.password_expiry_date,
        days,
      });
    }
  }

  // Most urgent first (expired = most negative).
  alerts.sort((x, y) => x.days - y.days);
  return { count: alerts.length, alerts };
}

module.exports = { getNotifications, signedDays };
