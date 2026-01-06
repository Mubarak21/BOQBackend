"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidationPipe = void 0;
const common_1 = require("@nestjs/common");
let FileValidationPipe = class FileValidationPipe {
    constructor() {
        this.maxSize = 10 * 1024 * 1024;
        this.allowedMimeTypes = [
            'text/csv',
            'application/csv',
            'text/comma-separated-values',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];
        this.allowedExtensions = ['.csv', '.xlsx', '.xls'];
    }
    transform(value, metadata) {
        if (!value) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (value.size > this.maxSize) {
            throw new common_1.BadRequestException(`File size too large. Maximum allowed size is ${this.maxSize / 1024 / 1024}MB.`);
        }
        const fileExtension = value.originalname
            .toLowerCase()
            .substring(value.originalname.lastIndexOf('.'));
        if (!this.allowedExtensions.includes(fileExtension)) {
            throw new common_1.BadRequestException(`Invalid file type: ${fileExtension}. Please upload CSV (.csv) or Excel (.xlsx) files only.`);
        }
        if (value.mimetype && !this.allowedMimeTypes.includes(value.mimetype)) {
            if (this.allowedExtensions.includes(fileExtension)) {
                console.warn(`MIME type mismatch: ${value.mimetype} for file ${value.originalname}, but extension is valid`);
            }
            else {
                throw new common_1.BadRequestException(`Invalid file type. Please upload CSV (.csv) or Excel (.xlsx) files only.`);
            }
        }
        return value;
    }
};
exports.FileValidationPipe = FileValidationPipe;
exports.FileValidationPipe = FileValidationPipe = __decorate([
    (0, common_1.Injectable)()
], FileValidationPipe);
//# sourceMappingURL=file-validation.pipe.js.map