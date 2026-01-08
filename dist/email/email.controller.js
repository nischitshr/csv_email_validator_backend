"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const email_service_1 = require("./email.service");
let EmailController = class EmailController {
    emailService;
    constructor(emailService) {
        this.emailService = emailService;
    }
    async uploadCSV(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const result = await this.emailService.processCSV(file);
        return {
            status: 'success',
            ...result
        };
    }
    async getHistory() {
        return this.emailService.getHistory();
    }
    async getHistoryDetails(id) {
        const details = await this.emailService.getHistoryById(id);
        if (!details)
            throw new common_1.BadRequestException('History not found');
        return details;
    }
    async getEmails(type = 'all', page = '1', limit = '20') {
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const allEmails = await this.emailService.getAllEmails();
        let filtered = allEmails;
        if (type === 'deliverable') {
            filtered = allEmails.filter((e) => e.deliverable);
        }
        else if (type === 'undeliverable') {
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
    async exportCSV(type = 'all', res) {
        const csvData = await this.emailService.exportCSV(type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="emails_${type}.csv"`);
        res.send(csvData);
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "uploadCSV", null);
__decorate([
    (0, common_1.Get)('history'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('history/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getHistoryDetails", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getEmails", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "exportCSV", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)('emails'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map