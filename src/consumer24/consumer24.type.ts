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

export interface RawRecallContent {
  recallSn: string; // 리콜번호 (PK)
  cntntsId: string; // 메뉴 ID
  productNm: string; // 제품명
  makr?: string; // 제조사
  bsnmNm?: string; // 사업자명
  mnfcturPd?: string; // 제조기간
  modlNmInfo?: string; // 모델명 정보
  mnfcturNoInfo?: string; // 제조번호 정보
  stdBrcd?: string; // 표준 바코드
  distbTmlmtDe?: string; // 유통기한 일자
  prmisnNo?: string; // 허가번호
  mdlpClNo?: string; // 의료기기 분류번호
  aditfield13?: string; // 제품 상세내용
  etcInfo?: string; // 기타 정보
  mainSleoffic?: string; // 주요 판매처
  shrtcomCn?: string; // 결함 내용
  recallSe?: string; // 리콜 구분

  recallPublictBgnde?: string; // 리콜 공표시작일 (yyyyMMdd)
  recallPublictEndde?: string; // 리콜 공표만료일 (yyyyMMdd)

  injryCauseResult?: string; // 위해 원인 결과
  injryFrgltyTrgter?: string; // 위해 취약 대상자
  hrmflGrad?: string; // 위해성 등급
  acdntCn?: string; // 사고내용
  cnsmrGhvrTips?: string; // 소비자 행동 요령
  trtmntAtpn?: string; // 취급 주의사항

  recallBgnde?: string; // 리콜 시작일 (yyyyMMdd)
  recallEndde?: string; // 리콜 종료일 (yyyyMMdd)
  recallProcssInfo?: string; // 리콜 절차 정보
  recallEntrpsInfo?: string; // 문의처 / 사업자 주소

  infoOriginInstt?: string; // 정보 출처 기관
  infoOriginInsttUrl?: string; // 정보 출처 URL
  infoCreatInstt?: string; // 정보 생성 기관
  infoCreatUrl?: string; // 정보 생성 URL (||로 구분)

  recallImgUrls?: string; // 리콜 이미지 URL (쉼표구분)
}

export interface RawRecallResponse {
  'ns2:selectCntntsForOpenAPIResponse': {
    channel?: {
      return: {
        allCnt: string;
        code: string;
        codeMsg: string;
        content: RawRecallContent | RawRecallContent[];
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

export interface RecallType {
  // 🔑 식별자
  recallSn: string; // 리콜 고유번호 (PK)

  // 제품 정보
  productNm: string; // 제품명
  makr?: string; // 제조사
  modlNmInfo?: string; // 모델명
  stdBrcd?: string; // 표준 바코드
  mnfcturPd?: string; // 제조기간
  mnfcturNoInfo?: string; // 제조번호
  distbTmlmtDe?: string; // 유통기한

  // 리콜 정보
  recallSe?: string; // 리콜 구분
  hrmflGrad?: string; // 위해성 등급
  shrtcomCn?: string; // 결함 내용
  injryCauseResult?: string; // 위해 원인
  acdntCn?: string; // 사고 내용

  // 소비자 행동
  cnsmrGhvrTips?: string; // 소비자 행동 요령
  trtmntAtpn?: string; // 취급 주의사항
  recallProcssInfo?: string; // 리콜 절차
  recallEntrpsInfo?: string; // 문의처

  // 기간
  recallBgnde?: Date; // 리콜 시작일
  recallEndde?: Date; // 리콜 종료일
  recallPublictBgnde?: Date; // 공표 시작일
  recallPublictEndde?: Date; // 공표 종료일

  // 이미지
  recallImgUrls?: string[]; // 쉼표 → 배열로 변환 저장

  // 시스템 컬럼
  createdAt: Date;
  updatedAt: Date;
}
