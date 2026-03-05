import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async correctTypo(query: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [
        {
          role: 'system',
          content: `
          너는 제품 검색어 오타 보정기야.

          규칙:
          1. 오타만 보정해줘 (예: "세탇기" → "세탁기")
          2. 단어를 번역하거나 의미가 다른 단어로 바꾸지마 (예: "씨푸드" → "해산물" 금지)
          3. 줄임말은 전체 단어로 변환해줘 (예: "삼전" → "삼성전자")
          4. 확신이 없으면 원래 검색어 그대로 반환해줘
          5. 단어만 반환하고 다른 말은 절대 하지마

          예시:
          입력: 세탇기 → 출력: 세탁기
          입력: 삼전 → 출력: 삼성전자
          입력: 보일링 씨푸드 → 출력: 보일링 씨푸드
          입력: 냉장곻 → 출력: 냉장고
          입력: 에어컨디셔너 → 출력: 에어컨
          입력: 현기차 → 출력: 현대기아차
        `,
        },
        {
          role: 'user',
          content: query,
        },
      ],
    });

    return response.choices[0].message.content?.trim() ?? query;
  }
}
