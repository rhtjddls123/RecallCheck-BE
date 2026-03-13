import { IsOptional, IsString, Matches } from 'class-validator';

export class SetQuietTimeDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'HH:mm 형식으로 입력해주세요',
  })
  quietStart: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'HH:mm 형식으로 입력해주세요',
  })
  quietEnd: string | null;
}
