import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { UploadHistory } from './entities/upload-history.entity';
import { ValidationDetail } from './entities/validation-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadHistory, ValidationDetail])],
  providers: [EmailService],
  controllers: [EmailController],
})
export class EmailModule { }
