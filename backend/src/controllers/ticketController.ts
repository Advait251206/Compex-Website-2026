import { Request, Response } from 'express';
import Ticket from '../models/Ticket';

// Get Current User Profile / Ticket Info
export const getMe = async (req: Request, res: Response) => {
  try {
    // req.userEmail is populated by clerkAuth middleware
    const email = (req as any).userEmail;
    
    // For Admin Dashboard, we might just want to return the role
    // But if we want to return the connected Ticket for this email:
    const ticket = await Ticket.findOne({ holderEmail: email });

    res.status(200).json({
      message: 'Profile fetched',
      data: {
        role: 'admin', // If they passed clerkAuth, they are admin (per current middleware logic)
        email: email,
        // Return ticket if exists, but strictly not required for admin role check alone
        ticket: ticket ? {
            id: ticket._id,
            name: ticket.holderName
        } : null
      }
    });

  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};
