export const RECALL_CATEGORY_KEY_MAP = {
  '0401': '생활화학제품',
  '0208': '위생용품',
  '0205': '의약외품',
  '0405': '생활방사선제품',
  '0206': '화장품',
  '0403': '먹는물',
  '0203': '축산물',
  '0101': '공산품',
  '0207': '의료기기',
  '0204': '의약품',
  '0201': '식품',
  '0301': '자동차',
  // '0501': '해외 리콜',
} as const;

export type RECALL_CATEGORY_KEY_TYPE = keyof typeof RECALL_CATEGORY_KEY_MAP;
