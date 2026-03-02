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

@Injectable()
export class RecallService {
  constructor(
    @InjectRepository(RecallModel)
    private readonly recallRepository: Repository<RecallModel>,
  ) {}

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
