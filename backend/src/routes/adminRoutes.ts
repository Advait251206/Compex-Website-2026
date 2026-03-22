import express from 'express';
import { validateTicket, checkInTicket, getAllTickets, getDashboardStats, toggleCheckIn, pickWinner, getWinners } from '../controllers/adminController';
import { uploadDraw, uploadMiddleware } from '../controllers/luckyDrawController';
import { clerkAuth } from '../middleware/clerkAuth';

const router = express.Router();

// Lucky Draw Routes (Public/Internal use for Big Screen) - Placed BEFORE Auth
router.post('/upload-draw', uploadMiddleware, uploadDraw);

// All other admin routes are protected by Clerk authentication
router.use(clerkAuth);

// Admin scanner endpoints
router.post('/validate-ticket', validateTicket);
router.post('/checkin', checkInTicket);
router.patch('/toggle-checkin/:id', toggleCheckIn); // NEW ROUTE
router.get('/tickets', getAllTickets);
router.get('/stats', getDashboardStats);
router.post('/pick-winner', pickWinner); // NEW
router.get('/winners', getWinners);      // NEW

export default router;
