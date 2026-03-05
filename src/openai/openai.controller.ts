import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Get('correct-typo')
  async getCorrectTypo(@Query('query') query: string) {
    return this.openaiService.correctTypo(query);
  }

  @Post('image-ocr')
  @UseInterceptors(FileInterceptor('image'))
  async getImageInfo(@UploadedFile() file: Express.Multer.File) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        found: false,
        message: 'jpeg, png, gif, webp, heic 형식만 지원합니다.',
        query: null,
      };
    }

    let buffer: Buffer = Buffer.from(file.buffer);
    let mimetype = file.mimetype;

    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
      buffer = await sharp(Uint8Array.from(file.buffer)).jpeg().toBuffer();
      mimetype = 'image/jpeg';
    }

    const imageBase64 = buffer.toString('base64');
    const { query } = await this.openaiService.extractProductInfo(
      imageBase64,
      mimetype,
    );

    if (!query) {
      return {
        found: false,
        message: '이미지에서 제품 정보를 찾을 수 없습니다.',
        query: null,
      };
    }

    return {
      found: true,
      message: '이미지에서 제품 정보를 불러왔습니다.',
      query,
    };
  }
}
