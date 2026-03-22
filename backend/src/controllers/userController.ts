import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/Ticket';
import { TicketStatus } from '../utils/constants';
import { sendOTPEmail, sendTicketEmail } from '../services/emailService';
import smsService from '../services/smsService';
import pdfService from '../services/pdfService';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validation rules
export const registerValidation = [
  body('holderName').trim().optional({ checkFalsy: true }), // Optional for Step 1
  body('holderEmail').isEmail().withMessage('Valid email is required'),
  body('holderPhone').trim().optional(),
  body('holderGender').optional(),
  body('holderDob').optional(),
  body('holderDob').optional(),
  body('holderReferralSource').optional(),
  body('holderBuyingInterest').optional()
];

export const otpValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// User Registration - Step 1: Submit form and send OTP
// Step 1: Send OTP (Initiate Registration)
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { holderName, holderEmail, holderPhone, channel } = req.body;

    // We need at least one contact method
    if (!holderEmail && !holderPhone) {
        return res.status(400).json({ message: 'Either Email or Phone is required.' });
    }

    // Check if ticket already exists (by Email OR Phone)
    const query = {
        $or: [
            ...(holderEmail ? [{ holderEmail: holderEmail.toLowerCase() }] : []),
            ...(holderPhone ? [{ holderPhone }] : [])
        ]
    };
    
    // Use findOne to see if ANY match exists
    // Note: This logic might overlap if different users use same phone/email (blocked by unique constraints)
    let existingTicket = null;
    if (query.$or.length > 0) {
        existingTicket = await Ticket.findOne(query);
    }
    
    // If ticket exists and is VERIFIED, block
    if (existingTicket && existingTicket.status === TicketStatus.VERIFIED) {
        // Customize message based on what matched
        return res.status(409).json({ message: 'You are already registered.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    // Determine channel
    let otpChannel: 'email' | 'sms' = (channel === 'sms' || channel === 'phone') ? 'sms' : 'email';
    
    // Force SMS if no email provided
    if (!holderEmail && otpChannel === 'email') {
        otpChannel = 'sms';
    }

    // Validate Phone if channel is SMS
    if (otpChannel === 'sms' && (!holderPhone || holderPhone.length < 10)) {
        return res.status(400).json({ message: 'Valid phone number is required for SMS verification.' });
    }

    if (existingTicket) {
      // Update existing pending ticket
      const updateData: any = {
          holderName: holderName || existingTicket.holderName,
          otp,
          otpExpiry,
          otpChannel,
          status: TicketStatus.PENDING,
          // Reset verification if channel changed
          ...(otpChannel === 'email' ? { isEmailVerified: false } : {}),
          ...(otpChannel === 'sms' ? { isPhoneVerified: false } : {})
      };
      
      const unsetData: any = {};

      // Handle Email Update / Unset
      if (holderEmail && existingTicket.holderEmail !== holderEmail.toLowerCase()) {
          updateData.holderEmail = holderEmail.toLowerCase();
          updateData.isEmailVerified = false;
      } else if (!existingTicket.holderEmail) {
          // If no email exists on ticket, ensure it is unset (cleanup)
          unsetData.holderEmail = 1;
      }

      // Handle Phone Update / Unset
      if (holderPhone && existingTicket.holderPhone !== holderPhone) {
          updateData.holderPhone = holderPhone; 
          updateData.isPhoneVerified = false;
      } else if (!existingTicket.holderPhone) {
          unsetData.holderPhone = 1;
      }

      await Ticket.updateOne({ _id: existingTicket._id }, { $set: updateData, $unset: unsetData });
    } else {
      // Create new pending ticket
      await Ticket.create({
        holderName: holderName || 'Attendee',
        holderEmail: holderEmail ? holderEmail.toLowerCase() : undefined,
        holderPhone: holderPhone || undefined,
        otp,
        otpExpiry,
        otpChannel,
        status: TicketStatus.PENDING,
        isEmailVerified: false,
        isPhoneVerified: false
      });
    }

    if (otpChannel === 'sms') {
        await smsService.sendOTP(holderPhone, otp);
        res.status(200).json({ message: 'OTP sent to your phone.' });
    } else {
        if (!holderEmail) throw new Error("Email channel selected but no email provided");
        await sendOTPEmail(holderEmail, otp, holderName || 'Attendee');
        res.status(200).json({ message: 'OTP sent to your email.' });
    }

  } catch (error: any) {
    if (error.code === 11000) {
        console.error("Duplicate Key Error:", error);
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        const value = error.keyValue ? JSON.stringify(error.keyValue) : '';
        return res.status(409).json({ 
            message: `You are already registered! (Duplicate: ${field})`,
            debug: `Key: ${field}, Value: ${value}`
        });
    }
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};

// Step 2: Verify OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, phone, otp } = req.body;
    
    // Find ticket by Email OR Phone (whichever is provided for verification context)
    // We expect the frontend to send whatever identifier was used.
    
    const query: any = { 
       otp,
       otpExpiry: { $gt: new Date() },
       $or: []
    };

    if (email) query.$or.push({ holderEmail: email.toLowerCase() });
    if (phone) query.$or.push({ holderPhone: phone });

    if (query.$or.length === 0) {
        return res.status(400).json({ message: 'Email or Phone required to verify.' });
    }

    console.log(`[VerifyOTP] Searching for ticket with OTP: ${otp}, Query: ${JSON.stringify(query)}`);
    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      // DEBUG: Check if ticket exists BUT otp mismatches
      const debugQuery: any = { $or: [] };
      if (email) debugQuery.$or.push({ holderEmail: email.toLowerCase() });
      if (phone) debugQuery.$or.push({ holderPhone: phone });
      
      const debugTicket = await Ticket.findOne(debugQuery);
      if (debugTicket) {
           console.log(`[VerifyOTP] ⚠️ MISMATCH: Ticket found but OTP failed.`);
           console.log(`  Input OTP: '${otp}'`);
           console.log(`  Stored OTP: '${debugTicket.otp}'`);
           console.log(`  Expiry: ${debugTicket.otpExpiry} (Now: ${new Date()})`);
      } else {
           console.log(`[VerifyOTP] ❌ CRITICAL: No ticket found at all for ${email} / ${phone}`);
      }

      console.log(`[VerifyOTP] No matching ticket found for OTP ${otp}`);
      return res.status(200).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    console.log(`[VerifyOTP] Found ticket ${ticket._id}. Channel: ${ticket.otpChannel}`);

    // VERIFICATION LOGIC FIXED:
    // Only verify the channel that the OTP was generated for.
    
    if (ticket.otpChannel === 'sms') {
        ticket.isPhoneVerified = true;
        // Ensure the phone number matches what is verified
        if (phone && !ticket.holderPhone) ticket.holderPhone = phone;
        console.log(`[VerifyOTP] Verified PHONE via SMS`);
    } else {
        // default to email
        ticket.isEmailVerified = true;
        if (email && !ticket.holderEmail) ticket.holderEmail = email.toLowerCase();
        console.log(`[VerifyOTP] Verified EMAIL`);
    }

    ticket.otp = undefined;
    ticket.otpExpiry = undefined;
    await ticket.save();

    res.status(200).json({ success: true, message: 'Verification successful.' });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP.' });
  }
};

