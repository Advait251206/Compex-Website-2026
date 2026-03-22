
import { useState, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  name: string;
  placeholder?: string;
  required?: boolean;
}

export default function CustomDatePicker({ value, onChange, name, placeholder, required }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize navigation date based on value or today
  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Check if future date
    if (selectedDate > new Date()) return;

    // Format YYYY-MM-DD for internal value
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${d}`;
    
    onChange({ target: { name, value: formatted } });
    setIsOpen(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1));
  };

  // Helper to format display value
  const getDisplayValue = () => {
    if (!value) return "";
    const [y, m, d] = value.split('-');
    return `${d}-${m}-${y}`; // DD-MM-YYYY
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const today = new Date();
    const calendarDays = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days
    for (let i = 1; i <= days; i++) {
        const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const isSelected = value === dateToCheck.toISOString().split('T')[0];
        const isFuture = dateToCheck > today;

        calendarDays.push(
            <div 
                key={i} 
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isFuture ? 'disabled' : ''}`}
                onClick={() => !isFuture && handleDateClick(i)}
            >
                {i}
            </div>
        );
    }
    return calendarDays;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // Last 100 years

  return (
    <div className="custom-date-picker" ref={wrapperRef}>
      <div className="input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input 
          type="text" 
          className="form-input" 
          value={getDisplayValue()} 
          readOnly 
          placeholder={placeholder || "DD-MM-YYYY"}
          required={required}
          style={{ cursor: 'pointer' }}
        />
        <span className="calendar-icon">📅</span>
      </div>
      
      {isOpen && (
        <div className="calendar-popup glass-card">
            <div className="calendar-header" style={{ gap: '0.5rem' }}>
                <select 
                  className="calendar-select"
                  value={currentDate.getMonth()}
                  onChange={handleMonthChange}
                  onClick={(e) => e.stopPropagation()}
                >
                  {monthNames.map((name, index) => (
                    <option key={name} value={index}>{name}</option>
                  ))}
                </select>
                <select 
                  className="calendar-select"
                  value={currentDate.getFullYear()}
                  onChange={handleYearChange}
                  onClick={(e) => e.stopPropagation()}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
            </div>
            <div className="calendar-grid-header">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid">
                {renderCalendar()}
            </div>
        </div>
      )}
    </div>
  );
}
