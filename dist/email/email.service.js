"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = exports.ValidationDetail = exports.UploadHistory = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stream_1 = require("stream");
const csv = __importStar(require("fast-csv"));
const validator = __importStar(require("validator"));
const dns_1 = require("dns");
const csv_writer_1 = require("csv-writer");
const upload_history_entity_1 = require("./entities/upload-history.entity");
Object.defineProperty(exports, "UploadHistory", { enumerable: true, get: function () { return upload_history_entity_1.UploadHistory; } });
const validation_detail_entity_1 = require("./entities/validation-detail.entity");
Object.defineProperty(exports, "ValidationDetail", { enumerable: true, get: function () { return validation_detail_entity_1.ValidationDetail; } });
const DISPOSABLE_DOMAINS = [
    '10minutemail.com', 'mailinator.com', 'tempmail.com', 'throwawaymail.com',
    'guerrillamail.com', 'sharklasers.com', 'dispostable.com', 'getnada.com',
    'temp-mail.org', 'yopmail.com', 'trashmail.com'
];
const ROLE_PREFIXES = ['info', 'admin', 'support', 'contact', 'sales', 'billing', 'help', 'jobs'];
let EmailService = class EmailService {
    historyRepo;
    detailRepo;
    constructor(historyRepo, detailRepo) {
        this.historyRepo = historyRepo;
        this.detailRepo = detailRepo;
    }
    async processCSV(file) {
        const detailsData = [];
        let deliverableCount = 0;
        let undeliverableCount = 0;
        const rows = [];
        const stream = stream_1.Readable.from(file.buffer.toString());
        await new Promise((resolve, reject) => {
            csv
                .parseStream(stream, { headers: true, trim: true })
                .on('error', reject)
                .on('data', (row) => rows.push(row))
                .on('end', resolve);
        });
        if (rows.length === 0) {
            throw new Error('CSV file is empty');
        }
        const firstRow = rows[0];
        let emailKey = 'email';
        if (!(emailKey in firstRow)) {
            const possibleKeys = Object.keys(firstRow);
            const foundKey = possibleKeys.find(k => k.toLowerCase().includes('email'));
            if (foundKey)
                emailKey = foundKey;
        }
        const batchSize = 10;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            await Promise.all(batch.map(async (row) => {
                const email = row[emailKey]?.trim();
                if (!email)
                    return;
                const syntaxValid = validator.isEmail(email);
                const [local, domain] = email.split('@').map(s => s?.toLowerCase() || '');
                let domainValid = false;
                let mxValid = false;
                if (syntaxValid && domain) {
                    try {
                        await dns_1.promises.lookup(domain);
                        domainValid = true;
                    }
                    catch { }
                    try {
                        const mxRecords = await dns_1.promises.resolveMx(domain);
                        mxValid = mxRecords.length > 0;
                    }
                    catch { }
                }
                const disposable = DISPOSABLE_DOMAINS.includes(domain);
                const roleBased = ROLE_PREFIXES.some((p) => local.startsWith(p));
                const isDeliverable = syntaxValid && domainValid && mxValid && !disposable;
                if (isDeliverable)
                    deliverableCount++;
                else
                    undeliverableCount++;
                let reason = 'Valid';
                if (!syntaxValid)
                    reason = 'Invalid syntax';
                else if (!domainValid)
                    reason = 'Invalid domain';
                else if (!mxValid)
                    reason = 'No MX record';
                else if (disposable)
                    reason = 'Disposable email';
                else if (roleBased)
                    reason = 'Role-based (Warning)';
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
    async getHistoryById(id) {
        return await this.historyRepo.findOne({
            where: { id },
            relations: ['details'],
        });
    }
    async getAllEmails() {
        const lastHistory = await this.historyRepo.findOne({
            where: {},
            order: { processedAt: 'DESC' },
            relations: ['details'],
        });
        return lastHistory?.details || [];
    }
    async exportCSV(type) {
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
        }
        else if (type === 'undeliverable') {
            records = records.filter((e) => !e.deliverable);
        }
        const csvStringifier = (0, csv_writer_1.createObjectCsvStringifier)({
            header: [
                { id: 'email', title: 'Email' },
                { id: 'deliverable', title: 'Deliverable' },
                { id: 'confidence', title: 'Confidence' },
                { id: 'reason', title: 'Reason' },
            ],
        });
        return (csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(records));
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(upload_history_entity_1.UploadHistory)),
    __param(1, (0, typeorm_1.InjectRepository)(validation_detail_entity_1.ValidationDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EmailService);
//# sourceMappingURL=email.service.js.map