// Step 3: Complete Registration
export const completeRegistration = async (req: Request, res: Response) => {
  try {
    const { holderEmail, holderName, holderPhone, holderGender, holderDob, holderReferralSource, holderReferralDetails } = req.body;
    
    // Find matching ticket. Since we verified something, we should be able to find it.
    // Ideally find by ID if we passed it, but we rely on email/phone.
    
    const query = {
        $or: [
            ...(holderEmail ? [{ holderEmail: holderEmail.toLowerCase() }] : []),
            ...(holderPhone ? [{ holderPhone }] : [])
        ]
    };
    
    if (query.$or.length === 0) return res.status(400).json({ message: "No identifier provided." });

    // We take the first match. In a clean flow, this is unique.
    // We take the first match. In a clean flow, this is unique.
    // However, if there are "junk" pending tickets (e.g. one with email, one with phone), we must find the RIGHT one.
    // Priority: Verified Session > Pending Session with Verification > Newest
    const tickets = await Ticket.find(query);

    console.log(`[CompleteReg] Query:`, JSON.stringify(query));

    if (tickets.length === 0) return res.status(400).json({ message: "No identifier provided." });

    // Sort to find the best candidate
    // 1. Prefer tickets with actual verification (Email or Phone verified)
    // 2. Prefer newer tickets
    tickets.sort((a, b) => {
        const aVer = a.isEmailVerified || a.isPhoneVerified ? 1 : 0;
        const bVer = b.isEmailVerified || b.isPhoneVerified ? 1 : 0;
        if (aVer !== bVer) return bVer - aVer; // Higher verification first
        return b.updatedAt.getTime() - a.updatedAt.getTime(); // Newer first
    });

    const ticket = tickets[0]; // best candidate

    if (!ticket) {
      return res.status(404).json({ message: 'Registration session not found.' });
    }

    // Prevent overwriting an already verified ticket
    if (ticket.status === TicketStatus.VERIFIED) {
        return res.status(409).json({ message: 'Ticket already generated.' });
    }

    // Check if EITHER email OR phone is verified
    if (!ticket.isEmailVerified && !ticket.isPhoneVerified) {
      console.log(`[CompleteReg] Validation FAILED: Neither verified. PV=${ticket.isPhoneVerified}, EV=${ticket.isEmailVerified}`);
      return res.status(400).json({ message: 'Neither Email nor Phone is verified. Please verify at least one.' });
    }

    // STRICT RULE: Only keep fields that are verified.
    // We do NOT update email/phone from req.body here, because that would allow unverified changes.
    // We rely on verifyOtp having set the correct verified email/phone on the ticket.
    
    if (ticket.isEmailVerified) {
        // Keep existing ticket.holderEmail (which was verified)
    } else {
        // If not verified, FORGET IT
        ticket.holderEmail = undefined as any; 
    }

    if (ticket.isPhoneVerified) {
        // Keep existing ticket.holderPhone (which was verified)
    } else {
        ticket.holderPhone = undefined as any; 
    }

    // Update OTHER details (Profile info)
    ticket.holderName = holderName;
    ticket.holderGender = holderGender;
    ticket.holderDob = holderDob;
    ticket.holderReferralSource = holderReferralSource;
    ticket.holderReferralDetails = holderReferralDetails;
    ticket.holderBuyingInterest = req.body.holderBuyingInterest;
    ticket.holderBuyingInterestDetails = req.body.holderBuyingInterestDetails;
    
    // Identify as verified ticket
    ticket.status = TicketStatus.VERIFIED;
    
    // Generate QR Data String (if not already there)
    if (!ticket.qrCodeData) {
        ticket.qrCodeData = `COMPEX-${ticket._id}-${crypto.randomBytes(8).toString('hex')}`;
    }
    
    await ticket.save();

    // Generate PDF Ticket (Includes QR generation internally)
    const pdfBuffer = await pdfService.generateTicket({
        ticketId: ticket._id.toString(),
        holderName: ticket.holderName,
        eventName: 'COMP-EX 2026',
        email: ticket.holderEmail || "No Email",
        phone: ticket.holderPhone,
        gender: ticket.holderGender,
        dob: ticket.holderDob,
        qrCodeData: ticket.qrCodeData
    });

    // Only send email if we have an verified email address
    if (ticket.holderEmail && ticket.isEmailVerified) {
        await sendTicketEmail(ticket.holderEmail, ticket.holderName, pdfBuffer, ticket._id.toString());
    }

    res.status(200).json({ 
      message: 'Registration complete!',
      ticket: {
        id: ticket._id
      }
    });

  } catch (error: any) {
    console.error('Complete registration error:', error);
    res.status(500).json({ message: 'Registration failed.' });
  }
};

