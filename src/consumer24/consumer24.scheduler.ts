import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Consumer24Service } from './consumer24.service';

@Injectable()
export class Consumer24Scheduler {
  constructor(private readonly consumer24Service: Consumer24Service) {}

  @Cron('0 */3 * * *') // 3시간마다
  async handleCron() {
    console.log(`[${new Date().toLocaleString('kr')}] 리콜 데이터 동기화 시작`);

    await this.consumer24Service.saveInfoList();
    await this.consumer24Service.saveAllCategoryRecalls('recent');

    console.log(`[${new Date().toLocaleString('kr')}] 리콜 데이터 동기화 완료`);
  }
}
