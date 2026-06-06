import { Request, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { sendWinnerEmail } from '../services/emailService';
import smsService from '../services/smsService';

// File Upload Draw (Keeping Original Features)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage }).single('file');

export const uploadDraw = async (req: Request, res: Response) => {
    console.log("🍀 Upload Draw Request Received");
    try {
        if (!req.file) {
            console.error("❌ No file uploaded");
            return res.status(400).json({ message: "Upload a file!" });
        }
        console.log(`📁 File received: ${req.file.originalname}, Size: ${req.file.size} bytes, Mime: ${req.file.mimetype}`);
        
        let jsonData: any[] = [];

        // Check if it's a JSON file
        if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
            const fileContent = req.file.buffer.toString('utf-8');
            jsonData = JSON.parse(fileContent);
            
            // Ensure it's an array
            if (!Array.isArray(jsonData)) {
                // Handle case where it might be wrapped { users: [...] }
                const values = Object.values(jsonData);
                const possibleArray = values.find(v => Array.isArray(v));
                if (possibleArray) {
                    jsonData = possibleArray;
                } else {
                    // Or single object
                     jsonData = [jsonData];
                }
            }
        } else {
            // EXCEL Logic
            const workbook = new ExcelJS.Workbook();
            if (req.file.originalname.endsWith('.csv')) {
                // Not perfectly handling CSV but rejecting for simplicity if needed, 
                // or you can add csv-parser. For now, let's treat as unsupported.
                return res.status(400).json({ message: "CSV upload is currently limited, please upload JSON or XLSX format!" });
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (workbook.xlsx.load as any)(req.file.buffer);
                const worksheet = workbook.worksheets[0];
                if (worksheet) {
                    const keys: string[] = [];
                    worksheet.getRow(1).eachCell((cell, colNumber) => {
                        keys[colNumber] = cell.value ? String(cell.value) : `Column_${colNumber}`;
                    });
                    
                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber > 1) {
                            let obj: any = {};
                            row.eachCell((cell, colNumber) => {
                                const key = keys[colNumber];
                                if (key) {
                                    // exceljs formula/hyperlink cells have objects
                                    obj[key] = (cell.type === ExcelJS.ValueType.Formula) ? cell.result : 
                                               (cell.type === ExcelJS.ValueType.Hyperlink) ? cell.text : cell.value;
                                }
                            });
                            jsonData.push(obj);
                        }
                    });
                }
            }
        }
        
        if (!jsonData || !jsonData.length) return res.status(400).json({ message: "File is empty or invalid!" });

        const randomIndex = Math.floor(Math.random() * jsonData.length);
        const rawWinner = jsonData[randomIndex];
        
        // Key Mapping (Case insensitive search for 'name' and 'email' columns)
        const keys = Object.keys(rawWinner);
        const nameKey = keys.find(k => k.toLowerCase().includes('name')) || keys[0];
        const emailKey = keys.find(k => k.toLowerCase().includes('email')) || keys[1] || "No Email";

        res.json({ 
            firstName: rawWinner[nameKey] || "Unknown",
            email: rawWinner[emailKey] || "No Email"
        });

        // --- Async Notifications ---
        (async () => {
            const firstName = rawWinner[nameKey] || "Unknown";
            const email = rawWinner[emailKey];
            
            // Find phone column (loose match)
            const phoneKey = keys.find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('contact'));
            const phone = phoneKey ? rawWinner[phoneKey] : null;

            console.log(`🎰 Winner Selected: ${firstName}. Notification process started...`);
            console.log(`📧 Parsed Email: '${email}'`);

            // 1. Try Email - DISABLED
            if (email && email.includes('@')) {
                // try {
                //     console.log(`📨 Attempting to send email to ${email}...`);
                //     await sendWinnerEmail(email, firstName);
                //     console.log(`✅ Email sent to ${email}`);
                // } catch (err) {
                //     console.error(`❌ Email Failed for ${email}:`, err);
                // }
            } else {
                console.warn(`⚠️ Skipping Email: Invalid or missing email address ('${email}')`);
            }

            // 2. Try SMS - DISABLED
            if (phone) {
                // try {
                //     // Basic cleanup for phone
                //     const cleanPhone = String(phone).replace(/[^0-9]/g, '');
                //     if (cleanPhone.length >= 10) {
                //             await smsService.sendWinnerNotification(cleanPhone, firstName);
                //             console.log(`✅ SMS sent to ${cleanPhone}`);
                //     }
                // } catch (err) {
                //      console.error(`❌ SMS Failed for ${phone}:`, err);
                // }
            }
        })();

    } catch (error) {
        console.error("Upload Draw Error:", error);
        res.status(500).json({ message: "File processing error" });
    }
};
