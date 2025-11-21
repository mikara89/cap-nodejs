import 'reflect-metadata';
import { CapValidatePipe } from './cap-validate.pipe';
import { BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';

class GoodDto {
  @IsString()
  name!: string;
}

describe('CapValidatePipe', () => {
  it('transforms plain object into dto instance when valid', () => {
    const pipe = new CapValidatePipe(GoodDto);
    const result = pipe.transform({ name: 'alice' }) as GoodDto;
    expect(result.name).toBe('alice');
  });

  it('throws BadRequestException for invalid payload', () => {
    const pipe = new CapValidatePipe(GoodDto);
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });
});
