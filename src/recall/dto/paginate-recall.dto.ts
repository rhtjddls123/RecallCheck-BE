import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginateRecallDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsIn(['createdAt_desc', 'createdAt_asc', 'name_asc', 'name_desc'])
  order: 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc' =
    'createdAt_desc';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  take: number = 10;
}
