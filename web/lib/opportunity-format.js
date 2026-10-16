// lib/opportunity-format.js — how an opportunity reads on the board.
// Kept apart from lib/opportunities.js, which imports the whole data file
// (closed calls included): the board is a client component, and this way only
// the live list it is handed reaches the browser.

export const OPPORTUNITY_TYPES = [
  { slug: 'competition', label: 'Competitions', one: 'Competition' },
  { slug: 'open-call', label: 'Open calls', one: 'Open call' },
  { slug: 'commission', label: 'Commissions', one: 'Commission' },
];

// An entry with no confirmed deadline would otherwise stay listed for ever.
// It drops off this long after it was first found, unless someone fills the
// deadline in.
export const UNDATED_LIFETIME_DAYS = 60;

// Today in the UK, as YYYY-MM-DD. A call that closes "on 30 November" is open
// all of that day here, whatever the build server's clock says.
export function ukToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(now);
}

const addDays = (day, n) => {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// The last day an entry is live: its deadline, or for an undated one the end
// of its grace period from first being found.
export function lastLiveDay(o) {
  if (o.deadline) return o.deadline;
  const found = o.sources.map((s) => s.found).sort()[0];
  return addDays(found, UNDATED_LIFETIME_DAYS);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function displayDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const SYMBOL = { GBP: '£', EUR: '€', USD: '$' };

export function feeLabel(fee) {
  if (fee.free === true) return 'Free to enter';
  if (fee.free === false) {
    if (fee.amount != null) {
      const amt = Number.isInteger(fee.amount) ? fee.amount : fee.amount.toFixed(2);
      const money = SYMBOL[fee.currency] ? `${SYMBOL[fee.currency]}${amt}` : `${amt} ${fee.currency}`;
      return `Entry fee ${money}${fee.note ? ` ${fee.note}` : ''}`;
    }
    return `Entry fee${fee.note ? `: ${fee.note}` : ''}`;
  }
  return 'Fee: see the official page';
}

const RIGHTS_TEXT = {
  perpetual: 'perpetual licence',
  exclusive: 'exclusive rights',
  'commercial-unpaid': 'unpaid commercial use',
  'all-entrants': 'applies to all entries',
  'copyright-transfer': 'copyright transferred',
};

export const rightsLabel = (flag) => RIGHTS_TEXT[flag] || flag;

export const REGION_LABEL = { uk: 'UK', worldwide: 'Worldwide', elsewhere: 'Outside the UK' };
