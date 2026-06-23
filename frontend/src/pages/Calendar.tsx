import { useEffect, useState } from 'react';
import { calendarApi, transactionApi } from '../api/client';
import type { CalendarDay, Transaction } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

export default function Calendar() {
  const { currency } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([]);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    calendarApi.getData(month, year).then(r => setCalendarData(r.data));
  }, [month, year]);

  const handleDayClick = async (dateStr: string) => {
    setSelectedDay(dateStr);
    const { data } = await transactionApi.getAll({
      startDate: dateStr, endDate: dateStr + 'T23:59:59', pageSize: 50
    });
    setDayTransactions(data.items);
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const startPadding = getDay(startOfMonth(currentDate));
  const spendingMap = Object.fromEntries(calendarData.map(d => [d.date, d]));
  const fmt = (n: number) => formatCurrency(n, currency);

  const intensityClass = (intensity: string) => {
    if (intensity === 'high') return 'cal-high';
    if (intensity === 'medium') return 'cal-medium';
    return 'cal-low';
  };

  return (
    <div className="animate-fade-up">
      <div className="d-flex justify-content-between align-items-center page-title-bar">
        <h4 className="fw-bold mb-0">Analytics</h4>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-fin-outline btn-fin-sm" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="fw-semibold">{format(currentDate, 'MMMM yyyy')}</span>
          <button className="btn btn-fin-outline btn-fin-sm" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
        <div className="fin-card">
          <div className="calendar-weekdays d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center small fw-semibold text-muted py-2">{d}</div>)}
          </div>
          <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} className="cal-day empty" />)}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const data = spendingMap[dateStr];
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay === dateStr;
              return (
                <div
                  key={dateStr}
                  className={`cal-day d-flex flex-column ${data ? intensityClass(data.intensity) : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDayClick(dateStr)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleDayClick(dateStr)}
                >
                  <span className="cal-day-num">{format(day, 'd')}</span>
                  {data && data.totalSpending > 0 ? (
                    <span className="cal-day-amount badge rounded-pill text-bg-light border mt-auto">
                      {fmt(data.totalSpending)}
                    </span>
                  ) : (
                    <span className="cal-day-amount-placeholder" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="d-flex gap-3 mt-3 small text-muted">
            <span><span className="cal-legend-dot cal-legend-low"></span> Low</span>
            <span><span className="cal-legend-dot cal-legend-med"></span> Medium</span>
            <span><span className="cal-legend-dot cal-legend-high"></span> High</span>
          </div>
        </div>
        </div>

        {selectedDay && (
          <div className="col-lg-4">
          <div className="fin-card">
            <div className="fin-card-title"><span>{format(new Date(selectedDay), 'EEEE, MMM d')}</span></div>
            {dayTransactions.length === 0 ? (
              <p className="text-muted">No transactions on this day</p>
            ) : (
              <div className="day-transactions">
                {dayTransactions.map(t => (
                  <div key={t.transactionId} className="day-tx-item">
                    <strong className="day-tx-desc">{t.description || t.categoryName}</strong>
                    <div className="day-tx-right">
                      <span className="day-tx-amount">{fmt(t.amount)}</span>
                      {t.description && t.categoryName && (
                        <span className="day-tx-cat">{t.categoryName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
