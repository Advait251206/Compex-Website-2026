import mongoose, { Document, Schema } from 'mongoose';
import { Gender, TicketStatus } from '../utils/constants';

export interface ITicket extends Document {
  holderName: string;
  holderEmail: string;
  holderPhone: string;
  holderGender: Gender;
  holderDob: Date;
  holderReferralSource?: string;
  holderReferralDetails?: string;
  holderBuyingInterest?: string;
  holderBuyingInterestDetails?: string;
  status: TicketStatus;
  isEmailVerified: boolean;

  isPhoneVerified: boolean;
  isCheckedIn: boolean;
  checkInTime?: Date;
  otp?: string;
  otpExpiry?: Date;
  otpChannel?: 'email' | 'sms';
  qrCodeData?: string;  // Unique ID for QR
  
  // Lucky Draw
  isWinner?: boolean;
  wonPrize?: string;
  wonAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    holderName: {
      type: String,
      required: [true, 'Holder name is required'],
      trim: true
    },
    holderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,  
      sparse: true, // Allow multiple nulls
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    holderPhone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true // Allow multiple nulls/undefined if email is present (though we want at least one)
    },
    holderGender: {
      type: String,
      enum: Object.values(Gender)
    },
    holderDob: {
      type: Date
    },
    holderReferralSource: {
      type: String
    },
    holderReferralDetails: {
      type: String,
      default: ''
    },
    holderBuyingInterest: {
      type: String
    },
    holderBuyingInterestDetails: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.PENDING
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: {
      type: Date
    },
    otp: {
      type: String
    },
    otpExpiry: {
      type: Date
    },
    otpChannel: {
      type: String,
      enum: ['email', 'sms'],
      default: 'email'
    },
    qrCodeData: {
      type: String,
      unique: true,
      sparse: true  // Allow null values while enforcing uniqueness
    },
    // Lucky Draw Fields
    isWinner: {
        type: Boolean,
        default: false
    },
    wonPrize: {
        type: String,
        default: ''
    },
    wonAt: {
        type: Date
    }
  },
  {
    timestamps: true
  }
);

const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);

export default Ticket;
