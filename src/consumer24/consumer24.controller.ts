import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Consumer24Scheduler } from './consumer24.scheduler';
import { Consumer24Service } from './consumer24.service';
import { RecallNewsCrawler } from './recall-news.crawler';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesEnum } from 'src/auth/const/roles.const';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('consumer24')
export class Consumer24Controller {
  constructor(
    private readonly consumer24Scheduler: Consumer24Scheduler,
    private readonly consumer24Service: Consumer24Service,
    private readonly recallNewsCrawler: RecallNewsCrawler,
  ) {}

  // @Get()
  // async test() {
  //   await this.consumer24Service.saveAllCategoryRecalls('all');
  // }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Post('test/cron')
  async testCron() {
    await this.consumer24Scheduler.handleCron();
    return { message: '크론잡 실행됨' };
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Post('test/cron-news')
  async testCronNews() {
    await this.recallNewsCrawler.crawl();
    return { message: '크롤러 실행됨' };
  }

  @Get('recall-news')
  async getRecallNews() {
    return this.consumer24Service.getRecallNews(5);
  }
}
