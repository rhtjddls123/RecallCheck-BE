import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RecallService } from './recall.service';

@Controller('recall')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get('recent')
  getRecentRecall(
    @Query('take', new DefaultValuePipe(5), ParseIntPipe) take: number,
  ) {
    return this.recallService.findRecentRecall(take);
  }
}
