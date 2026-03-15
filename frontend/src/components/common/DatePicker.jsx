// DatePicker.jsx
import React, { useState } from 'react';

export function DatePicker({ minDate, maxDate, value, onChange, 'data-testid': testId }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || minDate || new Date());
  const [selected, setSelected] = useState(value || null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const selectDate = (d) => {
    const date = new Date(year, month, d);
    setSelected(date);
    onChange && onChange(date);
    setOpen(false);
  };

  const isDisabled = (d) => {
    const date = new Date(year, month, d);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSelected = (d) => {
    if (!selected) return false;
    return selected.getDate() === d && selected.getMonth() === month && selected.getFullYear() === year;
  };

  const isToday = (d) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} data-testid={testId || 'date-picker'}>
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => setOpen(o => !o)}
        data-testid="date-picker-trigger"
        aria-expanded={open}
        aria-haspopup="true"
      >
        📅 {selected ? selected.toLocaleDateString('en-IN') : 'Select Date'}
      </button>

      {open && (
        <div className="datepicker-popup" data-testid="datepicker-calendar" role="dialog" aria-label="Date picker">
          <div className="dp-header">
            <button type="button" className="dp-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))} data-testid="dp-prev-month">‹</button>
            <span className="dp-month-year" data-testid="dp-month-year">{months[month]} {year}</span>
            <button type="button" className="dp-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))} data-testid="dp-next-month">›</button>
          </div>
          <div className="dp-days-header">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="dp-day-label">{d}</span>)}
          </div>
          <div className="dp-grid">
            {Array(firstDay).fill(null).map((_, i) => <span key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
              <button
                key={d}
                type="button"
                className={`dp-day ${isSelected(d) ? 'selected' : ''} ${isToday(d) ? 'today' : ''} ${isDisabled(d) ? 'disabled' : ''}`}
                onClick={() => !isDisabled(d) && selectDate(d)}
                disabled={isDisabled(d)}
                data-testid={`dp-day-${d}`}
                aria-label={`${months[month]} ${d}, ${year}`}
                aria-selected={isSelected(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .datepicker-popup { position: absolute; top: calc(100% + 8px); left: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 16px; z-index: 300; min-width: 280px; animation: slideUp 150ms ease; }
        .dp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .dp-month-year { font-weight: 700; font-size: 0.9rem; }
        .dp-nav { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px 10px; cursor: pointer; font-size: 1rem; }
        .dp-days-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 8px; }
        .dp-day-label { text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); padding: 4px; }
        .dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .dp-day { background: none; border: none; border-radius: var(--radius-sm); padding: 7px 4px; font-size: 0.85rem; cursor: pointer; text-align: center; transition: all var(--transition); }
        .dp-day:hover:not(.disabled) { background: var(--bg-muted); }
        .dp-day.today { font-weight: 700; color: var(--accent); }
        .dp-day.selected { background: var(--primary); color: #fff; }
        .dp-day.disabled { color: var(--text-light); cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default DatePicker;