// Resend OTP
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const ticket = await Ticket.findOne({ 
      holderEmail: email.toLowerCase(),
      status: TicketStatus.PENDING
    });

    if (!ticket) {
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    ticket.otp = otp;
    ticket.otpExpiry = otpExpiry;
    await ticket.save();

    // Send OTP email
    await sendOTPEmail(ticket.holderEmail, otp, ticket.holderName);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

// Check if email already has a ticket (for real-time validation)
export const checkEmailStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const ticket = await Ticket.findOne({ holderEmail: email.toLowerCase() });

    if (ticket && ticket.status === TicketStatus.VERIFIED) {
      return res.status(200).json({ 
        exists: true, 
        message: 'This email is already registered.'
      });
    }

    return res.status(200).json({ 
      exists: false, 
      message: 'Email is available.' 
    });

  } catch (error: any) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Failed to check email status' });
  }
};

// Check if phone already has a ticket
export const checkPhoneStatus = async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ message: 'Phone is required' });
      }
  
      const ticket = await Ticket.findOne({ holderPhone: phone });
  
      if (ticket && ticket.status === TicketStatus.VERIFIED) {
        return res.status(200).json({ 
          exists: true, 
          message: 'This phone number is already registered.'
        });
      }
  
      return res.status(200).json({ 
        exists: false, 
        message: 'Phone number is available.' 
      });
  
    } catch (error: any) {
      console.error('Check phone error:', error);
      res.status(500).json({ message: 'Failed to check phone status' });
    }
  };

