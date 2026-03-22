import { Request, Response, NextFunction } from 'express';
import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export const clerkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Debug Log
    // console.log('[ClerkAuth] Received Token:', token); 

    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    // Safety check for JWT format (roughly)
    if (token.split('.').length !== 3) {
         console.warn('[ClerkAuth] Malformed Token detected:', token);
         return res.status(401).json({ message: 'Invalid token format' });
    }

    const sessionClaims = await clerk.verifyToken(token);
    
    if (!sessionClaims) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Attach user info to request
    (req as any).clerkUserId = sessionClaims.sub;

    // Admin Authorization Check
    const adminEmails = ['advaitkawale@gmail.com', 'compex251206@gmail.com', 'visitcompex@gmail.com', 'praveshpshrivastava@gmail.com'];
    
    if (adminEmails.length > 0) {
      const user = await clerk.users.getUser(sessionClaims.sub);
      const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();

      // Attach email to request for potential role-based checks downstream
      (req as any).userEmail = userEmail;

      if (!userEmail || !adminEmails.includes(userEmail)) {
        return res.status(403).json({ message: 'Access denied: Admin privileges required' });
      }
    }

    next();
  } catch (error: any) {
    console.error('Clerk auth error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
