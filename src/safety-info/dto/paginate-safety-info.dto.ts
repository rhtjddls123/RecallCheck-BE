import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class PaginateSafetyInfoDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsNumber()
  take: number = 20;
}
