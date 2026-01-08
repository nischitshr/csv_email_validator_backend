import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Readable } from 'stream';
import * as csv from 'fast-csv';
import * as validator from 'validator';
import { promises as dns } from 'dns';
import { createObjectCsvStringifier } from 'csv-writer';
import { UploadHistory as UploadHistoryEntity } from './entities/upload-history.entity';
import { ValidationDetail as ValidationDetailEntity } from './entities/validation-detail.entity';

export { UploadHistoryEntity as UploadHistory, ValidationDetailEntity as ValidationDetail };

/** Disposable and role-based email lists */
const DISPOSABLE_DOMAINS = [
  '10minutemail.com', 'mailinator.com', 'tempmail.com', 'throwawaymail.com',
  'guerrillamail.com', 'sharklasers.com', 'dispostable.com', 'getnada.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com'
];
const ROLE_PREFIXES = ['info', 'admin', 'support', 'contact', 'sales', 'billing', 'help', 'jobs'];

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(UploadHistoryEntity)
    private historyRepo: Repository<UploadHistoryEntity>,
    @InjectRepository(ValidationDetailEntity)
    private detailRepo: Repository<ValidationDetailEntity>,
  ) { }

  /**
   * Process uploaded CSV file and validate emails
   */
  async processCSV(file: Express.Multer.File) {
    const detailsData: Partial<ValidationDetailEntity>[] = [];
    let deliverableCount = 0;
    let undeliverableCount = 0;

    const rows: any[] = [];
    const stream = Readable.from(file.buffer.toString());

    await new Promise<void>((resolve, reject) => {
      csv
        .parseStream(stream, { headers: true, trim: true })
        .on('error', reject)
        .on('data', (row) => rows.push(row))
        .on('end', resolve);
    });

    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Try to find the email column if "email" header is missing
    const firstRow = rows[0];
    let emailKey = 'email';
    if (!(emailKey in firstRow)) {
      const possibleKeys = Object.keys(firstRow);
      const foundKey = possibleKeys.find(k => k.toLowerCase().includes('email'));
      if (foundKey) emailKey = foundKey;
    }

    // Limit concurrency for DNS lookups to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await Promise.all(batch.map(async (row) => {
        const email: string = row[emailKey]?.trim();
        if (!email) return;

        const syntaxValid = validator.isEmail(email);
        const [local, domain] = email.split('@').map(s => s?.toLowerCase() || '');

        let domainValid = false;
        let mxValid = false;

        if (syntaxValid && domain) {
          try {
            // DNS lookup for A record
            await dns.lookup(domain);
            domainValid = true;
          } catch { }

          try {
            // DNS resolve for MX records
            const mxRecords = await dns.resolveMx(domain);
            mxValid = mxRecords.length > 0;
          } catch { }
        }

        const disposable = DISPOSABLE_DOMAINS.includes(domain);
        const roleBased = ROLE_PREFIXES.some((p) => local.startsWith(p));

        const isDeliverable = syntaxValid && domainValid && mxValid && !disposable;

        if (isDeliverable) deliverableCount++;
        else undeliverableCount++;

        let reason = 'Valid';
        if (!syntaxValid) reason = 'Invalid syntax';
        else if (!domainValid) reason = 'Invalid domain';
        else if (!mxValid) reason = 'No MX record';
        else if (disposable) reason = 'Disposable email';
        else if (roleBased) reason = 'Role-based (Warning)';

        detailsData.push({
          email,
          syntaxValid,
          domainValid,
          mxValid,
          disposable,
          roleBased,
          deliverable: isDeliverable,
          confidence: isDeliverable ? (roleBased ? 80 : 100) : 0,
          reason,
        });
      }));
    }

    const history = this.historyRepo.create({
      filename: file.originalname,
      total: detailsData.length,
      deliverableCount,
      undeliverableCount,
      details: detailsData.map(d => this.detailRepo.create(d)),
    });

    return await this.historyRepo.save(history);
  }

  async getHistory() {
    return await this.historyRepo.find({
      order: { processedAt: 'DESC' },
      take: 20,
    });
  }

  async getHistoryById(id: string) {
    return await this.historyRepo.findOne({
      where: { id },
      relations: ['details'],
    });
  }

  async getAllEmails() {
    // This was used for the list endpoint, we'll fetch the last one
    const lastHistory = await this.historyRepo.findOne({
      where: {},
      order: { processedAt: 'DESC' },
      relations: ['details'],
    });
    return lastHistory?.details || [];
  }

  async exportCSV(type: 'deliverable' | 'undeliverable' | 'all') {
    const lastHistory = await this.historyRepo.findOne({
      where: {},
      order: { processedAt: 'DESC' },
      relations: ['details'],
    });

    if (!lastHistory) {
      throw new Error('No data available to export');
    }

    let records = lastHistory.details;

    if (type === 'deliverable') {
      records = records.filter((e) => e.deliverable);
    } else if (type === 'undeliverable') {
      records = records.filter((e) => !e.deliverable);
    }

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'email', title: 'Email' },
        { id: 'deliverable', title: 'Deliverable' },
        { id: 'confidence', title: 'Confidence' },
        { id: 'reason', title: 'Reason' },
      ],
    });

    return (
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records)
    );
  }
}
