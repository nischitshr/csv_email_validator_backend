import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'fast-csv';
import * as validator from 'validator';
import { promises as dns } from 'dns';
import { createObjectCsvStringifier } from 'csv-writer';

/** Disposable and role-based email lists */
const DISPOSABLE_DOMAINS = ['10minutemail.com', 'mailinator.com', 'tempmail.com'];
const ROLE_PREFIXES = ['info', 'admin', 'support', 'contact', 'sales'];

@Injectable()
export class EmailService {
  private storedResults: any = null; // In-memory storage

  /**
   * Process uploaded CSV file and validate emails
   */
  async processCSV(file: Express.Multer.File) {
    const deliverable: string[] = [];
    const nonDeliverable: string[] = [];
    const details: {
      email: string;
      syntaxValid: boolean;
      domainValid: boolean;
      mxValid: boolean;
      disposable: boolean;
      roleBased: boolean;
      deliverable: boolean;
      confidence: number;
      reason: string;
    }[] = [];

    /** Read CSV */
    const rows: any[] = [];
    const stream = Readable.from(file.buffer.toString());

    await new Promise<void>((resolve, reject) => {
      csv
        .parseStream(stream, { headers: true, trim: true })
        .on('error', reject)
        .on('data', (row) => rows.push(row))
        .on('end', resolve);
    });

    /** Process emails */
    for (const row of rows) {
      const email: string = row.email?.trim();
      if (!email) continue;

      const syntaxValid = validator.isEmail(email);
      const domain = email.split('@')[1]?.toLowerCase() || '';
      const local = email.split('@')[0]?.toLowerCase() || '';

      let domainValid = false;
      let mxValid = false;

      if (syntaxValid) {
        try {
          await dns.lookup(domain);
          domainValid = true;
        } catch {}

        try {
          const mxRecords = await dns.resolveMx(domain);
          mxValid = mxRecords.length > 0;
        } catch {}
      }

      const disposable = DISPOSABLE_DOMAINS.includes(domain);
      const roleBased = ROLE_PREFIXES.some((p) => local.startsWith(p));

      const isDeliverable =
        syntaxValid && domainValid && mxValid && !disposable && !roleBased;

      /** Confidence + reason */
      let confidence = isDeliverable ? 100 : 0;
      let reason = 'Valid';

      if (!syntaxValid) reason = 'Invalid syntax';
      else if (!domainValid) reason = 'Invalid domain';
      else if (!mxValid) reason = 'No MX record';
      else if (disposable) reason = 'Disposable email';
      else if (roleBased) reason = 'Role-based email';

      if (isDeliverable) deliverable.push(email);
      else nonDeliverable.push(email);

      details.push({
        email,
        syntaxValid,
        domainValid,
        mxValid,
        disposable,
        roleBased,
        deliverable: isDeliverable,
        confidence,
        reason,
      });
    }

    /** Store results for pagination & export */
    this.storedResults = {
      total: deliverable.length + nonDeliverable.length,
      deliverableCount: deliverable.length,
      undeliverableCount: nonDeliverable.length,
      deliverableEmails: deliverable,
      nonDeliverableEmails: nonDeliverable,
      details,
    };

    return this.storedResults;
  }

  /**
   * Get all processed emails
   */
  async getAllEmails() {
    if (!this.storedResults) return [];
    return this.storedResults.details;
  }

  /**
   * Export results as CSV
   */
  async exportCSV(type: 'deliverable' | 'undeliverable' | 'all') {
    if (!this.storedResults) {
      throw new Error('No data available to export');
    }

    let records = this.storedResults.details;

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
