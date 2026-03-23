import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateKeywordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  keyword: string;
}
