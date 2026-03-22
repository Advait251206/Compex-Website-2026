import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

interface TicketData {
  ticketId: string;
  holderName: string;
  eventName: string;
  email: string;
  phone: string;
  gender: string;
  dob: Date;
  qrCodeData: string;
}

class PDFService {
  /**
   * Generate a PDF Ticket
   * @param data Ticket Data
   * @returns Buffer containing the PDF
   */
  async generateTicket(data: TicketData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
          layout: 'portrait'
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // --- Colors & Config ---
        const bgDark = '#050510';     // Deep space blue/black
        const accentCyan = '#00f3ff'; // Cyber cyan
        const accentPink = '#bc13fe'; // Neon pink/purple
        const textWhite = '#ffffff';
        const textGray = '#8b9bb4';
        
        const width = doc.page.width;
        const height = doc.page.height;
        const cardWidth = 520;
        const cardHeight = 320;
        const cardX = (width - cardWidth) / 2;
        const cardY = 120;

        // --- Background: Procedural Galaxy ---
        // 1. Deep Space Base
        doc.rect(0, 0, width, height).fill(bgDark);
        
        // 2. Stars (Random Dots)
        const starCount = 400;
        for(let i=0; i<starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const r = Math.random() * 1.5;
            const opacity = Math.random();
            
            doc.save();
            doc.circle(x, y, r)
               .fillColor(Math.random() > 0.8 ? accentCyan : textWhite)
               .fillOpacity(opacity)
               .fill();
            doc.restore();
        }

        // 3. Shooting Stars (Lines with Fade)
        const meteorCount = 5;
        for(let i=0; i<meteorCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * (height / 2); // Top half mostly
            const length = Math.random() * 100 + 50;
            
            doc.save();
            doc.lineWidth(2)
               .strokeColor(accentCyan)
               .strokeOpacity(0.4)
               .moveTo(x, y)
               .lineTo(x - length, y + length) // Diagonal down-left
               .stroke();
            doc.restore();
        }

        // --- Tech Pattern Background (Subtle Grid) ---
        doc.strokeColor('rgba(255,255,255,0.05)').lineWidth(1);
        for(let i=0; i<width; i+=40) {
            doc.moveTo(i, 0).lineTo(i, height).stroke();
        }
        for(let i=0; i<height; i+=40) {
            doc.moveTo(0, i).lineTo(width, i).stroke();
        }

        // --- Main Ticket Card (Chamfered Corners) ---
        // Helper to draw chamfered rect
        const chamfer = 20;
        doc.lineJoin('round')
           .lineWidth(3)
           .strokeColor(accentCyan)
           .fillColor('#0a0a1a');

        doc.moveTo(cardX + chamfer, cardY)
           .lineTo(cardX + cardWidth - chamfer, cardY)
           .lineTo(cardX + cardWidth, cardY + chamfer)
           .lineTo(cardX + cardWidth, cardY + cardHeight - chamfer)
           .lineTo(cardX + cardWidth - chamfer, cardY + cardHeight)
           .lineTo(cardX + chamfer, cardY + cardHeight)
           .lineTo(cardX, cardY + cardHeight - chamfer)
           .lineTo(cardX, cardY + chamfer)
           .closePath()
           .fillAndStroke();

        // --- Decorative Circuit Lines ---
        doc.lineWidth(1).strokeColor(accentPink);
        // Top Left Decoration
        doc.moveTo(cardX + 10, cardY + 40).lineTo(cardX + 40, cardY + 40).lineTo(cardX + 50, cardY + 10).stroke();
        // Bottom Right Decoration
        doc.moveTo(cardX + cardWidth - 10, cardY + cardHeight - 40)
           .lineTo(cardX + cardWidth - 40, cardY + cardHeight - 40)
           .lineTo(cardX + cardWidth - 50, cardY + cardHeight - 10)
           .stroke();

        // --- Header Section ---
        doc.font('Courier-Bold')
           .fontSize(28)
           .fillColor(textWhite)
           .text('COMP-EX 2026', cardX, cardY + 30, { width: cardWidth, align: 'center' });

        doc.fontSize(10)
           .fillColor(accentCyan)
           .text('OFFICIAL ENTRY PASS PROTOCOL', cardX, cardY + 60, { width: cardWidth, align: 'center', characterSpacing: 2 });

        // --- Separator Line ---
        doc.moveTo(cardX + 40, cardY + 80).lineTo(cardX + cardWidth - 40, cardY + 80).lineWidth(1).strokeColor('rgba(255,255,255,0.2)').stroke();

        // --- Data Grid ---
        const startX = cardX + 40;
        const startY = cardY + 100;
        const col1 = startX;
        const col2 = startX + 140; // Values start here
        const lineHeight = 22;

        doc.font('Courier').fontSize(9).fillColor(textGray);
        
        const labels = ['TICKET ID', 'ATTENDEE', 'EMAIL', 'PHONE', 'GENDER', 'DOB'];
        const values = [
            data.ticketId.toUpperCase().slice(-8), // Short ID for clean look
            data.holderName.toUpperCase(),
            data.email,
            data.phone || 'N/A',
            data.gender.toUpperCase(),
            new Date(data.dob).toLocaleDateString()
        ];

        labels.forEach((label, i) => {
            doc.font('Courier').fontSize(9).fillColor(textGray)
               .text(label, col1, startY + (i * lineHeight));
            
            doc.font('Courier-Bold').fontSize(11).fillColor(textWhite)
               .text(values[i], col2, startY + (i * lineHeight));
        });

        // --- QR Code Section ---
        const qrSize = 100;
        const qrX = cardX + cardWidth - qrSize - 40;
        const qrY = startY + 10;
        
        // QR Border
        doc.lineWidth(2).strokeColor(accentCyan)
           .rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
           .stroke();
           
        // QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(data.qrCodeData);
        doc.image(qrCodeDataUrl, qrX, qrY, { width: qrSize });
        
        doc.font('Courier-Bold').fontSize(8).fillColor(accentPink)
           .text('SCAN_ME', qrX, qrY + qrSize + 10, { width: qrSize, align: 'center' });

        // --- Footer Warning ---
        doc.fontSize(7).fillColor(textGray)
           .text('AUTHORIZED PERSONNEL ONLY. SYSTEM GENERATED. INVALID WITHOUT QR.', cardX, cardY + cardHeight - 25, { width: cardWidth, align: 'center' });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFService();
