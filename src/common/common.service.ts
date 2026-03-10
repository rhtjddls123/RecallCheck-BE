import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommonService {
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      forcePathStyle: true,
      region: configService.get('SUPABASE_REGION')!,
      endpoint: `${configService.get('SUPABASE_URL')}/storage/v1/s3`,
      credentials: {
        accessKeyId: configService.get('SUPABASE_ACCESS_KEY_ID')!,
        secretAccessKey: configService.get('SUPABASE_SECRET_ACCESS_KEY')!,
      },
    });
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const path = `${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.configService.get('SUPABASE_BUCKET'),
      Key: path,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);

    return `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/${this.configService.get('SUPABASE_BUCKET')}/${path}`;
  }
}
