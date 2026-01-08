import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ValidationDetail } from './validation-detail.entity';

@Entity()
export class UploadHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @CreateDateColumn()
    processedAt: Date;

    @Column()
    total: number;

    @Column()
    deliverableCount: number;

    @Column()
    undeliverableCount: number;

    @OneToMany(() => ValidationDetail, (detail) => detail.history, { cascade: true })
    details: ValidationDetail[];
}
