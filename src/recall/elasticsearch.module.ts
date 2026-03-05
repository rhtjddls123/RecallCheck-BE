import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientOptions } from '@elastic/elasticsearch';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ClientOptions => {
        const config: ClientOptions = {
          node: configService.get<string>('ELASTICSEARCH_NODE'),
        };

        const username = configService.get<string>('ELASTICSEARCH_USERNAME');
        const password = configService.get<string>('ELASTICSEARCH_PASSWORD');

        if (username && password) {
          config.auth = { username, password };
        }

        return config;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [ElasticsearchModule],
})
export class EsModule {}
