import { Injectable, NotFoundException } from '@nestjs/common';
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
import { UserService } from 'src/auth/user.service';
import { UserModel } from 'src/auth/entity/user.entity';
import { LogTypeEnum } from 'src/auth/const/log-type.const';
import { estypes } from '@elastic/elasticsearch';

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
    private readonly openAIService: OpenAIService,
    private readonly esService: ElasticsearchService,
    private readonly userService: UserService,
  ) {}

  async findRecallDetail(recallSn: string, userId?: number) {
    const item = await this.recallRepository.findOne({ where: { recallSn } });

    if (!item) {
      throw new NotFoundException('제품을 찾을 수 없습니다.');
    }
    let user: UserModel | null = null;

    if (userId) user = await this.userService.getUserById(userId);

    if (user) {
      await this.userService.addUserLog(user, LogTypeEnum.VIEW, {
        productNm: item.productNm,
        makr: item.makr || item.bsnmNm,
        imageUrl: item.recallImgUrls?.[0],
        targetUrl: `${process.env.FRONTEND_URL}/recall/${recallSn}`,
      });
    }
    return item;
  }

  async chatbotSearchWithLogSave(
    query: string,
    categoryId?: RECALL_CATEGORY_KEY_TYPE,
    userId?: number,
    path?: string,
  ) {
    const searchResult = await this.chatbotSearch(query, categoryId);

    if (userId && path) {
      const user = await this.userService.getUserById(userId);
      if (user && searchResult.data.targetUrl) {
        await this.userService.addUserLog(user, LogTypeEnum.IMG, {
          imageUrl: path,
          targetUrl: searchResult.data.targetUrl,
        });
      }
    }
    return searchResult;
  }

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

    return {
      found: false,
      data: { products: [], count: 0, targetUrl: null },
      differentCategory: false,
    };
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

    return {
      products: sorted,
      count: countResult.count,
      targetUrl:
        countResult.count > 0
          ? `${process.env.FRONTEND_URL}/recall/chatbot-search?query=${encodeURIComponent(query)}${categoryId ? `&category=${categoryId}` : ''}&page=1`
          : null,
    };
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
    const BATCH_SIZE = 50; // embedding 1536차원이라 작게
    console.log(`동기화 대상: ${total}개`);

    const startTime = Date.now();
    let done = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      const operations = batch.flatMap((product) => [
        { index: { _index: 'recall', _id: product.recallSn } },
        {
          recallSn: product.recallSn,
          cntntsId: product.cntntsId,
          productNm: product.productNm,
          makr: product.makr,
          bsnmNm: product.bsnmNm,
          recallPublictBgnde: product.recallPublictBgnde ?? null,
          recallPublictEndde: product.recallPublictEndde ?? null,
          embedding: product.embedding,
        },
      ]);

      const result = await this.esService.bulk({ operations, refresh: false });

      if (result.errors) {
        const failed = result.items.filter((item) => item.index?.error);
        failed.forEach((item) =>
          console.error(`\n실패: ${item.index?._id}`, item.index?.error),
        );
      }

      done += batch.length;
      const percent = ((done / total) * 100).toFixed(1);
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.round((elapsed / done) * (total - done));
      process.stdout.write(
        `\r[${done}/${total}] ${percent}% | 예상 남은 시간: ${Math.floor(remaining / 60)}분 ${remaining % 60}초`,
      );
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
      await this.esService.indices.delete({ index: 'recall' }); // 기존 삭제
      console.log('기존 인덱스 삭제');
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
            fields: {
              keyword: { type: 'keyword' },
            },
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
          recallPublictBgnde: {
            type: 'date',
            format:
              'yyyy-MM-dd||yyyy-MM-dd HH:mm:ss||strict_date_optional_time',
          },
          recallPublictEndde: {
            type: 'date',
            format:
              'yyyy-MM-dd||yyyy-MM-dd HH:mm:ss||strict_date_optional_time',
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

  async findPaginateRecall(dto: PaginateRecallDto, userId?: number) {
    const currentPage = dto.page ?? 1;

    const parseDate = (d: string): string => {
      const [year, month, day] = d.split('-');
      return `20${year}-${month}-${day}`;
    };

    const esSortMap: Record<
      string,
      Record<string, { order: 'asc' | 'desc' }>
    > = {
      createdAt_desc: { recallSn: { order: 'desc' } },
      createdAt_asc: { recallSn: { order: 'asc' } },
      name_asc: { 'productNm.keyword': { order: 'asc' } },
      name_desc: { 'productNm.keyword': { order: 'desc' } },
    };

    if (dto.query) {
      const mustConditions: estypes.QueryDslQueryContainer[] = [];

      if (dto.category) {
        mustConditions.push({ term: { cntntsId: dto.category } });
      }

      // 날짜 필터
      const dateConditions = (() => {
        if (dto.startDate && dto.endDate) {
          return {
            should: [
              {
                range: {
                  recallPublictBgnde: {
                    gte: parseDate(dto.startDate),
                    lte: parseDate(dto.endDate),
                  },
                },
              },
              {
                bool: {
                  must: [
                    {
                      bool: {
                        must_not: { exists: { field: 'recallPublictBgnde' } },
                      },
                    },
                    {
                      range: {
                        recallPublictEndde: { gte: parseDate(dto.startDate) },
                      },
                    },
                  ],
                },
              },
            ],
            minimum_should_match: 1,
          };
        } else if (dto.startDate) {
          return {
            should: [
              {
                range: {
                  recallPublictBgnde: { gte: parseDate(dto.startDate) },
                },
              },
              {
                bool: {
                  must: [
                    {
                      bool: {
                        must_not: { exists: { field: 'recallPublictBgnde' } },
                      },
                    },
                    {
                      range: {
                        recallPublictEndde: { gte: parseDate(dto.startDate) },
                      },
                    },
                  ],
                },
              },
            ],
            minimum_should_match: 1,
          };
        } else if (dto.endDate) {
          return {
            should: [
              {
                range: { recallPublictBgnde: { lte: parseDate(dto.endDate) } },
              },
              {
                bool: {
                  must: [
                    {
                      bool: {
                        must_not: { exists: { field: 'recallPublictBgnde' } },
                      },
                    },
                    {
                      range: {
                        recallPublictEndde: { gte: parseDate(dto.endDate) },
                      },
                    },
                  ],
                },
              },
            ],
            minimum_should_match: 1,
          };
        }
        return null;
      })();

      const esQuery = {
        bool: {
          must: [
            ...mustConditions,
            ...(dateConditions ? [{ bool: dateConditions }] : []),
          ],
          should: [
            { match_phrase: { productNm: { query: dto.query, boost: 3 } } },
            { match_phrase: { makr: { query: dto.query, boost: 1 } } },
            { match_phrase: { bsnmNm: { query: dto.query, boost: 1 } } },
          ],
          minimum_should_match: 1,
        },
      };

      const esSort = dto.order ? [esSortMap[dto.order]] : undefined;

      let user: UserModel | null = null;
      if (userId) user = await this.userService.getUserById(userId);
      if (user)
        await this.userService.addUserLog(user, LogTypeEnum.SEARCH, {
          keyword: dto.query,
          targetUrl: `${process.env.FRONTEND_URL}${this.buildTargetUrl(dto)}`,
        });

      const [countResult, searchResult] = await Promise.all([
        this.esService.count({ index: 'recall', query: esQuery }),
        this.esService.search<RecallEsDocument>({
          index: 'recall',
          from: dto.take * (currentPage - 1),
          size: dto.take,
          query: esQuery,
          ...(esSort && { sort: esSort }),
        }),
      ]);

      const total = countResult.count;
      const hits = searchResult.hits.hits;

      if (!hits.length) {
        return {
          data: [],
          total: 0,
          page: currentPage,
          take: dto.take,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        };
      }

      const recallSns = hits.map((h) => h._source?.recallSn as string);
      const dbData = await this.recallRepository.find({
        where: { recallSn: In(recallSns) },
      });

      // ES 점수 순서 유지 (name 정렬 아닐 때)
      const isNameSort = dto.order?.startsWith('name');
      const data = isNameSort
        ? dbData
        : recallSns
            .map((sn) => dbData.find((p) => p.recallSn === sn))
            .filter((p): p is RecallModel => p !== undefined);

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

    // query 없을 때: 기존 DB 페이지네이션
    const orderMap: Record<string, FindOptionsOrder<RecallModel>> = {
      createdAt_desc: { recallSn: 'DESC' },
      createdAt_asc: { recallSn: 'ASC' },
      name_asc: { productNm: 'ASC' },
      name_desc: { productNm: 'DESC' },
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
        ];
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

    const order = orderMap[dto.order || 'createdAt_desc'] ?? {
      recallSn: 'DESC',
    };
    const [data, total] = await this.recallRepository.findAndCount({
      where: buildWhere(),
      skip: dto.take * (currentPage - 1),
      take: dto.take,
      order,
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

  private buildTargetUrl(dto: PaginateRecallDto): string {
    const params = new URLSearchParams();

    if (dto.query) params.set('query', dto.query);
    if (dto.category) params.set('category', dto.category);
    if (dto.startDate) params.set('startDate', dto.startDate);
    if (dto.endDate) params.set('endDate', dto.endDate);
    if (dto.order) params.set('order', dto.order);
    if (dto.page) params.set('page', dto.page.toString());

    return `/recall?${params.toString()}`;
  }
}
