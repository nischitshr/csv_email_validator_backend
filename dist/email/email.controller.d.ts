import { EmailService } from './email.service';
import type { Response } from 'express';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    uploadCSV(file: Express.Multer.File): Promise<{
        id: string;
        filename: string;
        processedAt: Date;
        total: number;
        deliverableCount: number;
        undeliverableCount: number;
        details: import("./email.service").ValidationDetail[];
        status: string;
    }>;
    getHistory(): Promise<import("./email.service").UploadHistory[]>;
    getHistoryDetails(id: string): Promise<import("./email.service").UploadHistory>;
    getEmails(type?: 'deliverable' | 'undeliverable' | 'all', page?: string, limit?: string): Promise<{
        total: number;
        page: number;
        limit: number;
        emails: import("./email.service").ValidationDetail[];
    }>;
    exportCSV(type: "deliverable" | "undeliverable" | "all" | undefined, res: Response): Promise<void>;
}
