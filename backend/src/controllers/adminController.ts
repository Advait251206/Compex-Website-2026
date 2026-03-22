import { Request, Response } from 'express';
import Ticket from '../models/Ticket';
import { TicketStatus } from '../utils/constants';

// Validate scanned QR code
export const validateTicket = async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    // Find ticket by QR data
    const ticket = await Ticket.findOne({ qrCodeData: qrData });

    if (!ticket) {
      return res.status(404).json({ message: 'Invalid ticket' });
    }

    // Check if ticket is verified
    if (ticket.status !== TicketStatus.VERIFIED) {
      return res.status(400).json({ 
        message: 'Ticket is not verified or has been cancelled',
        status: ticket.status
      });
    }

    // Check if already checked in
    if (ticket.isCheckedIn) {
      return res.status(409).json({ 
        message: 'Ticket already checked in',
        data: {
          holderName: ticket.holderName,
          checkedInAt: ticket.checkInTime
        }
      });
    }

    // Return ticket details
    res.status(200).json({
      message: 'Valid ticket',
      data: {
        _id: ticket._id,
        ticketId: ticket._id,
        holderName: ticket.holderName,
        holderEmail: ticket.holderEmail,
        holderPhone: ticket.holderPhone,
        holderGender: ticket.holderGender,
        holderDob: ticket.holderDob,
        isCheckedIn: ticket.isCheckedIn
      }
    });
  } catch (error: any) {
    console.error('Validate ticket error:', error);
    res.status(500).json({ message: 'Validation failed' });
  }
};

// Check-in ticket
export const checkInTicket = async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ qrCodeData: qrData });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify status
    if (ticket.status !== TicketStatus.VERIFIED) {
      return res.status(400).json({ message: 'Ticket cannot be checked in' });
    }

    // Check if already checked in
    if (ticket.isCheckedIn) {
      return res.status(409).json({ 
        message: 'Ticket already checked in',
        data: {
          holderName: ticket.holderName,
          checkedInAt: ticket.checkInTime
        }
      });
    }

    // Mark as checked in
    ticket.isCheckedIn = true;
    ticket.checkInTime = new Date();
    await ticket.save();

    res.status(200).json({
      message: 'Check-in successful',
      data: {
        _id: ticket._id,
        holderName: ticket.holderName,
        checkedInAt: ticket.checkInTime
      }
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Check-in failed' });
  }
};

// Get all tickets (optional admin view)
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await Ticket.find()
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: tickets.length,
      tickets
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const checkedIn = await Ticket.countDocuments({ isCheckedIn: true });
    const verified = await Ticket.countDocuments({ status: TicketStatus.VERIFIED });
    const pending = await Ticket.countDocuments({ status: TicketStatus.PENDING });
    const cancelled = await Ticket.countDocuments({ status: TicketStatus.CANCELLED });

    // Get recent check-ins
    const recentCheckIns = await Ticket.find({ isCheckedIn: true })
      .sort({ checkInTime: -1 })
      .limit(5)
      .select('holderName checkInTime holderEmail');

    res.status(200).json({
      metrics: {
        totalTickets,
        checkedIn,
        verified,
        pending,
        cancelled
      },
      recentCheckIns
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Manual Check-in Toggle (Admin Database)
export const toggleCheckIn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // true (check-in) or false (remove check-in)

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (status) {
      // Check In
      ticket.isCheckedIn = true;
      ticket.checkInTime = new Date(); // Update time to NOW
    } else {
      // Remove Check In
      ticket.isCheckedIn = false;
      ticket.checkInTime = undefined; // Clear time
    }

    await ticket.save();

    res.status(200).json({
      message: 'Check-in status updated',
      data: {
        _id: ticket._id,
        isCheckedIn: ticket.isCheckedIn,
        checkInTime: ticket.checkInTime
      }
    });
  } catch (error) {
    console.error("Toggle Check-in Error:", error);
    res.status(500).json({ message: "Failed to update check-in status" });
  }
};


// Pick a Lucky Draw Winner
export const pickWinner = async (req: Request, res: Response) => {
  try {
    const { prize } = req.body;
    
    // Find candidate: Verified, Not already a winner
    // We enforce 'isCheckedIn: true' as users usually need to be present
    
    // 1. Get eligible IDs
    const candidates = await Ticket.find({ 
        status: TicketStatus.VERIFIED, 
        isCheckedIn: true, 
        isWinner: { $ne: true } 
    }).select('_id');

    const count = candidates.length;

    if (count === 0) {
        return res.status(404).json({ message: "No eligible candidates found (Must be Checked In & Not already won)." });
    }

    // 2. Random Selection
    const randomIndex = Math.floor(Math.random() * count);
    const winnerId = candidates[randomIndex]._id;
    
    const winner = await Ticket.findById(winnerId);

    if (!winner) {
         return res.status(404).json({ message: "Error selecting winner." });
    }

    winner.isWinner = true;
    winner.wonPrize = prize || 'Hourly Prize';
    winner.wonAt = new Date();
    await winner.save();

    // Send Notifications (Async) - DISABLED REQUEST
    // try {
    //     const { sendWinnerNotification } = await import('../services/smsService').then(m => m.default);
    //     if (winner.holderPhone) {
    //         // sendWinnerNotification(winner.holderPhone, winner.holderName, winner.wonPrize).catch(console.error);
    //     }
    //     
    //     const { sendWinnerEmail } = await import('../services/emailService');
    //     if (winner.holderEmail) {
    //          // sendWinnerEmail(winner.holderEmail, winner.holderName, winner.wonPrize).catch(console.error);
    //     }
    // } catch (err) {
    //     console.error("Winner Notification Init Failed:", err);
    // }

    res.status(200).json({
        message: "Winner selected!",
        winner: {
            id: winner._id,
            name: winner.holderName,
            email: winner.holderEmail,
            phone: winner.holderPhone,
            prize: winner.wonPrize,
            wonAt: winner.wonAt
        }
    });

  } catch (err: any) {
    console.error("Pick Winner Error:", err);
    res.status(500).json({ message: "Failed to pick winner" });
  }
};

// Get All Winners
export const getWinners = async (req: Request, res: Response) => {
    try {
        const winners = await Ticket.find({ isWinner: true })
            .select('holderName holderEmail holderPhone wonPrize wonAt')
            .sort({ wonAt: -1 });
        res.status(200).json({ winners });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch winners" });
    }
};


