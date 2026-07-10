'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export default function DateTimePicker({ value, onChange, required = false }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value (expected format: YYYY-MM-DDTHH:MM)
  const getInitialDate = () => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const initialDate = getInitialDate();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  // Time states
  const getInitialTime = () => {
    if (!value) return { hour: '10', minute: '00', period: 'AM' };
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return { hour: '10', minute: '00', period: 'AM' };
    
    let hr = parsed.getHours();
    const min = String(Math.round(parsed.getMinutes() / 5) * 5).padStart(2, '0');
    const per = hr >= 12 ? 'PM' : 'AM';
    
    if (hr === 0) hr = 12;
    else if (hr > 12) hr = hr - 12;
    
    return {
      hour: String(hr),
      minute: min === '60' ? '00' : min,
      period: per
    };
  };

  const initTime = getInitialTime();
  const [time, setTime] = useState(initTime);

  const checkIsPast = (dateObj: Date, hrStr: string, minStr: string, periodStr: string) => {
    const yr = dateObj.getFullYear();
    const mn = dateObj.getMonth();
    const dy = dateObj.getDate();
    
    let hr = parseInt(hrStr, 10);
    if (periodStr === 'PM' && hr < 12) hr += 12;
    if (periodStr === 'AM' && hr === 12) hr = 0;
    const min = parseInt(minStr, 10);
    
    const target = new Date(yr, mn, dy, hr, min, 0, 0);
    return target < new Date();
  };

  const resetToCurrentFutureTime = () => {
    const now = new Date();
    const min = now.getMinutes();
    const roundedMin = Math.ceil(min / 5) * 5;
    const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), roundedMin, 0, 0);
    
    setSelectedDate(futureDate);
    setCurrentMonth(new Date(futureDate.getFullYear(), futureDate.getMonth(), 1));
    
    let hr = futureDate.getHours();
    const minStr = String(futureDate.getMinutes() === 60 ? 0 : futureDate.getMinutes()).padStart(2, '0');
    const per = hr >= 12 ? 'PM' : 'AM';
    if (hr === 0) hr = 12;
    else if (hr > 12) hr = hr - 12;
    
    const newTime = {
      hour: String(hr),
      minute: minStr,
      period: per
    };
    setTime(newTime);
    
    const yr = futureDate.getFullYear();
    let finalHr = hr;
    if (per === 'PM' && finalHr < 12) finalHr += 12;
    if (per === 'AM' && finalHr === 12) finalHr = 0;
    
    const localDate = new Date(yr, futureDate.getMonth(), futureDate.getDate(), finalHr, parseInt(minStr, 10));
    if (!isNaN(localDate.getTime())) {
      onChange(localDate.toISOString());
    }
  };

  // Sync state if value changes externally
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        // Sync time states
        let hr = parsed.getHours();
        const min = String(Math.round(parsed.getMinutes() / 5) * 5).padStart(2, '0');
        const per = hr >= 12 ? 'PM' : 'AM';
        if (hr === 0) hr = 12;
        else if (hr > 12) hr = hr - 12;
        
        setTime({
          hour: String(hr),
          minute: min === '60' ? '00' : min,
          period: per
        });
      }
    } else {
      const now = new Date();
      const min = now.getMinutes();
      const roundedMin = Math.ceil(min / 5) * 5;
      const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), roundedMin, 0, 0);
      
      setSelectedDate(futureDate);
      setCurrentMonth(new Date(futureDate.getFullYear(), futureDate.getMonth(), 1));
      
      let hr = futureDate.getHours();
      const minStr = String(futureDate.getMinutes() === 60 ? 0 : futureDate.getMinutes()).padStart(2, '0');
      const per = hr >= 12 ? 'PM' : 'AM';
      if (hr === 0) hr = 12;
      else if (hr > 12) hr = hr - 12;
      
      setTime({
        hour: String(hr),
        minute: minStr,
        period: per
      });
    }
  }, [value]);

  // Ref caching to avoid churn in useEffect dependency array
  const selectedDateRef = useRef(selectedDate);
  const timeRef = useRef(time);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
    timeRef.current = time;
  }, [selectedDate, time]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPastSelection = checkIsPast(selectedDate, time.hour, time.minute, time.period);

  // Format date-time for display
  const getDisplayText = () => {
    if (!value) return 'Select Date & Time';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return 'Select Date & Time';
    return parsed.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calendar Math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday is 0
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Add padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevDaysInMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevDaysInMonth - i)
    });
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Add padding days from next month to make it 42 cells (6 rows)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const handleSelectDay = (cellDate: Date) => {
    setSelectedDate(cellDate);
    updateValue(cellDate, time.hour, time.minute, time.period);
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'period', val: string) => {
    const newTime = { ...time, [type]: val };
    setTime(newTime);
    updateValue(selectedDate, newTime.hour, newTime.minute, newTime.period);
  };

  const updateValue = (dateObj: Date, hrStr: string, minStr: string, periodStr: string) => {
    const yr = dateObj.getFullYear();
    const monthIdx = dateObj.getMonth();
    const dy = dateObj.getDate();
    
    let hr = parseInt(hrStr, 10);
    if (periodStr === 'PM' && hr < 12) hr += 12;
    if (periodStr === 'AM' && hr === 12) hr = 0;
    
    const min = parseInt(minStr, 10);
    const localDate = new Date(yr, monthIdx, dy, hr, min);
    if (!isNaN(localDate.getTime())) {
      onChange(localDate.toISOString());
    }
  };

  const isPastDate = (cellDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return cellDate < today;
  };

  const isToday = (cellDate: Date) => {
    const today = new Date();
    return cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (cellDate: Date) => {
    return cellDate.getDate() === selectedDate.getDate() &&
      cellDate.getMonth() === selectedDate.getMonth() &&
      cellDate.getFullYear() === selectedDate.getFullYear();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div ref={containerRef} className="custom-datetime-container" style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="custom-datetime-trigger"
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          background: 'var(--db-sf, #ffffff)',
          border: isOpen ? '1px solid var(--db-gold)' : '1px solid var(--db-bd, rgba(0,0,0,0.08))',
          borderRadius: '8px',
          color: value ? 'var(--db-tx, #000000)' : 'var(--db-tx3, #64748b)',
          fontSize: '0.8125rem',
          fontFamily: 'inherit',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 2px rgba(225, 6, 19, 0.1)' : 'none',
          transition: 'all 0.2s',
          outline: 'none'
        }}
      >
        <span>{getDisplayText()}</span>
        <Calendar size={15} style={{ color: 'var(--db-tx3)' }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="custom-datetime-popover"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 1100,
              width: '300px',
              background: 'var(--db-sf, #ffffff)',
              border: '1px solid var(--db-bd, rgba(0,0,0,0.08))',
              borderRadius: '14px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
              padding: '14px',
              boxSizing: 'border-box'
            }}
          >
            {/* Calendar Month Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--db-tx2)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                className="datetime-nav-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--db-tx)' }}>
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--db-tx2)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                className="datetime-nav-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '6px' }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <span key={d} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--db-tx3)' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '12px' }}>
              {calendarCells.map((cell, idx) => {
                const isSel = isSelected(cell.date);
                const isTd = isToday(cell.date);
                const isPast = isPastDate(cell.date);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPast}
                    onClick={() => !isPast && handleSelectDay(cell.date)}
                    style={{
                      background: isSel ? '#E10613' : 'none',
                      border: 'none',
                      borderRadius: '50%',
                      height: '32px',
                      width: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: isSel || isTd ? '700' : '550',
                      color: isSel
                        ? '#ffffff'
                        : isPast
                        ? 'var(--db-bd, rgba(0,0,0,0.08))'
                        : cell.isCurrentMonth
                        ? 'var(--db-tx)'
                        : 'var(--db-tx3)',
                      boxShadow: isTd && !isSel ? 'inset 0 0 0 1.5px var(--db-gold)' : 'none',
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      opacity: isPast ? 0.35 : 1,
                      transition: 'all 0.15s',
                      outline: 'none'
                    }}
                    className={`datetime-cell ${isSel ? 'active' : ''}`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Time Picker Selector Row */}
            <div
              style={{
                borderTop: '1px solid var(--db-bd, rgba(0,0,0,0.08))',
                paddingTop: '12px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} style={{ color: 'var(--db-tx3)' }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--db-tx3)', textTransform: 'uppercase' }}>
                  Time
                </span>
              </div>

              <div style={{ display: 'flex', gap: '3px' }}>
                {/* Hours Select */}
                <select
                  value={time.hour}
                  onChange={(e) => handleTimeChange('hour', e.target.value)}
                  style={{
                    background: 'var(--db-sf2, #f8fafc)',
                    border: '1px solid var(--db-bd, rgba(0,0,0,0.08))',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '0.75rem',
                    color: 'var(--db-tx)',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                    <option key={h} value={h}>
                      {h.padStart(2, '0')}
                    </option>
                  ))}
                </select>

                <span style={{ color: 'var(--db-tx3)', fontSize: '0.75rem', alignSelf: 'center', fontWeight: 'bold' }}>:</span>

                {/* Minutes Select */}
                <select
                  value={time.minute}
                  onChange={(e) => handleTimeChange('minute', e.target.value)}
                  style={{
                    background: 'var(--db-sf2, #f8fafc)',
                    border: '1px solid var(--db-bd, rgba(0,0,0,0.08))',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '0.75rem',
                    color: 'var(--db-tx)',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* AM / PM Select */}
                <select
                  value={time.period}
                  onChange={(e) => handleTimeChange('period', e.target.value)}
                  style={{
                    background: 'var(--db-sf2, #f8fafc)',
                    border: '1px solid var(--db-bd, rgba(0,0,0,0.08))',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '0.75rem',
                    color: 'var(--db-tx)',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Confirm & Close Button */}
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                {isPastSelection && (
                  <span style={{ color: '#E10613', fontSize: '0.6875rem', fontWeight: 700 }}>
                    Please select a future time
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!required && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setIsOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid var(--db-bd, rgba(0,0,0,0.08))',
                      color: 'var(--db-tx2, #555)',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPastSelection}
                  onClick={() => !isPastSelection && setIsOpen(false)}
                  style={{
                    background: isPastSelection ? 'var(--db-bd, rgba(0,0,0,0.08))' : '#E10613',
                    color: isPastSelection ? 'var(--db-tx3, #64748b)' : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: isPastSelection ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    fontFamily: 'inherit'
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .datetime-cell:hover {
          background: rgba(225, 6, 19, 0.08) !important;
          color: #E10613 !important;
        }
        .datetime-cell.active:hover {
          background: #E10613 !important;
          color: #ffffff !important;
        }
        .datetime-nav-btn:hover {
          background: var(--db-sf2, #f8fafc) !important;
        }
      `}</style>
    </div>
  );
}
