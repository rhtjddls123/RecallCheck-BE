import { Injectable } from '@nestjs/common';
import { RawSafetyInfoContent } from './consumer24.type';

@Injectable()
export class Consumer24Mapper {
  toSafetyInfoEntity(raw: RawSafetyInfoContent) {
    return {
      externalId: raw.ano,
      title: raw.infoSj,
      uploadDate: raw.infoRgsde,
      updateDate: raw.infoModde,
      infoUrl: raw.infoUrl,
      tmnlImgUrl: raw.tmnlImgUrl,
    };
  }
}
