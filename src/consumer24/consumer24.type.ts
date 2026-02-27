export interface RawSafetyInfoContent {
  ano: string; // 순번
  infoSj: string; // 게시물제목
  infoRgsde: string; // 등록일 (2021-01-01)
  infoModde: string; // 수정일 (2021-01-01)
  infoUrl: string; // 상세페이지URL
  tmnlImgUrl: string; // 썸네일이미지URL
}

export interface RawSafetyInfoResponse {
  'ns2:selectCntntsForOpenAPIResponse': {
    channel?: {
      return: {
        allCnt: string;
        code: string;
        codeMsg: string;
        content: RawSafetyInfoContent | RawSafetyInfoContent[];
      };
    };
    return?: {
      allCnt: string;
      code: string;
      codeMsg: string;
    };
  };
}

export interface SafetyInfoType {
  externalId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  imageUrl: string;
}
