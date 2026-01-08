import { UploadHistory } from './upload-history.entity';
export declare class ValidationDetail {
    id: number;
    email: string;
    syntaxValid: boolean;
    domainValid: boolean;
    mxValid: boolean;
    disposable: boolean;
    roleBased: boolean;
    deliverable: boolean;
    confidence: number;
    reason: string;
    history: UploadHistory;
}
