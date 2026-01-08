import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UploadHistory } from './upload-history.entity';

@Entity()
export class ValidationDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    syntaxValid: boolean;

    @Column()
    domainValid: boolean;

    @Column()
    mxValid: boolean;

    @Column()
    disposable: boolean;

    @Column()
    roleBased: boolean;

    @Column()
    deliverable: boolean;

    @Column()
    confidence: number;

    @Column()
    reason: string;

    @ManyToOne(() => UploadHistory, (history) => history.details, { onDelete: 'CASCADE' })
    history: UploadHistory;
}
