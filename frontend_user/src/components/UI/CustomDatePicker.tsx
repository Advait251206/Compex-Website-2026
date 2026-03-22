
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
  const [inputValue, setInputValue] = useState(""); // Local input state for typing
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal input value with prop value on load/change
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setInputValue(`${d}-${m}-${y}`);
      setCurrentDate(new Date(value));
    } else {
        setInputValue("");
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

    // Format YYYY-MM-DD for internal value and prop
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

  const [errorMsg, setErrorMsg] = useState("");

  // Handle manual input change with masking
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      
      // Split into segments based on user input to preserve field boundaries during editing
      const parts = val.split('-');
      
      // Extract raw digits for each segment
      let day = (parts[0] || '').replace(/\D/g, '');
      let month = (parts[1] || '').replace(/\D/g, '');
      let year = (parts[2] || '').replace(/\D/g, '');
      
      // Handle digit overflow (typing) logic
      // If typing in Day and it hits 3 chars, move 3rd to Month
      if (day.length > 2) {
          month = day.slice(2) + month;
          day = day.slice(0, 2);
      }
      
      // If typing in Month and it hits 3 chars, move 3rd to Year
      if (month.length > 2) {
          year = month.slice(2) + year;
          month = month.slice(0, 2);
      }
      
      // Limit Year to 4 chars
      if (year.length > 4) {
          year = year.slice(0, 4);
      }

      // Reconstruct formatted string
      // Logic: Add dash if the previous segment is full OR if the next segment has content
      let formatted = day;
      if (month.length > 0 || (day.length === 2 && parts.length > 1)) {
          formatted += '-' + month;
      }
      if (year.length > 0 || (month.length === 2 && parts.length > 2)) {
          formatted += '-' + year;
      }
      
      setInputValue(formatted);

      // Validation Logic (runs on the reconstructed parts)
      const d = parseInt(day);
      const m = parseInt(month);
      const y = parseInt(year);

      // Check if complete format DD-MM-YYYY is potentially satisfied or in progress
      // We start validation when we have enough data or when format implies completion
      
      const isComplete = day.length === 2 && month.length === 2 && year.length === 4;

      if (isComplete) {
          // 1. Validate Month
          if (m < 1 || m > 12) {
              setErrorMsg(`Invalid Month (1-12)`);
              onChange({ target: { name, value: "" } });
              return;
          }

          // 2. Validate Day
          const maxDays = new Date(y, m, 0).getDate();
          if (d < 1 || d > maxDays) {
              setErrorMsg(`Invalid Day (1-${maxDays})`);
              onChange({ target: { name, value: "" } });
              return;
          }

          // 3. Check Future
          const dateObj = new Date(y, m - 1, d);
          const now = new Date();
          now.setHours(0,0,0,0);
          
          if (dateObj > now) {
             setErrorMsg("Future dates are not allowed");
             onChange({ target: { name, value: "" } }); 
          } else {
             setErrorMsg("");
             const formattedDate = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
             onChange({ target: { name, value: formattedDate } });
             setCurrentDate(dateObj); // Sync calendar view
          }

      } else {
          // Incomplete input state
           if(formatted === "") setErrorMsg("");
           else if (formatted.length >= 10 && !isComplete) setErrorMsg("Invalid Format"); // Should be covered by logic above but fallback
           else setErrorMsg(""); 
      }
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const today = new Date();
    const calendarDays = [];

    // Empty slots
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
    }

    // Days
    for (let i = 1; i <= days; i++) {
        const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const isSelected = value === dateToCheck.toISOString().split('T')[0];
        const isFuture = dateToCheck > today;

        calendarDays.push(
            <div 
                key={i} 
                onClick={() => !isFuture && handleDateClick(i)}
                style={{
                    padding: '0.5rem',
                    textAlign: 'center',
                    cursor: isFuture ? 'not-allowed' : 'pointer',
                    background: isSelected ? '#4ade80' : 'transparent',
                    color: isSelected ? '#000' : (isFuture ? '#555' : '#fff'),
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 'auto',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s',
                    opacity: isFuture ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                    if(!isFuture && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                    if(!isFuture && !isSelected) e.currentTarget.style.background = 'transparent';
                }}
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
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="custom-date-picker" ref={wrapperRef} style={{ position: 'relative' }}>
      <div className="input-wrapper" style={{ position: 'relative' }}>
        <input 
          type="text" 
          className="form-input" 
          value={inputValue} 
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder || "DD-MM-YYYY"}
          required={required}
          maxLength={10}
          style={{ 
              width: '100%', 
              padding: '8px 30px 8px 10px', 
              fontSize: '0.9rem',
              // Dynamic error styling
              borderColor: errorMsg ? '#ff6b6b' : undefined,
              boxShadow: errorMsg ? '0 0 0 1px #ff6b6b' : undefined
          }} // Add padding for icon
        />
        <span 
            className="calendar-icon" 
            style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                cursor: 'pointer',
                pointerEvents: 'none' // Let clicks pass through to input
            }}
        >
            📅
        </span>
      </div>
      {errorMsg && (
        <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '4px', textAlign: 'left' }}>
            {errorMsg}
        </div>
      )}
      
      {isOpen && (
        <div 
            className="calendar-popup glass-card"
            style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                zIndex: 1000,
                marginBottom: '0.5rem',
                padding: '1rem',
                // Removed explicit background/opacity to let glass-card handle it
                // background: '#1a1a2e', 
                // opacity: 1,
                // border: ...
                // boxShadow: ...
                
                // Keep these layout/safety styles
                width: '300px', 
            }}
        >
            <div className="calendar-header" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select 
                  value={currentDate.getMonth()}
                  onChange={handleMonthChange}
                  style={{ flex: 1, padding: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}
                >
                  {monthNames.map((name, index) => (
                    <option key={name} value={index} style={{color:'black'}}>{name}</option>
                  ))}
                </select>
                <select 
                  value={currentDate.getFullYear()}
                  onChange={handleYearChange}
                  style={{ flex: 1, padding: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}
                >
                  {years.map(year => (
                    <option key={year} value={year} style={{color:'black'}}>{year}</option>
                  ))}
                </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#a5b4fc' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {renderCalendar()}
            </div>
        </div>
      )}
    </div>
  );
}
