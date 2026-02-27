import { Controller, Get, Query } from '@nestjs/common';
import { SafetyInfoService } from './safety-info.service';
import { PaginateSafetyInfoDto } from './dto/paginate-safety-info.dto';

@Controller('safety-info')
export class SafetyInfoController {
  constructor(private readonly safetyInfoService: SafetyInfoService) {}

  @Get('top5')
  async getSafetyInfoByTop5() {
    return this.safetyInfoService.getSafetyInfo();
  }

  @Get()
  async getSafetyInfo(@Query() body: PaginateSafetyInfoDto) {
    return this.safetyInfoService.getPaginateSafetyInfo(body);
  }
}
