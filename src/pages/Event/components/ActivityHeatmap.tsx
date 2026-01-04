import React from 'react';
import { EventWithStats } from '../../../types';

interface Props {
  events: EventWithStats[];
}

export const ActivityHeatmap: React.FC<Props> = ({ events }) => {
  // Generate +/- 6 months of data
  const generateHeatmapData = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 179); // ~6 months ago

    // Adjust to start from Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const activityMap: { [key: string]: number } = {};

    // Helper to get YYYY-MM-DD in local time
    const toLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Count events by date
    events.forEach(event => {
      try {
        const d = new Date(event.date);
        if (isNaN(d.getTime())) return;
        const dateKey = toLocalDateString(d);
        activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
      } catch (e) {
        console.warn('Invalid date format:', event.date);
      }
    });

    // Generate grid data (52 weeks x 7 days)
    const weeks: Array<Array<{ date: Date; count: number; dateKey: string }>> = [];
    let currentWeek: Array<{ date: Date; count: number; dateKey: string }> = [];

    const totalWeeks = 52;
    for (let i = 0; i < totalWeeks * 7; i++) {
      const date = new Date(startDate.getTime());
      date.setDate(date.getDate() + i);
      const dateKey = toLocalDateString(date);
      const count = activityMap[dateKey] || 0;

      currentWeek.push({ date, count, dateKey });

      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    return weeks;
  };

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count === 1) return 'bg-primary-300';
    if (count === 2) return 'bg-primary-500';
    return 'bg-primary-700';
  };

  const weeks = generateHeatmapData();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to get today's date string (YYYY-MM-DD)
  const todayDateKey = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Calculate which weeks show month labels
  const monthLabels: Array<{ week: number; label: string }> = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = firstDay.date.getMonth();
      // Hide the very first month label to avoid stacking
      if (month !== lastMonth && weekIndex > 0) {
        monthLabels.push({ week: weekIndex, label: months[month] });
        lastMonth = month;
      }
    }
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 w-full">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Activity Overview</h3>
        <p className="text-xs text-slate-500">Event activity (past 6 months to next 6 months)</p>
      </div>

      <div className="overflow-x-auto w-full pb-2">
        <div className="inline-flex flex-col min-w-max">
          {/* Month Labels */}
          <div className="flex mb-2 relative h-4" style={{ marginLeft: '32px' }}>
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-[10px] text-slate-400 font-bold absolute whitespace-nowrap"
                style={{ left: `${label.week * 16}px` }}
              >
                {label.label}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="flex gap-1">
            {/* Day Labels */}
            <div className="flex flex-col gap-1 mr-2">
              {days.map((day, idx) => (
                <div key={idx} className="text-[10px] text-slate-400 font-bold h-3 flex items-center w-6">
                  {idx % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>

            {/* Weeks Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(day.count)} hover:ring-2 hover:ring-primary-400 transition-all cursor-pointer relative ${day.dateKey === todayDateKey ? 'ring-2 ring-red-500 ring-offset-1 z-10' : ''}`}
                      title={`${day.date.toLocaleDateString()}: ${day.count} event${day.count !== 1 ? 's' : ''} ${day.dateKey === todayDateKey ? '(Today)' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-500 font-bold">
            <span>Less</span>
            {[0, 1, 2, 3].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
