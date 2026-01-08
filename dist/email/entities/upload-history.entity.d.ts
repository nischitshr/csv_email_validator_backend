import { ValidationDetail } from './validation-detail.entity';
export declare class UploadHistory {
    id: string;
    filename: string;
    processedAt: Date;
    total: number;
    deliverableCount: number;
    undeliverableCount: number;
    details: ValidationDetail[];
}
