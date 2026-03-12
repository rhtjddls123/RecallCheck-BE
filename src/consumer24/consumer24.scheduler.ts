import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Consumer24Service } from './consumer24.service';
import { RecallService } from 'src/recall/recall.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class Consumer24Scheduler {
  constructor(
    private readonly consumer24Service: Consumer24Service,
    private readonly recallService: RecallService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 */3 * * *') // 3시간마다
  async handleCron() {
    console.log(`[${new Date().toLocaleString('kr')}] 리콜 데이터 동기화 시작`);

    await this.consumer24Service.saveInfoList();
    const newProducts =
      await this.consumer24Service.saveAllCategoryRecalls('recent');

    if (newProducts.length > 0) {
      await this.notificationService.sendNotifications(newProducts);
    }

    await this.recallService.embedAllProducts();
    await this.recallService.syncNewProductsToEs();

    console.log(`[${new Date().toLocaleString('kr')}] 리콜 데이터 동기화 완료`);
  }
}