// --- View Ticket / Login Flow ---

export const sendLoginOtp = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body; // Can be email or phone
    
    if (!identifier) {
        return res.status(400).json({ success: false, message: "Email or Phone is required." });
    }

    // Find VERIFIED ticket by Email OR Phone
    const query = {
        $or: [
            { holderEmail: identifier.toLowerCase() },
            { holderPhone: identifier }
        ],
        status: TicketStatus.VERIFIED
    };

    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(200).json({ success: false, message: 'No registered ticket found.' });
    }

    // Determine channel
    let channel = 'email';
    // If input is digits (phone) OR ticket has no email, use SMS
    const isPhoneInput = /^\d{10}$/.test(identifier);
    
    if (isPhoneInput || !ticket.holderEmail || identifier === ticket.holderPhone) {
        channel = 'sms';
    } 

    if (channel === 'sms' && !ticket.holderPhone) {
         return res.status(200).json({ success: false, message: "No phone number found for this ticket." });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    ticket.otp = otp;
    ticket.otpExpiry = otpExpiry;
    await ticket.save();

    if (channel === 'sms') {
        await smsService.sendLoginOTP(ticket.holderPhone!, otp);
        res.status(200).json({ success: true, message: 'OTP sent to your phone.', channel: 'sms' });
    } else {
        await sendOTPEmail(ticket.holderEmail, otp, ticket.holderName);
        res.status(200).json({ success: true, message: 'OTP sent to your email.', channel: 'email' });
    }

  } catch (error: any) {
    console.error('Send Login OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const { identifier, otp } = req.body;
    
    // Find Ticket by Email/Phone AND OTP
    const query = {
        $or: [
            { holderEmail: identifier.toLowerCase() },
            { holderPhone: identifier }
        ],
        otp,
        otpExpiry: { $gt: new Date() },
        status: TicketStatus.VERIFIED
    };

    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Clear OTP
    ticket.otp = undefined;
    ticket.otpExpiry = undefined;
    await ticket.save();

    // Generate QR
    const qrCodeUrl = await QRCode.toDataURL(ticket.qrCodeData || `COMPEX-${ticket._id}`);

    res.status(200).json({ 
      message: 'Login successful.',
      ticket: {
        id: ticket._id,
        holderName: ticket.holderName,
        email: ticket.holderEmail || '',
        phone: ticket.holderPhone || '',
        gender: ticket.holderGender,
        dob: ticket.holderDob,
        qrCode: qrCodeUrl
      }
    });
  } catch (error: any) {
    console.error('Verify Login OTP error:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
};

// --- Ticket Actions ---

// --- Ticket Actions ---

// Get Ticket Details
export const getTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // Generate QR code URL on the fly
        const qrCodeUrl = await QRCode.toDataURL(ticket.qrCodeData || `COMPEX-${ticket._id}`);

        res.status(200).json({
            ticket: {
                id: ticket._id,
                holderName: ticket.holderName,
                email: ticket.holderEmail || '',
                phone: ticket.holderPhone || '',
                gender: ticket.holderGender,
                dob: ticket.holderDob,
                qrCode: qrCodeUrl
            }
        });

    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ message: 'Failed to fetch ticket' });
    }
};

// Download PDF
export const downloadTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const pdfBuffer = await pdfService.generateTicket({
            ticketId: ticket._id.toString(),
            holderName: ticket.holderName,
            eventName: 'COMP-EX 2026',
            email: ticket.holderEmail || "No Email",
            phone: ticket.holderPhone,
            gender: ticket.holderGender,
            dob: ticket.holderDob,
            qrCodeData: ticket.qrCodeData || ticket._id.toString()
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="CompEx-Ticket-${ticket._id.toString().slice(-6)}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Download ticket error:', error);
        res.status(500).json({ message: 'Failed to download ticket' });
    }
};

