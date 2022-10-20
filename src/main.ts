import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.enableCors(
  {
      origin: ['http://localhost:8080'],
      methods: ['POST', 'PUT', 'DELETE', 'GET']
  })
  app.use(helmet.noSniff());
  app.use(helmet.contentSecurityPolicy());
  app.use(helmet.xssFilter());
  //app.use(csurf());
  //app.use(helmet());
  /*app.use(helmet.contentSecurityPolicy());
  app.use(helmet.crossOriginEmbedderPolicy());
  app.use(helmet.crossOriginOpenerPolicy());
  app.use(helmet.crossOriginResourcePolicy());
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.expectCt());
  app.use(helmet.frameguard());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.originAgentCluster());
  app.use(helmet.permittedCrossDomainPolicies());
  app.use(helmet.referrerPolicy());
  app.use(helmet.xssFilter());*/

  await app.listen(configService.get('APP_PORT'));
}
bootstrap(
  
);

