// src/cap/pipes/cap-validate.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Injectable()
export class CapValidatePipe implements PipeTransform {
  constructor(private readonly dto: new () => unknown) {}

  transform(value: unknown): unknown {
    const obj = plainToInstance(this.dto, value, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(obj as object, { whitelist: true });

    if (errors.length) {
      throw new BadRequestException(errors);
    }

    return obj;
  }
}
