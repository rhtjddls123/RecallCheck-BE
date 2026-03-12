import { Controller, Post } from '@nestjs/common';
import { Consumer24Scheduler } from './consumer24.scheduler';

@Controller('consumer24')
export class Consumer24Controller {
  constructor(private readonly consumer24Scheduler: Consumer24Scheduler) {}

  // @Get()
  // async test() {
  //   await this.consumer24Service.saveAllCategoryRecalls('all');
  // }

  @Post('test/cron')
  async testCron() {
    await this.consumer24Scheduler.handleCron();
    return { message: '크론잡 실행됨' };
  }
}
