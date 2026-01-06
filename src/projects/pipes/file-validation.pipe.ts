import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'text/csv',
    'application/csv',
    'text/comma-separated-values',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  private readonly allowedExtensions = ['.csv', '.xlsx', '.xls'];

  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file size
    if (value.size > this.maxSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed size is ${this.maxSize / 1024 / 1024}MB.`,
      );
    }

    // Check file extension
    const fileExtension = value.originalname
      .toLowerCase()
      .substring(value.originalname.lastIndexOf('.'));

    if (!this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file type: ${fileExtension}. Please upload CSV (.csv) or Excel (.xlsx) files only.`,
      );
    }

    // Check MIME type (optional, as some browsers may not set it correctly)
    if (value.mimetype && !this.allowedMimeTypes.includes(value.mimetype)) {
      // Only warn if extension is valid but MIME type doesn't match
      if (this.allowedExtensions.includes(fileExtension)) {
        console.warn(
          `MIME type mismatch: ${value.mimetype} for file ${value.originalname}, but extension is valid`,
        );
      } else {
        throw new BadRequestException(
          `Invalid file type. Please upload CSV (.csv) or Excel (.xlsx) files only.`,
        );
      }
    }

    return value;
  }
}

