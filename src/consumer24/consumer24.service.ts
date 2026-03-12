import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  RECALL_CATEGORY_KEY_MAP,
  RECALL_CATEGORY_KEY_TYPE,
} from './const/KEYS.const';
import { Consumer24Client } from './consumer24.client';
import { InjectRepository } from '@nestjs/typeorm';
import { SafetyInfoModel } from 'src/safety-info/entity/safetyInfo.entity';
import { Consumer24Mapper } from './consumer24.mapper';
import { Repository } from 'typeorm';
import { RecallModel } from 'src/recall/entity/recall.entity';

@Injectable()
export class Consumer24Service implements OnModuleInit {
  constructor(
    private readonly client: Consumer24Client,
    private readonly mapper: Consumer24Mapper,
    @InjectRepository(SafetyInfoModel)
    private readonly safetyInfoRepository: Repository<SafetyInfoModel>,
    @InjectRepository(RecallModel)
    private readonly recallRepository: Repository<RecallModel>,
  ) {}

  async onModuleInit() {
    // await this.saveInfoList();
    // await this.saveAllCategoryRecalls('all');
  }

  private readonly serviceKeys = {
    '0401': process.env.RECALL_CHEMICAL_PRODUCT_KEY!, // 생활화학제품
    '0208': process.env.RECALL_SANITARY_PRODUCT_KEY!, // 위생용품
    '0205': process.env.RECALL_QUASI_DRUG_KEY!, // 의약외품
    '0405': process.env.RECALL_RADIATION_PRODUCT_KEY!, // 생활방사선제품
    '0206': process.env.RECALL_COSMETIC_KEY!, // 화장품
    '0403': process.env.RECALL_DRINKING_WATER_KEY!, // 먹는물
    '0203': process.env.RECALL_LIVESTOCK_PRODUCT_KEY!, // 축산물
    '0101': process.env.RECALL_INDUSTRIAL_PRODUCT_KEY!, // 공산품
    '0207': process.env.RECALL_MEDICAL_DEVICE_KEY!, // 의료기기
    '0204': process.env.RECALL_MEDICINE_KEY!, // 의약품
    '0201': process.env.RECALL_FOOD_KEY!, // 식품
    '0301': process.env.RECALL_CAR_KEY!, // 자동차
    // '0501': process.env.RECALL_OVERSEAS_KEY!, // 해외 리콜
  } as const;

  /**
   * 카테고리 코드를 입력받아 해당 카테고리의 리콜 정보를 반환하는 함수
   */
  async findRecallsByCategoryCode(
    categoryCode: RECALL_CATEGORY_KEY_TYPE,
    page = 1,
    cnt = 100,
  ) {
    const serviceKey = this.serviceKeys[categoryCode];
    const data = await this.client.fetchRecallList(
      serviceKey,
      categoryCode,
      page,
      cnt,
    );
    return data.contents;
  }

  /**
   * 카테고리 코드를 입력받아 해당 카테고리에 존재하는 모든 리콜 정보를 반환하는 함수
   * 10% 진행될때마다 진행상황을 출력
   * mode값이 all일 경우 모든 데이터 조회, recent일 경우 최근 100개 데이터 조회
   */
  async findAllRecallsByCategoryCode(
    categoryCode: RECALL_CATEGORY_KEY_TYPE,
    mode: 'all' | 'recent',
  ) {
    const serviceKey = this.serviceKeys[categoryCode];
    const cnt = 100;

    const { contents: firstContents, totalCount } =
      await this.client.fetchRecallList(serviceKey, categoryCode, 1, cnt);
    const totalPages = Math.ceil(totalCount / cnt);
    const allContents = [...firstContents];

    if (mode === 'recent') {
      return { content: allContents, totalCount: allContents.length };
    }

    console.log(
      `[데이터 불러오는중] 카테고리 이름: ${RECALL_CATEGORY_KEY_MAP[categoryCode]}, 카테고리 코드: ${categoryCode}, 총 데이터 개수: ${totalCount}`,
    );

    let nextMilestone = 10;

    for (let page = 2; page <= totalPages; page++) {
      const progress = Math.floor((page / totalPages) * 100);

      const { contents } = await this.client.fetchRecallList(
        serviceKey,
        categoryCode,
        page,
        cnt,
      );

      if (progress >= nextMilestone) {
        console.log(`${progress}% 진행중... (${page}/${totalPages})`);
        nextMilestone += 10;
      }

      allContents.push(...contents);
    }

    return { content: allContents, totalCount };
  }

  /**
   * 모든 카테고리의 리콜 정보를 db에 저장하는 함수
   * db에 데이터가 없을 경우 한번만 실행하면 됨
   * 10% 진행될때마다 진행상황을 출력
   *
   * mode값이 all일 경우 모든 데이터 저장, recent일 경우 최근 100개 데이터 저장
   */
  async saveAllCategoryRecalls(mode: 'all' | 'recent') {
    const newProducts: Partial<RecallModel>[] = [];

    for (const categoryCode of Object.keys(this.serviceKeys)) {
      const { content: datas, totalCount } =
        await this.findAllRecallsByCategoryCode(
          categoryCode as RECALL_CATEGORY_KEY_TYPE,
          mode,
        );

      console.log(
        `[데이터 저장중] 카테고리 이름: ${RECALL_CATEGORY_KEY_MAP[categoryCode]}, 카테고리 코드: ${categoryCode}, 총 데이터 개수: ${totalCount}`,
      );

      let nextMilestone = 10;

      for (let i = 0; i < datas.length; i += 1) {
        const progress = Math.floor(((i + 1) / totalCount) * 100);

        const data = datas[i];
        const entity = this.mapper.toRecallEntity(data);

        if (progress >= nextMilestone) {
          console.log(`${progress}% 진행중... (${i + 1}/${totalCount})`);
          nextMilestone += 10;
        }

        const existing = await this.recallRepository.findOne({
          where: { recallSn: entity.recallSn },
        });

        if (!existing) {
          newProducts.push(entity);
        }

        await this.recallRepository.upsert(entity, ['recallSn']);
      }
    }

    return newProducts;
  }

  /**
   * 최근 안전 정보 100개를 db에 저장하는 함수
   * db에 데이터가 없을 경우 한번만 실행하면 됨
   */
  async saveInfoList() {
    const datas = await this.client.fetchInfoList();

    for (const data of datas) {
      const entity = this.mapper.toSafetyInfoEntity(data);

      await this.safetyInfoRepository.upsert(entity, ['externalId']);
    }

    return true;
  }
}
