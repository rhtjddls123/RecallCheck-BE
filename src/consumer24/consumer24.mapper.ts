import { Injectable } from '@nestjs/common';
import { RawRecallContent, RawSafetyInfoContent } from './consumer24.type';

const parseDate = (value?: string) => value || null;
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

  toRecallEntity(raw: RawRecallContent) {
    return {
      recallSn: raw.recallSn,
      cntntsId: raw.cntntsId,
      productNm: raw.productNm,
      makr: raw.makr,
      bsnmNm: raw.bsnmNm,
      mnfcturPd: raw.mnfcturPd,
      modlNmInfo: raw.modlNmInfo,
      mnfcturNoInfo: raw.mnfcturNoInfo,
      stdBrcd: raw.stdBrcd,
      distbTmlmtDe: raw.distbTmlmtDe,
      prmisnNo: raw.prmisnNo,
      mdlpClNo: raw.mdlpClNo,
      aditfield13: raw.aditfield13,
      etcInfo: raw.etcInfo,
      mainSleoffic: raw.mainSleoffic,
      shrtcomCn: raw.shrtcomCn,
      recallSe: raw.recallSe,
      recallPublictBgnde: parseDate(raw.recallPublictBgnde),
      recallPublictEndde: parseDate(raw.recallPublictEndde),
      injryCauseResult: raw.injryCauseResult,
      injryFrgltyTrgter: raw.injryFrgltyTrgter,
      hrmflGrad: raw.hrmflGrad,
      acdntCn: raw.acdntCn,
      cnsmrGhvrTips: raw.cnsmrGhvrTips,
      trtmntAtpn: raw.trtmntAtpn,
      recallBgnde: parseDate(raw.recallBgnde),
      recallEndde: parseDate(raw.recallEndde),
      recallProcssInfo: raw.recallProcssInfo,
      recallEntrpsInfo: raw.recallEntrpsInfo,
      infoOriginInstt: raw.infoOriginInstt,
      infoOriginInsttUrl: raw.infoOriginInsttUrl,
      infoCreatInstt: raw.infoCreatInstt,
      infoCreatUrl: raw.infoCreatUrl?.split('||'),
      recallImgUrls: raw.recallImgUrls?.split(','),
    };
  }
}
