import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
  Get,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmailService } from './email.service';
import type { Response } from 'express';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Upload CSV & process emails
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.emailService.processCSV(file);

    return {
      status: 'success',
      totalEmails: result.total,
      deliverableCount: result.deliverableCount,
      undeliverableCount: result.undeliverableCount,
      deliverableEmails: result.deliverableEmails,
      nonDeliverableEmails: result.nonDeliverableEmails,
      details: result.details,
    };
  }

  /**
   * Pagination & filtering API
   * /emails/list?type=deliverable&page=1&limit=20
   */
  @Get('list')
  async getEmails(
    @Query('type') type: 'deliverable' | 'undeliverable' | 'all' = 'all',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const allEmails = await this.emailService.getAllEmails();

    let filtered = allEmails;
    if (type === 'deliverable') {
      filtered = allEmails.filter((e) => e.deliverable);
    } else if (type === 'undeliverable') {
      filtered = allEmails.filter((e) => !e.deliverable);
    }

    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    return {
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      emails: filtered.slice(start, end),
    };
  }

  /**
   * Export results as CSV
   * /emails/export?type=deliverable
   */
  @Get('export')
  async exportCSV(
    @Query('type') type: 'deliverable' | 'undeliverable' | 'all' = 'all',
    @Res() res: Response,
  ) {
    const csvData = await this.emailService.exportCSV(type);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="emails_${type}.csv"`,
    );

    res.send(csvData);
  }
}
