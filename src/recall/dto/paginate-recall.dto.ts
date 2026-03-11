import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { RECALL_CATEGORY_KEY_MAP } from 'src/consumer24/const/KEYS.const';

export class PaginateRecallDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsIn(['createdAt_desc', 'createdAt_asc', 'name_asc', 'name_desc'])
  order?: 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc';

  @IsOptional()
  @IsString()
  @IsIn(Object.keys(RECALL_CATEGORY_KEY_MAP))
  category?: keyof typeof RECALL_CATEGORY_KEY_MAP;

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
