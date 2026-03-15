import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as cheerio from 'cheerio';
import { Consumer24Service } from './consumer24.service';

export interface RecallNewsItem {
  title: string;
  thumbnailUrl: string;
  linkUrl: string;
  date: string;
}

@Injectable()
export class RecallNewsCrawler {
  private readonly logger = new Logger(RecallNewsCrawler.name);
  private readonly BASE_URL = 'https://www.consumer.go.kr';
  private readonly LIST_URL = `${this.BASE_URL}/user/ftc/consumer/recallnews/801/selectRecallNewsList.do`;

  constructor(private readonly consumer24Service: Consumer24Service) {}

  @Cron('0 */3 * * *')
  async crawl() {
    try {
      const res = await fetch(`${this.LIST_URL}?page=1&row=5`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const items: RecallNewsItem[] = [];

      $('tbody tr').each((_, el) => {
        const anchor = $(el).find('td.img a');
        const img = $(el).find('td.img img');
        const date = $(el).find('td.m-hide').last().text().trim();

        const href = anchor.attr('href') ?? '';
        const src = img.attr('src') ?? '';
        const title = img.attr('alt')?.trim() ?? '';

        if (!href || !title) return;

        items.push({
          title,
          thumbnailUrl: src.startsWith('http') ? src : `${this.BASE_URL}${src}`,
          linkUrl: `${this.BASE_URL}${href}`,
          date,
        });
      });

      await this.consumer24Service.upsertRecallNews(items);
      this.logger.log(`리콜뉴스 ${items.length}건 수집 완료`);
    } catch (err) {
      this.logger.error('리콜뉴스 크롤링 실패', err);
    }
  }
}
