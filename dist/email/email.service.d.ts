import { Repository } from 'typeorm';
import { UploadHistory as UploadHistoryEntity } from './entities/upload-history.entity';
import { ValidationDetail as ValidationDetailEntity } from './entities/validation-detail.entity';
export { UploadHistoryEntity as UploadHistory, ValidationDetailEntity as ValidationDetail };
export declare class EmailService {
    private historyRepo;
    private detailRepo;
    constructor(historyRepo: Repository<UploadHistoryEntity>, detailRepo: Repository<ValidationDetailEntity>);
    processCSV(file: Express.Multer.File): Promise<UploadHistoryEntity>;
    getHistory(): Promise<UploadHistoryEntity[]>;
    getHistoryById(id: string): Promise<UploadHistoryEntity | null>;
    getAllEmails(): Promise<ValidationDetailEntity[]>;
    exportCSV(type: 'deliverable' | 'undeliverable' | 'all'): Promise<string>;
}
