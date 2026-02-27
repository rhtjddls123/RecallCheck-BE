import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { RawSafetyInfoContent, RawSafetyInfoResponse } from './consumer24.type';

@Injectable()
export class Consumer24Client {
  constructor(private readonly http: HttpService) {}

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
}
