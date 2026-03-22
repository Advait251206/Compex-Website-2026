import express from 'express';
import { getMe } from '../controllers/ticketController';
import { clerkAuth } from '../middleware/clerkAuth';

const router = express.Router();

// Protected Routes (Admin Only per current clerkAuth implementation)
router.use(clerkAuth);

router.get('/me', getMe);

export default router;
