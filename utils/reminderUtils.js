// ─── Date helpers ─────────────────────────────────────────────────────────────

// Returns today at midnight in LOCAL time — no UTC conversion, no timezone bugs.
export function todayDateOnly() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Parses a 'YYYY-MM-DD' string to midnight LOCAL time.
// Using `new Date('YYYY-MM-DD')` would give UTC midnight and cause a
// one-day-off error for users west of UTC, so we split manually instead.
export function parseDateOnly(str) {
  const [y, m, day] = str.split('-').map(Number);
  return new Date(y, m - 1, day);
}

// ─── Status derivation ────────────────────────────────────────────────────────
//
// Returns one of three string literals:
//   'finished' — every participant has marked the reminder done
//   'missed'   — not finished AND the reminder date is before today
//   'pending'  — not finished AND the reminder date is today or in the future
//                (also 'pending' when no date is set)
//
// `reminder` must have: { completedBy?: Record<string, boolean>, date?: string }

export function getReminderStatus(reminder) {
  const values = Object.values(reminder.completedBy || {});
  const fullyCompleted = values.length > 0 && values.every(v => v === true);

  if (fullyCompleted) return 'finished';

  if (reminder.date) {
    const reminderDate = parseDateOnly(reminder.date);
    if (reminderDate < todayDateOnly()) return 'missed';
  }

  return 'pending';
}
