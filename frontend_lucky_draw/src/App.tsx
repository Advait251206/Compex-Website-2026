import { useState } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import Background from './components/Background';
import './App.css';

interface Winner {
  firstName: string;
  lastName?: string;
  email: string;
  _id?: string;
}

function App() {
  const [winner, setWinner] = useState<Winner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("SYSTEM READY");
  const [file, setFile] = useState<File | null>(null);

  // 📜 NAMES FOR THE 12-SECOND ANIMATION
  const scanningNames = [
    "Aarav Patel", "Aditi Sharma", "Rohan Gupta", "Sneha Verma", "Vikram Singh",
    "Priya Das", "Amit Kumar", "Neha Malhotra", "Rahul Mehta", "Kavita Reddy",
    "Arjun Nair", "Pooja Joshi", "Siddharth Rao", "Anjali Mishra", "Karan Kapoor",
    "Divya Iyer", "Manish Pandey", "Riya Jain", "Varun Chopra", "Meera Saxena",
    "Suresh Krishnan", "Nisha Bhatia", "Rajeev Menon", "Tanvi Agarwal", "Aryan Deshmukh",
    "Ishita Kulkarni", "Kabir Bedi", "Sanya Mir", "Dev Patel", "Zara Khan",
    "Vihaan Malhotra", "Myra Singh", "Reyansh Dutta", "Saira Banu", "Ayaan Khan",
    "Ishaan Awasthi", "Ananya Birla", "Dhruv Rathee", "Kritika Khurana", "Bhuvan Bam",
    "Ajey Nagar", "Tanmay Bhat", "Kusha Kapila", "Dolly Singh", "Ranveer Allahbadia",
    "Prajakta Koli", "Harsh Beniwal", "Ashish Chanchlani", "Carry Minati", "Mortal"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
        setDisplayName("FILE LOADED");
    }
  };

  const handleSpin = async () => {
    if (loading) return;
    if (!file) {
        setError("ACCESS DENIED: PLEASE UPLOAD A FILE.");
        return;
    }

    setLoading(true); // 🟢 This triggers STATE 2 (Hides Card, Shows Names)
    setWinner(null);
    setError(null);

    // ⚡ START RAPID NAME CYCLING
    let shuffleInterval = setInterval(() => {
        const randomName = scanningNames[Math.floor(Math.random() * scanningNames.length)];
        setDisplayName(randomName.toUpperCase());
    }, 50);

    // Environment Variable for API
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/api/admin/upload-draw`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 🟢 HANDLE "NO CANDIDATES" (Soft Error) - Check IMMEDIATELY
      if (response.data && response.data.success === false) {
          clearInterval(shuffleInterval);
          setError(response.data.message);
          setDisplayName("SYSTEM ALERT");
          setLoading(false);
          return;
      }

      // ⏳ WAIT 10 SECONDS (Only if we have a winner)
      await new Promise(r => setTimeout(r, 10000));

      clearInterval(shuffleInterval);
      
      const luckyUser = response.data;
      setWinner(luckyUser); // 🏆 This triggers STATE 3 (Winner Reveal)
      
      fireConfetti();
      
    } catch (error: any) {
      clearInterval(shuffleInterval);
      setDisplayName("SYSTEM FAILURE");
      console.error(error);
      setError(error.response?.data?.message || "Operation Failed");
    } finally {
      setLoading(false);
    }
  };

  const resetDraw = () => {
    setWinner(null);
    setError(null);
    setDisplayName("SYSTEM READY");
  };

  const resetError = () => {
      setError(null);
      setDisplayName("SYSTEM READY");
  };

  const fireConfetti = () => {
    const duration = 5000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00f3ff', '#facc15', '#ffffff'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00f3ff', '#facc15', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setFile(null);
    setDisplayName("SYSTEM READY");
    // Clear input so same file can be selected again
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  };

  // --- RENDER LOGIC ---
  return (
    <>
      <Background />
      
      <div className="container">
        
        {/* 1. IF LOADING: SHOW SCANNING ANIMATION (No Card) */}
        {loading ? (
            <div className="scanning-container">
                <div className="scan-label">SEARCHING DATABASE...</div>
                <div className="scanning-text">{displayName}</div>
            </div>
        ) 
        
        /* 2. IF ERROR: SHOW ERROR CARD */
        : error ? (
            <div className="card error-card">
                <h1 className="title" style={{ color: '#ff3333', borderColor: '#ff3333' }}>SYSTEM ALERT</h1>
                <div className="error-message">
                    {error}
                </div>
                <button className="reset-btn" onClick={resetError} style={{ marginTop: '30px', borderColor: '#ff3333', color: '#ff3333' }}>
                  ACKNOWLEDGE
                </button>
            </div>
        )

        /* 3. IF WINNER: SHOW REVEAL SCREEN */
        : winner ? (
            <div className="winner-reveal-container">
                <div className="congrats-label">WINNER IDENTIFIED</div>
                <div className="mega-name">
                  {winner.firstName} {winner.lastName || ""}
                </div>
                <button className="reset-btn" onClick={resetDraw}>
                  RESET SYSTEM
                </button>
            </div>
        ) 
        
        /* 4. DEFAULT: SHOW LUCKY DRAW CARD */
        : (
            <div className="card">
              <h1 className="title">LUCKY DRAW</h1>
              
              <div className="file-upload-box" style={{ marginTop: '20px' }}>
                  <p>ACCEPTED FORMATS: .XLSX / .CSV / .JSON</p>
                  
                  <input 
                    type="file" 
                    id="fileInput"
                    accept=".xlsx, .xls, .csv, .json" 
                    onChange={handleFileChange} 
                    className="hidden-input"
                  />
                  
                  {file ? (
                    <div className="file-selected-badge">
                       <span>📄 {file.name}</span>
                       <button onClick={removeFile} className="remove-file-btn" title="Remove File">✕</button>
                    </div>
                  ) : (
                    <label htmlFor="fileInput" className="custom-file-label">
                      📂 CLICK TO UPLOAD FILE
                    </label>
                  )}
              </div>
              
              <br />
              
              <button className="spin-btn" onClick={handleSpin}>
                  INITIALIZE SPIN
              </button>
            </div>
        )}

      </div>
    </>
  );
}

export default App;