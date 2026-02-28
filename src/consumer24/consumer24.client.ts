import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  RawRecallResponse,
  RawSafetyInfoContent,
  RawSafetyInfoResponse,
} from './consumer24.type';
import { RECALL_CATEGORY_KEY_TYPE } from './const/KEYS.const';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class Consumer24Client {
  constructor(private readonly http: HttpService) {}

  /**
   * open api를 통해 안전정보를 받아온 뒤 파싱하여 반환하는 함수
   * 파라미터로 현재 페이지와 불러올 데이터 개수를 입력받는다.
   */
  async fetchInfoList(page = 1, cnt = 100): Promise<RawSafetyInfoContent[]> {
    const url = 'https://www.consumer.go.kr/openapi/contents/index.do';

    const { data } = await this.http.axiosRef.get<string>(url, {
      params: {
        serviceKey: process.env.SAFETY_INFO_KEY,
        pageNo: page,
        cntPerPage: cnt,
        cntntsId: '00000463',
      },
    });

    const parsed = (await parseStringPromise(data, {
      explicitArray: false,
      trim: true,
    })) as RawSafetyInfoResponse;

    if (
      parsed['ns2:selectCntntsForOpenAPIResponse'].return &&
      parsed['ns2:selectCntntsForOpenAPIResponse'].return.code !== '00'
    ) {
      return [];
    }

    const raw =
      parsed['ns2:selectCntntsForOpenAPIResponse'].channel!.return.content;

    const contents = Array.isArray(raw) ? raw : [raw];

    return contents.map((item) => ({
      ...item,
      ano: item.infoUrl.match(/bbsDataView\/(\d+)\.do/)?.[1] ?? '',
    }));
  }

  /**
   * open api를 통해 리콜정보를 받아온 뒤 파싱하여 반환하는 함수
   * 파라미터로 다음과 같은 값들을 받는다.
   * - 서비스 키
   * - 불러올 리콜 정보의 카테고리 값
   * - 현재 페이지
   * - 불러올 데이터 개수
   */
  async fetchRecallList(
    serviceKey: string,
    contentId: RECALL_CATEGORY_KEY_TYPE,
    page = 1,
    cnt = 100,
  ) {
    const url = 'https://www.consumer.go.kr/openapi/recall/contents/index.do';

    const { data } = await this.http.axiosRef.get<string>(url, {
      params: {
        serviceKey,
        pageNo: page,
        cntPerPage: cnt,
        cntntsId: contentId,
      },
    });

    const parsed = (await parseStringPromise(data, {
      explicitArray: false,
      trim: true,
    })) as RawRecallResponse;

    if (
      parsed['ns2:selectCntntsForOpenAPIResponse'].return &&
      parsed['ns2:selectCntntsForOpenAPIResponse'].return.code !== '00'
    ) {
      return { contents: [], totalCount: 0 };
    }

    const raw =
      parsed['ns2:selectCntntsForOpenAPIResponse'].channel!.return.content;

    const contents = Array.isArray(raw) ? raw : [raw];

    return {
      contents,
      totalCount: Number(
        parsed['ns2:selectCntntsForOpenAPIResponse'].channel!.return.allCnt,
      ),
    };
  }
}
