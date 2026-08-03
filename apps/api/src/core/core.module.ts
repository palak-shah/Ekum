import { randomUUID } from 'node:crypto';
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { validateEnv, type Env } from './config/config.schema';
import { PrismaService } from './prisma/prisma.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

/**
 * Shared infrastructure: typed/validated config, structured logging with a
 * request correlation id, the Prisma client, and the global error filter.
 * Every other module depends only on this.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    EventEmitterModule.forRoot(),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get('NODE_ENV', { infer: true }) === 'production' ? 'info' : 'debug',
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const existing = req.headers['x-request-id'];
            const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          transport:
            config.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
  ],
  providers: [PrismaService, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [PrismaService],
})
export class CoreModule {}
