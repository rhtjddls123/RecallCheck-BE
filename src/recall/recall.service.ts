import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import {
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { PaginateRecallDto } from './dto/paginate-recall.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { RECALL_CATEGORY_KEY_TYPE } from 'src/consumer24/const/KEYS.const';
import { OpenAIService } from 'src/openai/openai.service';

interface RecallEsDocument {
  recallSn: string;
  cntntsId: string;
  productNm: string;
  makr: string | null;
  bsnmNm: string | null;
  embedding: number[];
}

@Injectable()
export class RecallService {
  constructor(
    @InjectRepository(RecallModel)
    private readonly recallRepository: Repository<RecallModel>,
    private openAIService: OpenAIService,
    private esService: ElasticsearchService,
  ) {}

  async chatbotSearch(query: string, categoryId?: RECALL_CATEGORY_KEY_TYPE) {
    // 카테고리id가 없을 경우 전체 카테고리에서 검색
    if (!categoryId) {
      const exactResultAll = await this.exactSearch(query, null);
      if (exactResultAll) {
        return {
          found: true,
          differentCategory: false,
          data: exactResultAll,
        };
      }
    } else {
      // 1단계: exact 매칭, 카테고리 포함
      const exactResult = await this.exactSearch(query, categoryId);
      if (exactResult) {
        return { found: true, differentCategory: false, data: exactResult };
      }
    }
    // 2단계: exact 매칭, 카테고리 제외
    const exactResultAll = await this.exactSearch(query, null);
    if (exactResultAll) {
      return {
        found: true,
        differentCategory: true,
        data: exactResultAll,
      };
    }

    return { found: false, data: { products: [], count: 0 } };
  }

  // ES exact 매칭 (LIKE 역할)
  private async exactSearch(
    query: string,
    categoryId: RECALL_CATEGORY_KEY_TYPE | null,
  ) {
    const mustConditions: any[] = [];
    if (categoryId) {
      mustConditions.push({ term: { cntntsId: categoryId } });
    }

    const countResult = await this.esService.count({
      index: 'recall',
      query: {
        bool: {
          must: mustConditions,
          should: [
            {
              match_phrase: {
                productNm: { query, boost: 3 },
              },
            },
            {
              match_phrase: {
                makr: { query, boost: 1 },
              },
            },
            {
              match_phrase: {
                bsnmNm: { query, boost: 1 },
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    });

    const result = await this.esService.search<RecallEsDocument>({
      index: 'recall',
      size: 3,
      query: {
        bool: {
          must: mustConditions,
          should: [
            {
              match_phrase: {
                productNm: { query, boost: 3 },
              },
            },
            {
              match_phrase: {
                makr: { query, boost: 1 },
              },
            },
            {
              match_phrase: {
                bsnmNm: { query, boost: 1 },
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    });

    const hits = result.hits.hits;
    if (!hits.length) return null;

    console.log(
      `\n[Exact 검색] query: "${query}" | categoryId: ${categoryId ?? '전체'}`,
    );
    hits.forEach((h, i) => {
      console.log(
        `[${i + 1}] ${h._source?.productNm} | score: ${h._score?.toFixed(3)}`,
      );
    });

    const recallSns = hits.map((h) => h._source?.recallSn as string);
    const data = await this.recallRepository.find({
      where: { recallSn: In(recallSns) },
    });

    const sorted = recallSns
      .map((sn) => data.find((p) => p.recallSn === sn))
      .filter((p): p is RecallModel => p !== undefined);

    return { products: sorted, count: countResult.count };
  }

  // ES 임베딩 검색
  async embeddingSearch(query: string) {
    const embedding = await this.openAIService.getEmbedding(query);

    const result = await this.esService.search<RecallEsDocument>({
      index: 'recall',
      size: 5,
      min_score: 0.75,
      knn: {
        field: 'embedding',
        query_vector: embedding,
        k: 5,
        num_candidates: 100,
      },
    });

    const hits = result.hits.hits;
    if (!hits.length) return null;

    console.log(`\n[임베딩 검색] query: "${query}" | categoryId: '전체'`);
    hits.forEach((h, i) => {
      console.log(
        `[${i + 1}] ${h._source?.productNm} | score: ${h._score?.toFixed(3)}`,
      );
    });

    const recallSns = hits.map((h) => h._source?.recallSn as string);
    const data = await this.recallRepository.find({
      where: { recallSn: In(recallSns) },
    });

    if (data.length === 0) return { found: false, data: [] };

    const sorted = recallSns
      .map((sn) => data.find((p) => p.recallSn === sn))
      .filter((p): p is RecallModel => p !== undefined);

    return { found: true, data: sorted };
  }

  async syncToElasticsearch() {
    const products = await this.recallRepository.find();
    const total = products.length;
    console.log(`동기화 대상: ${total}개`);

    const startTime = Date.now();

    for (let idx = 0; idx < products.length; idx++) {
      const product = products[idx];

      try {
        await this.esService.index({
          index: 'recall',
          id: product.recallSn,
          document: {
            recallSn: product.recallSn,
            cntntsId: product.cntntsId,
            productNm: product.productNm,
            makr: product.makr,
            bsnmNm: product.bsnmNm,
            embedding: product.embedding, // PostgreSQL에서 그대로 가져옴
          },
        });

        const done = idx + 1;
        const percent = ((done / total) * 100).toFixed(1);
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.round((elapsed / done) * (total - done));
        const remainingMin = Math.floor(remaining / 60);
        const remainingSec = remaining % 60;

        process.stdout.write(
          `\r[${done}/${total}] ${percent}% | 예상 남은 시간: ${remainingMin}분 ${remainingSec}초 | ${product.productNm.padEnd(30)}`,
        );
      } catch (e) {
        console.error(`\n실패: ${product.productNm}`, e);
      }
    }

    process.stdout.write('\n');
    const totalSec = Math.round((Date.now() - startTime) / 1000);
    console.log(
      `동기화 완료! 총 소요시간: ${Math.floor(totalSec / 60)}분 ${totalSec % 60}초`,
    );
  }

  async checkConnection() {
    return await this.esService.ping();
  }

  async createIndex() {
    const indexExists = await this.esService.indices.exists({
      index: 'recall',
    });

    if (indexExists) {
      console.log('인덱스 이미 존재함');
      return;
    }

    await this.esService.indices.create({
      index: 'recall',
      settings: {
        analysis: {
          analyzer: {
            korean: {
              type: 'custom',
              tokenizer: 'nori_tokenizer',
            },
            korean_search: {
              type: 'custom',
              tokenizer: 'nori_tokenizer',
              filter: ['lowercase'],
            },
          },
        },
      },
      mappings: {
        properties: {
          recallSn: { type: 'keyword' },
          cntntsId: { type: 'keyword' },
          productNm: {
            type: 'text',
            analyzer: 'korean',
            search_analyzer: 'korean_search',
          },
          makr: {
            type: 'text',
            analyzer: 'korean',
            search_analyzer: 'korean_search',
          },
          bsnmNm: {
            type: 'text',
            analyzer: 'korean',
            search_analyzer: 'korean_search',
          },
          embedding: {
            type: 'dense_vector',
            dims: 1536,
            index: true,
            similarity: 'cosine',
          },
        },
      },
    });

    console.log('인덱스 생성 완료');
  }

  // 최초 1회 임베딩 배치 저장
  async embedAllProducts() {
    const products = await this.recallRepository.find({
      where: { embedding: IsNull() },
    });

    const total = products.length;
    console.log(`임베딩 대상: ${total}개`);

    const startTime = Date.now();

    for (let idx = 0; idx < products.length; idx++) {
      const product = products[idx];
      let success = false;
      let retries = 0;

      while (!success && retries < 3) {
        try {
          const text = [product.productNm, product.makr, product.bsnmNm]
            .filter(Boolean)
            .join(' ');

          const embedding = await this.openAIService.getEmbedding(text);
          await this.recallRepository.update(product.recallSn, { embedding });
          success = true;

          const done = idx + 1;
          const percent = ((done / total) * 100).toFixed(1);
          const elapsed = (Date.now() - startTime) / 1000;
          const avgPerItem = elapsed / done;
          const remaining = Math.round(avgPerItem * (total - done));
          const remainingMin = Math.floor(remaining / 60);
          const remainingSec = remaining % 60;

          process.stdout.write(
            `\r[${done}/${total}] ${percent}% | 예상 남은 시간: ${remainingMin}분 ${remainingSec}초 | ${product.productNm.padEnd(80)}`,
          );
        } catch {
          retries += 1;
          process.stdout.write(
            `\r실패 (${retries}회): ${product.productNm}`.padEnd(80),
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    const totalSec = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write('\n');
    console.log(
      `임베딩 완료! 총 소요시간: ${Math.floor(totalSec / 60)}분 ${totalSec % 60}초`,
    );
  }

  async syncNewProductsToEs() {
    // 임베딩은 있는데 ES에 없는 것만 동기화
    const products = await this.recallRepository.find({
      where: { embedding: Not(IsNull()) },
    });

    let synced = 0;

    for (let i = 0; i < products.length; i += 1) {
      const product = products[i];
      // ES에 이미 있는지 확인
      const exists = await this.esService.exists({
        index: 'recall',
        id: product.recallSn,
      });

      if (exists) continue;
      console.log(`전체: ${products.length} 현재: ${i}`);

      await this.esService.index({
        index: 'recall',
        id: product.recallSn,
        document: {
          recallSn: product.recallSn,
          cntntsId: product.cntntsId,
          productNm: product.productNm,
          makr: product.makr,
          bsnmNm: product.bsnmNm,
          embedding: product.embedding,
        },
      });

      synced++;
    }

    console.log(`ES 동기화 완료: ${synced}개 추가`);
  }

  async findRecentRecall(take = 5) {
    return this.recallRepository.find({
      order: { recallSn: 'DESC' },
      take,
    });
  }

  async findPaginateRecall(dto: PaginateRecallDto) {
    const currentPage = dto.page ?? 1;

    const orderMap: Record<string, FindOptionsOrder<RecallModel>> = {
      createdAt_desc: { recallSn: 'DESC' },
      createdAt_asc: { recallSn: 'ASC' },
      name_asc: { productNm: 'ASC' },
      name_desc: { productNm: 'DESC' },
    };

    const parseDate = (d: string): string => {
      const [year, month, day] = d.split('-');
      return `20${year}-${month}-${day}`;
    };

    const buildWhere = (): FindOptionsWhere<RecallModel>[] => {
      const base = { cntntsId: dto.category };

      if (dto.startDate && dto.endDate) {
        return [
          {
            ...base,
            recallPublictBgnde: Between(
              parseDate(dto.startDate),
              parseDate(dto.endDate),
            ),
          },
          {
            ...base,
            recallPublictBgnde: IsNull(),
            recallPublictEndde: MoreThanOrEqual(parseDate(dto.startDate)),
          },
        ] as FindOptionsWhere<RecallModel>[];
      } else if (dto.startDate) {
        return [
          {
            ...base,
            recallPublictBgnde: MoreThanOrEqual(parseDate(dto.startDate)),
          },
          {
            ...base,
            recallPublictBgnde: IsNull(),
            recallPublictEndde: MoreThanOrEqual(parseDate(dto.startDate)),
          },
        ];
      } else if (dto.endDate) {
        return [
          {
            ...base,
            recallPublictBgnde: LessThanOrEqual(parseDate(dto.endDate)),
          },
          {
            ...base,
            recallPublictBgnde: IsNull(),
            recallPublictEndde: MoreThanOrEqual(parseDate(dto.endDate)),
          },
        ];
      }

      return [base];
    };

    const [data, total] = await this.recallRepository.findAndCount({
      where: buildWhere(),
      skip: dto.take * (currentPage - 1),
      take: dto.take,
      order: orderMap[dto.order],
    });

    return {
      data,
      total,
      page: currentPage,
      take: dto.take,
      totalPages: Math.ceil(total / dto.take),
      hasNext: currentPage * dto.take < total,
      hasPrev: currentPage > 1,
    };
  }
}
