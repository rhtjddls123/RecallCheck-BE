import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Consumer24Service } from './consumer24.service';
import { Repository } from 'typeorm';
import { SafetyInfoModel } from 'src/safety-info/entity/safetyInfo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Consumer24Mapper } from './consumer24.mapper';

@Injectable()
export class Consumer24Scheduler {
  constructor(
    private readonly consumer24Service: Consumer24Service,
    private readonly mapper: Consumer24Mapper,
    @InjectRepository(SafetyInfoModel)
    private readonly safetyInfoRepository: Repository<SafetyInfoModel>,
  ) {}

  @Cron('0 */3 * * *') // 3시간마다
  async handleCron() {
    console.log('리콜 데이터 동기화 시작');
    const datas = await this.consumer24Service.saveInfoList();

    for (const data of datas) {
      const entity = this.mapper.toSafetyInfoEntity(data);

      await this.safetyInfoRepository.upsert(entity, ['externalId']);
    }

    console.log('리콜 데이터 동기화 완료');
  }
}
