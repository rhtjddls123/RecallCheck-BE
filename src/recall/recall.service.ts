import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RecallModel } from './entity/recall.entity';
import {
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { PaginateRecallDto } from './dto/paginate-recall.dto';
import { OpenAIService } from './openai.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class RecallService {
  constructor(
    @InjectRepository(RecallModel)
    private readonly recallRepository: Repository<RecallModel>,
    private openAIService: OpenAIService,
    private esService: ElasticsearchService,
  ) {}

  // OpenAI 오타 보정
  async correctQuery(query: string) {
    const response = await this.openAIService.correctTypo(query);
    return { isSame: query === response, corrected: response };
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
