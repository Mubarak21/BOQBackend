import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class FileValidationPipe implements PipeTransform {
    private readonly maxSize;
    private readonly allowedMimeTypes;
    private readonly allowedExtensions;
    transform(value: Express.Multer.File, metadata: ArgumentMetadata): Express.Multer.File;
}
