import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import ticketRoutes from './routes/ticketRoutes';

dotenv.config();

const app: Application = express();

// Trust the first proxy (Render load balancer)
// This is required for rate limiting to work correctly behind a proxy
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
// Connect to MongoDB
connectDB().then(() => {
  // Run cleanup immediately after DB connection
  cleanupStaleTickets();
});

// Cleanup Logic for Stale Pending Tickets (Older than 5 mins)
const cleanupStaleTickets = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Delete tickets that are PENDING and haven't been updated in 5 minutes
    // This removes abandoned registration attempts
    const result = await import('./models/Ticket').then(m => m.default.deleteMany({
      status: 'pending', // Hardcoded safely or use enum if imported
      updatedAt: { $lt: fiveMinutesAgo }
    }));

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleanup: Removed ${result.deletedCount} stale pending tickets.`);
    }
  } catch (error) {
    console.error('Cleanup Check Error:', error);
  }
  };

// 🚑 OFFENSIVE FIX: Remove 'null' emails AND real duplicates causing E11000 errors
const fixDatabaseAndSync = async () => {
    try {
        const Ticket = (await import('./models/Ticket')).default;

        // 1. Unset null/empty fields
        await Ticket.updateMany(
            { $or: [{ holderEmail: null }, { holderEmail: "" }] },
            { $unset: { holderEmail: 1 } }
        );
        await Ticket.updateMany(
            { $or: [{ holderPhone: null }, { holderPhone: "" }] },
            { $unset: { holderPhone: 1 } }
        );
        console.log("🧹 Cleaned null/empty fields.");

        // 2. Remove Real Duplicates (Phone) - Aggregation to find collisions
        const phoneDups = await Ticket.aggregate([
            { $match: { holderPhone: { $exists: true, $ne: null } } },
            { $group: { _id: "$holderPhone", ids: { $push: "$_id" }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        for (const group of phoneDups) {
            // Keep the last created/updated one (or any logic) - usually the newest is best or verified one
            // We just pop one and delete the rest
            const [keep, ...remove] = group.ids.reverse(); // Assuming chronological push, but better to just keep one
            if (remove.length > 0) {
                 await Ticket.deleteMany({ _id: { $in: remove } });
                 console.log(`🚑 Removed ${remove.length} duplicate tickets for phone: ${group._id}`);
            }
        }

        // 3. Remove Real Duplicates (Email)
        const emailDups = await Ticket.aggregate([
            { $match: { holderEmail: { $exists: true, $ne: null } } },
            { $group: { _id: "$holderEmail", ids: { $push: "$_id" }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        for (const group of emailDups) {
            const [keep, ...remove] = group.ids.reverse(); 
            if (remove.length > 0) {
                 await Ticket.deleteMany({ _id: { $in: remove } });
                 console.log(`🚑 Removed ${remove.length} duplicate tickets for email: ${group._id}`);
            }
        }

        // 🔄 FORCE INDEX SYNC
        await Ticket.syncIndexes();
        console.log("✅ DB Indexes Synced (Sparse constraint applied)");

    } catch (err) {
        console.error("DB Repair Failed:", err);
    }
};

// Run repairs on start
fixDatabaseAndSync();

// Schedule cleanup every 60 seconds
setInterval(cleanupStaleTickets, 60 * 1000);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
const getAllowedOrigins = () => {
  const origins = [
    process.env.FRONTEND_USER_URL || 'http://localhost:5173',
    process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174',
    process.env.FRONTEND_LUCKY_DRAW_URL || 'http://localhost:5173'
  ];
  // Remove trailing slashes to ensure exact match with browser origin
  return origins.map(origin => origin.replace(/\/$/, ""));
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // check SMS status
  import('./services/smsService').then(service => {
     service.default.checkConnection();
  });
});

export default app;