// Resend Email
export const resendTicketEmailController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        if (!ticket.holderEmail) {
            return res.status(400).json({ message: 'No email address linked to this ticket.' });
        }

        const pdfBuffer = await pdfService.generateTicket({
            ticketId: ticket._id.toString(),
            holderName: ticket.holderName,
            eventName: 'COMP-EX 2026',
            email: ticket.holderEmail,
            phone: ticket.holderPhone,
            gender: ticket.holderGender,
            dob: ticket.holderDob,
            qrCodeData: ticket.qrCodeData || ticket._id.toString()
        });

        await sendTicketEmail(ticket.holderEmail, ticket.holderName, pdfBuffer, ticket._id.toString());
        
        res.status(200).json({ message: 'Ticket email sent successfully!' });

    } catch (error) {
        console.error('Resend ticket email error:', error);
        res.status(500).json({ message: 'Failed to send email' });
    }
};

// --- Update Email Flow (For Phone-Only Users) ---

export const sendUpdateEmailOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email } = req.body; // New email to verify

        if (!email) return res.status(400).json({ message: "Email is required" });

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Check if email already used by ANOTHER ticket
        const existing = await Ticket.findOne({ holderEmail: email.toLowerCase() });
        if (existing && existing._id.toString() !== id) {
             return res.status(409).json({ message: "This email is already registered to another ticket." });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Store temp OTP in ticket (reusing fields is fine as user is already verified on main channel)
        // But we must NOT change the holderEmail yet. We need a way to verify it.
        // We can use the main OTP fields, but we need to know we are verifying EMAIL.
        // ACTUALLY: We can just send the OTP. When verifying, we pass the email again to confirm match.
        
        ticket.otp = otp;
        ticket.otpExpiry = otpExpiry;
        ticket.otpChannel = 'email'; // We are doing email verification
        await ticket.save();

        await sendOTPEmail(email, otp, ticket.holderName);

        res.status(200).json({ message: "OTP sent to new email." });

    } catch(err) {
        console.error("Send Update Email OTP error", err);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const verifyUpdateEmailOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, otp } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (ticket.otp !== otp || !ticket.otpExpiry || ticket.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Check channel was email (safety)
        // if (ticket.otpChannel !== 'email') ...

        // Update Email
        ticket.holderEmail = email.toLowerCase();
        ticket.isEmailVerified = true;
        
        // Clear OTP
        ticket.otp = undefined;
        ticket.otpExpiry = undefined;
        
        await ticket.save();

        res.status(200).json({ message: "Email updated successfully.", email: ticket.holderEmail });

    } catch(err) {
        console.error("Verify Update Email OTP error", err);
         res.status(500).json({ message: "Failed to verify email" });
    }
};

// --- Update Phone Flow (For Email-Only Users) ---

export const sendUpdatePhoneOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phone } = req.body; 

        if (!phone || phone.length < 10) return res.status(400).json({ message: "Valid phone number is required" });

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Check if phone already used by ANOTHER ticket
        const existing = await Ticket.findOne({ holderPhone: phone });
        if (existing && existing._id.toString() !== id) {
             return res.status(409).json({ message: "This phone number is already registered to another ticket." });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        ticket.otp = otp;
        ticket.otpExpiry = otpExpiry;
        ticket.otpChannel = 'sms'; // We are doing phone verification
        await ticket.save();

        await smsService.sendLoginOTP(phone, otp);

        res.status(200).json({ message: "OTP sent to phone." });

    } catch(err) {
        console.error("Send Update Phone OTP error", err);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const verifyUpdatePhoneOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phone, otp } = req.body; // Phone passed again for safety

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (ticket.otp !== otp || !ticket.otpExpiry || ticket.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Update Phone
        ticket.holderPhone = phone;
        ticket.isPhoneVerified = true;
        
        // Clear OTP
        ticket.otp = undefined;
        ticket.otpExpiry = undefined;
        
        await ticket.save();

        res.status(200).json({ message: "Phone updated successfully.", phone: ticket.holderPhone });

    } catch(err) {
        console.error("Verify Update Phone OTP error", err);
         res.status(500).json({ message: "Failed to verify phone" });
    }
};
