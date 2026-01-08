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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationDetail = void 0;
const typeorm_1 = require("typeorm");
const upload_history_entity_1 = require("./upload-history.entity");
let ValidationDetail = class ValidationDetail {
    id;
    email;
    syntaxValid;
    domainValid;
    mxValid;
    disposable;
    roleBased;
    deliverable;
    confidence;
    reason;
    history;
};
exports.ValidationDetail = ValidationDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ValidationDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ValidationDetail.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ValidationDetail.prototype, "syntaxValid", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ValidationDetail.prototype, "domainValid", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ValidationDetail.prototype, "mxValid", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ValidationDetail.prototype, "disposable", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ValidationDetail.prototype, "roleBased", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], ValidationDetail.prototype, "deliverable", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ValidationDetail.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ValidationDetail.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => upload_history_entity_1.UploadHistory, (history) => history.details, { onDelete: 'CASCADE' }),
    __metadata("design:type", upload_history_entity_1.UploadHistory)
], ValidationDetail.prototype, "history", void 0);
exports.ValidationDetail = ValidationDetail = __decorate([
    (0, typeorm_1.Entity)()
], ValidationDetail);
//# sourceMappingURL=validation-detail.entity.js.map