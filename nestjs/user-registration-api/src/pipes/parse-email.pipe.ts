import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { isEmail } from 'class-validator';

@Injectable()
export class ParseEmailPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    const normalized = value?.trim().toLowerCase();
    if (!normalized || !isEmail(normalized)) {
      throw new BadRequestException(
        `O parâmetro "${metadata.data}" deve ser um email válido`,
      );
    }
    return normalized;
  }
}