import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { adminAPI } from '../../services/api';
import * as XLSX from 'xlsx';
import CustomSelect from '../UI/CustomSelect';

// Define interfaces
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  status: string;
  isCheckedIn: boolean;
  checkInTime?: string;
  referral?: string;
  buyingInterest?: string; // NEW
  buyingInterestDetails?: string; // NEW
}

interface Ticket {
  id: string;
  userId: string;
  holderName: string;
  status: string;
  type: string;
  qrCodeData?: string;
  createdAt: string;
  isCheckedIn?: boolean;
  checkInTime?: string;
  buyingInterest?: string; // NEW
  buyingInterestDetails?: string; // NEW
}

interface Winner {
    id: string;
    holderName: string;
    holderEmail: string;
    holderPhone: string;
    wonPrize: string;
    wonAt: string;
}

interface DashboardStats {
  metrics: {
    totalTickets: number;
    checkedIn: number;
    verified: number;
    pending: number;
    cancelled: number;
  };
  recentCheckIns: any[];
}

export default function DatabaseAccess() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'winners'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfig, setFilterConfig] = useState({
    status: 'All', // All, Verified, Pending, Checked In, Not Checked In
    searchField: 'All', // All, Name, Email, ID
    checkInTime: 'All' // All, 12PM-1PM, 1PM-2PM, etc.
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt', // createdAt, name
    direction: 'desc' // desc, asc
  });
  const [showFilters, setShowFilters] = useState(false);
  // const [isPickingWinner, setIsPickingWinner] = useState(false); // Commented out
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    ticketId: string;
    newStatus: boolean;
    originalId: string; // Used for local state update (could be email or ticketid)
    isTicketIdRef: boolean;
  } | null>(null);

  // Helper to format date with suffix
  const formatDateWithSuffix = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    const getSuffix = (n: number) => {
      if (n > 3 && n < 21) return 'th';
      switch (n % 10) {
        case 1:  return 'st';
        case 2:  return 'nd';
        case 3:  return 'rd';
        default: return 'th';
      }
    };

    return `${day}${getSuffix(day)} ${month} ${year}`;
  };

  const fetchWinners = async () => {
      try {
          const token = await getToken();
          if (!token) return;
          const res = await adminAPI.getWinners(token);
          setWinners(res.data.winners || []);
      } catch (err) {
          console.error("Failed to fetch winners", err);
      }
  };

  // Live Stats Polling
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await adminAPI.getStats(token);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch live stats", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // 5s poll
    return () => clearInterval(interval);
  }, [getToken]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = await getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await adminAPI.getAllTickets(token);
        const allTickets = response.data.tickets || [];

        // Process Tickets
        const formattedTickets: Ticket[] = allTickets.map((t: any) => ({
          id: t._id,
          userId: t.holderEmail, 
          holderName: t.holderName,
          status: t.status,
          type: 'General', 
          qrCodeData: t.qrCodeData,
          createdAt: t.createdAt,
          isCheckedIn: t.isCheckedIn,
          checkInTime: t.checkInTime,
          buyingInterest: t.holderBuyingInterest || '-',
          buyingInterestDetails: t.holderBuyingInterestDetails || '-'
        }));

        setTickets(formattedTickets);

        // Process Users - Dedup by Email, then Phone, then Ticket ID
        const userMap = new Map<string, User>();
        allTickets.forEach((t: any) => {
          // Determine unique key: Email > Phone > ID (to handle phone-only users)
          const uniqueKey = t.holderEmail || t.holderPhone || t._id;
          
          if (!userMap.has(uniqueKey)) {
            userMap.set(uniqueKey, {
              id: t.holderEmail || t.holderPhone || t._id, // Use same logic for ID
              name: t.holderName,
              email: t.holderEmail || '-',
              phone: t.holderPhone,
              gender: t.holderGender,
              dob: t.holderDob ? formatDateWithSuffix(t.holderDob) : '',
              status: t.status,
              isCheckedIn: t.isCheckedIn,
              checkInTime: t.checkInTime ? new Date(t.checkInTime).toLocaleString() : '',
              referral: t.holderReferralSource,
              buyingInterest: t.holderBuyingInterest || '-',
              buyingInterestDetails: t.holderBuyingInterestDetails || '-'
            });
          }
        });

        setUsers(Array.from(userMap.values()));

        // Also fetch winners initially
        await fetchWinners();

      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load database records. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  // Handle Pick Winner - Commented out
  /* const handlePickWinner = async () => {
      if (!confirm("Are you sure you want to pick a NEW random winner from checked-in attendees?")) return;
      
      try {
          setIsPickingWinner(true);
          const token = await getToken();
          if (!token) return;
          
          await adminAPI.pickWinner("Exclusive Prize", token);
          alert("Winner Selected! Notification sent.");
          await fetchWinners(); // Refresh list

      } catch (err: any) {
          console.error(err);
          alert("Failed to pick winner: " + (err.response?.data?.message || err.message));
      } finally {
          setIsPickingWinner(false);
      }
  }; */


  // Filtering & Sorting Logic
  const processData = (data: any[], type: 'users' | 'tickets' | 'winners') => {
    let result = [...data];
    
    // Skip complex filtering for winners tab for now, just basic text search
    if (type === 'winners') {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => 
                (item.holderName?.toLowerCase().includes(q)) || 
                (item.holderEmail?.toLowerCase().includes(q))
            );
        }
        return result; 
    }

    // 1. Filter by Status
    if (filterConfig.status !== 'All') {
      if (filterConfig.status === 'Checked In') {
        result = result.filter(item => item.isCheckedIn);
      } else if (filterConfig.status === 'Not Checked In') {
        result = result.filter(item => !item.isCheckedIn);
      } else {
        result = result.filter(item => item.status?.toLowerCase() === filterConfig.status.toLowerCase());
      }
    }


    // 2. Filter by Check-In Time
    if (filterConfig.checkInTime !== 'All') {
        // Only makes sense if we have checked in items, but we filter all anyway
        result = result.filter(item => {
            if (!item.isCheckedIn || !item.checkInTime) return false;
            
            const checkInDate = new Date(item.checkInTime);
            // Assuming current day/relevant day filtering isn't needed or is implicit? 
            // User asked for "12pm to 1pm", "1pm to 2pm"... implying hour ranges.
            // Let's implement based on HOUR of day.
            
            const hour = checkInDate.getHours(); // 0-23
            
            const [startStr] = filterConfig.checkInTime.split('-');
            
            // Convert "12PM" to 12, "1PM" to 13, etc.
            const parseHour = (str: string) => {
                const isPM = str.toUpperCase().includes('PM');
                const isAM = str.toUpperCase().includes('AM');
                let h = parseInt(str.replace(/PM|AM/gi, ''));
                if (isPM && h !== 12) h += 12;
                if (isAM && h === 12) h = 0; // 12 AM is 0
                return h;
            };

            const startHour = parseHour(startStr);
            // End hour logic: "1PM" -> 13. So 12PM-1PM means >= 12 && < 13
            // Exception: If "7PM-8PM" -> means hour 19 (7PM).
            
            return hour === startHour;
        });
    }

    // 2. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        if (type === 'users') {
          const matchName = (item.name?.toLowerCase() || '').includes(q);
          const matchEmail = (item.email?.toLowerCase() || '').includes(q);
          const matchPhone = (item.phone || '').includes(q);
          
          if (filterConfig.searchField === 'Name') return matchName;
          if (filterConfig.searchField === 'Email') return matchEmail;
          return matchName || matchEmail || matchPhone;
        } else {
          const matchName = (item.holderName?.toLowerCase() || '').includes(q);
          const matchEmail = (item.userId?.toLowerCase() || '').includes(q);
          const matchId = (item.id?.toLowerCase() || '').includes(q);

          if (filterConfig.searchField === 'Name') return matchName;
          if (filterConfig.searchField === 'Email') return matchEmail;
          if (filterConfig.searchField === 'ID') return matchId;
          return matchName || matchEmail || matchId;
        }
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA, valB;

      if (sortConfig.key === 'name') {
        valA = type === 'users' ? a.name : a.holderName;
        valB = type === 'users' ? b.name : b.holderName;
      } else {
        if(type === 'users') {
             valA = a.name; valB = b.name; 
        } else {
             valA = new Date(a.createdAt).getTime();
             valB = new Date(b.createdAt).getTime();
        }
      }

      if (sortConfig.key === 'name') {
         valA = (valA || '').toLowerCase();
         valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const filteredUsers = processData(users, 'users');
  const filteredTickets = processData(tickets, 'tickets');
  const filteredWinners = processData(winners, 'winners');

  const getCurrentData = () => {
      if (activeTab === 'users') return filteredUsers;
      if (activeTab === 'tickets') return filteredTickets;
      return filteredWinners;
  };

  // Download Logic
  const downloadJSON = () => {
    const data = getCurrentData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compex_${activeTab}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const data = getCurrentData();
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compex_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const data = getCurrentData();
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
    
    // Auto-width columns
    const cols = Object.keys(data[0] || {}).map(key => {
        const maxContentLength = data.reduce((w, r: any) => Math.max(w, String(r[key] || '').length), 10);
        const headerLength = key.length;
        return { wch: Math.max(maxContentLength, headerLength) + 2 };
    });
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, `compex_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleCheckInToggle = async (id: string, currentStatus: boolean, isTicketId: boolean = false) => {
    let ticketId = id;
    if (!isTicketId) {
        // Find ticket by user email (id)
        const foundTicket = tickets.find(t => t.userId === id);
        if (!foundTicket) {
             alert("Could not find associated ticket.");
             return;
        }
        ticketId = foundTicket.id;
    }

    const newStatus = !currentStatus;
    
    // Open Modal instead of window.confirm
    setConfirmModal({
        show: true,
        ticketId,
        newStatus,
        originalId: id,
        isTicketIdRef: isTicketId
    });
  };

  const executeCheckIn = async () => {
    if (!confirmModal) return;
    const { ticketId, newStatus, originalId, isTicketIdRef } = confirmModal;

    try {
        const token = await getToken();
        if (!token) return;

        await adminAPI.toggleCheckIn(ticketId, newStatus, token);

        // Update Local State for Tickets
        setTickets(prev => prev.map(t => {
            if (t.id === ticketId) {
                return { 
                    ...t, 
                    isCheckedIn: newStatus, 
                    checkInTime: newStatus ? new Date().toISOString() : undefined 
                };
            }
            return t;
        }));
        
        // Update Local State for Users (Matched by email)
        setUsers(prev => prev.map(u => {
            let match = false;
            if (!isTicketIdRef && u.id === originalId) match = true;
            if (isTicketIdRef) {
                 const ticket = tickets.find(t => t.id === originalId);
                 if (ticket && u.email === ticket.userId) match = true;
            }
            
            if (match) {
                 return { ...u, isCheckedIn: newStatus, checkInTime: newStatus ? new Date().toLocaleString() : undefined };
            }
            return u;
        }));
        
        setConfirmModal(null); // Close Modal

    } catch (err) {
        console.error(err);
        alert("Failed to update status");
        setConfirmModal(null);
    }
  };

  return (
    <div style={{ padding: '2rem', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', margin: 0 }}>Database Access</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button onClick={downloadJSON} style={{ flex: '1 1 auto', padding: '8px 16px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid #a5b4fc', borderRadius: '8px', cursor: 'pointer' }}>
            Download JSON
          </button>
          <button onClick={downloadCSV} style={{ flex: '1 1 auto', padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '8px', cursor: 'pointer' }}>
            Download CSV
          </button>
          <button onClick={downloadExcel} style={{ flex: '1 1 auto', padding: '8px 16px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid #facc15', borderRadius: '8px', cursor: 'pointer' }}>
            Download Excel
          </button>
        </div>
      </div>

      {/* Live Stats Bar */}
      {stats && (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
            background: 'rgba(255,255,255,0.05)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>TOTAL REGISTRATIONS</div>
                <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold' }}>
                    {stats.metrics.totalTickets}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6366f1' }}>
                    {stats.metrics.verified} Verified
                </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>CHECKED IN</div>
                <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', color: '#4ade80' }}>
                    {stats.metrics.checkedIn}
                </div>
                 <div style={{ fontSize: '0.8rem', color: '#4ade80' }}>
                    Live Count
                </div>
            </div>

             <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>PENDING</div>
                <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', color: '#facc15' }}>
                    {stats.metrics.pending}
                </div>
                 <div style={{ fontSize: '0.8rem', color: '#facc15' }}>
                    Incomplete
                </div>
            </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap', 
        gap: '1rem',
        background: 'rgba(255,255,255,0.05)',
        padding: '1rem',
        borderRadius: '12px'
      }}>
        {/* Left Side: Tabs */}
        <div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            {['users', 'tickets', 'winners'].map(tab => (
                 <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 style={{
                   padding: '8px 16px',
                   background: activeTab === tab ? '#a5b4fc' : 'transparent',
                   color: activeTab === tab ? '#1e1b4b' : '#aaa',
                   border: 'none',
                   borderRadius: '6px',
                   cursor: 'pointer',
                   fontWeight: 'bold',
                   textTransform: 'capitalize',
                   transition: 'all 0.2s'
                 }}
               >
                 {tab}
               </button>
            ))}
          </div>
        </div>
        
        {/* Right Side Logic */}
        <div style={{ display: 'flex', gap: '8px' }}>
            {/* Pick Winner Button (Only for Winners Tab)
            {activeTab === 'winners' && (
                <button
                    onClick={handlePickWinner}
                    disabled={isPickingWinner}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isPickingWinner ? 'wait' : 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                    }}
                >
                    {isPickingWinner ? 'Picking...' : '🎲 Pick Random Winner'}
                </button>
            )} */}

            {/* Filter Toggle */}
            <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: showFilters ? 'rgba(165, 180, 252, 0.2)' : 'rgba(255,255,255,0.1)',
                color: showFilters ? '#a5b4fc' : 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filters
            </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap', 
          background: 'rgba(0,0,0,0.4)', 
          padding: '1rem', 
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {activeTab !== 'winners' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <CustomSelect
                    label="Status"
                    value={filterConfig.status}
                    onChange={(val) => setFilterConfig({ ...filterConfig, status: val })}
                    options={[
                        { value: 'All', label: 'All Status' },
                        { value: 'Verified', label: 'Verified' },
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Checked In', label: 'Checked In' },
                        { value: 'Not Checked In', label: 'Not Checked In' }
                    ]}
                    minWidth="160px"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <CustomSelect
                    label="Sort By"
                    value={`${sortConfig.key}-${sortConfig.direction}`}
                    onChange={(val) => {
                        const [key, direction] = val.split('-');
                        setSortConfig({ key, direction });
                    }}
                    options={[
                        { value: 'createdAt-desc', label: 'Newest First' },
                        { value: 'createdAt-asc', label: 'Oldest First' },
                        { value: 'name-asc', label: 'Name (A-Z)' },
                        { value: 'name-desc', label: 'Name (Z-A)' }
                    ]}
                    minWidth="160px"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <CustomSelect
                    label="Check-In Time"
                    value={filterConfig.checkInTime}
                    onChange={(val) => setFilterConfig({ ...filterConfig, checkInTime: val })}
                    options={[
                        { value: 'All', label: 'All Times' },
                        { value: '12PM-1PM', label: '12 PM - 1 PM' },
                        { value: '1PM-2PM', label: '1 PM - 2 PM' },
                        { value: '2PM-3PM', label: '2 PM - 3 PM' },
                        { value: '3PM-4PM', label: '3 PM - 4 PM' },
                        { value: '4PM-5PM', label: '4 PM - 5 PM' },
                        { value: '5PM-6PM', label: '5 PM - 6 PM' },
                        { value: '6PM-7PM', label: '6 PM - 7 PM' },
                        { value: '7PM-8PM', label: '7 PM - 8 PM' },
                         { value: '8PM-9PM', label: '8 PM - 9 PM' }
                    ]}
                    minWidth="140px"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <CustomSelect
                    label="Search Field"
                    value={filterConfig.searchField}
                    onChange={(val) => setFilterConfig({ ...filterConfig, searchField: val })}
                    options={[
                        { value: 'All', label: 'All Fields' },
                        { value: 'Name', label: 'Name' },
                        { value: 'Email', label: 'Email' },
                        ...(activeTab === 'tickets' ? [{ value: 'ID', label: 'Ticket ID' }] : [])
                    ]}
                    minWidth="140px"
                    />
                </div>
            </>
          )}

           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: '#aaa' }}>Search Query</label>
            <input 
              type="text" 
              placeholder={activeTab === 'winners' ? "Search winners..." : "Search..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
        </div>
      )}


      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading records...</div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.2)', position: 'sticky', top: 0 }}>
                    <tr>
                        {activeTab === 'users' ? (
                            <>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Phone</th>
                                <th style={{ padding: '1rem' }}>Buying Interest</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Checked In</th>
                            </>
                        ) : activeTab === 'tickets' ? (
                             <>
                                <th style={{ padding: '1rem' }}>Holder</th>
                                <th style={{ padding: '1rem' }}>Interest</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Created At</th>
                                <th style={{ padding: '1rem' }}>Checked In At</th>
                            </>
                        ) : (
                             <>
                                <th style={{ padding: '1rem' }}>Winner Name</th>
                                <th style={{ padding: '1rem' }}>Contact</th>
                                <th style={{ padding: '1rem' }}>Prize</th>
                                <th style={{ padding: '1rem' }}>Won At</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {activeTab === 'users' && filteredUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <td style={{ padding: '1rem' }}>{user.name}</td>
                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>{user.phone || '-'}</td>
                                <td style={{ padding: '1rem', fontSize:'0.9rem' }}>
                                    <div style={{ fontWeight:'bold' }}>{user.buyingInterest}</div>
                                    <div style={{ fontSize:'0.8rem', opacity:0.7 }}>{user.buyingInterestDetails}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px',
                                    background: user.status === 'VERIFIED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                    color: user.status === 'VERIFIED' ? '#4ade80' : '#facc15'
                                  }}>
                                    {user.status}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={user.isCheckedIn || false} 
                                            onChange={() => handleCheckInToggle(user.id, user.isCheckedIn, false)}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#4ade80' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: user.isCheckedIn ? '#4ade80' : '#aaa' }}>
                                            {user.isCheckedIn ? 'Running' : 'No'}
                                        </span>
                                    </label>
                                </td>
                            </tr>
                        ))
                    }
                    {activeTab === 'tickets' && filteredTickets.map(ticket => (
                            <tr key={ticket.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div>{ticket.holderName}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{ticket.userId}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>{ticket.buyingInterest || '-'}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px',
                                        background: ticket.status === 'confirmed' || ticket.status === 'verified' || ticket.status === 'VERIFIED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                        color: ticket.status === 'confirmed' || ticket.status === 'verified' || ticket.status === 'VERIFIED' ? '#4ade80' : '#facc15'
                                    }}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                    {new Date(ticket.createdAt).toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={ticket.isCheckedIn || false} 
                                            onChange={() => handleCheckInToggle(ticket.id, ticket.isCheckedIn || false, true)}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#4ade80' }}
                                        />
                                        <span style={{ color: ticket.checkInTime ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                                            {ticket.isCheckedIn && ticket.checkInTime 
                                            ? new Date(ticket.checkInTime).toLocaleString() 
                                            : 'Not Checked In'}
                                        </span>
                                     </div>
                                </td>
                            </tr>
                        ))
                    }
                    {activeTab === 'winners' && filteredWinners.map(winner => (
                            <tr key={winner.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#facc15' }}>{winner.holderName}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div>{winner.holderEmail}</div>
                                    <div style={{ fontSize: '0.8rem', opacity:0.7 }}>{winner.holderPhone}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>{winner.wonPrize}</td>
                                <td style={{ padding: '1rem' }}>{new Date(winner.wonAt).toLocaleString()}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            {(activeTab === 'users' && filteredUsers.length === 0) || (activeTab === 'tickets' && filteredTickets.length === 0) || (activeTab === 'winners' && filteredWinners.length === 0) ? (
                 <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>No records found</div>
            ) : null}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'rgba(23, 23, 23, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontFamily: 'Orbitron, sans-serif' }}>
                    {confirmModal.newStatus ? 'Confirm Check-In' : 'Remove Check-In'}
                </h3>
                <p style={{ color: '#ccc', marginBottom: '2rem' }}>
                    {confirmModal.newStatus 
                        ? 'Are you sure you want to mark this user as Checked In? This will record the current timestamp.'
                        : 'Are you sure you want to remove the check-in status? The timestamp will be cleared.'
                    }
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button 
                        onClick={() => setConfirmModal(null)}
                        style={{
                            padding: '10px 20px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeCheckIn}
                        style={{
                            padding: '10px 20px',
                            background: confirmModal.newStatus ? '#4ade80' : '#f43f5e',
                            border: 'none',
                            color: '#000',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        {confirmModal.newStatus ? 'Yes, Check In' : 'Yes, Remove'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
