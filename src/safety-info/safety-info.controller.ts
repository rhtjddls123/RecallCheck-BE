import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SafetyInfoService } from './safety-info.service';
import { PaginateSafetyInfoDto } from './dto/paginate-safety-info.dto';

@Controller('safety-info')
export class SafetyInfoController {
  constructor(private readonly safetyInfoService: SafetyInfoService) {}

  @Get('recent')
  async getRecentSafetyInfo(
    @Query('take', new DefaultValuePipe(5), ParseIntPipe) take: number,
  ) {
    return this.safetyInfoService.findRecentSafetyInfo(take);
  }

  @Get()
  async getSafetyInfo(@Query() body: PaginateSafetyInfoDto) {
    return this.safetyInfoService.getPaginateSafetyInfo(body);
  }
}
