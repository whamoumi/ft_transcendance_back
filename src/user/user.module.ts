import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { join } from '@prisma/client/runtime';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/auth/Strategy/jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './avatar',
    }),
    PassportModule.register({
			defaultStrategy: 'jwt',
			property: 'user',
			session: false
		}),
    JwtModule.register({
			secret: process.env.SECRET_JWT,
			signOptions: { expiresIn: '1d' },
		})
  ],
  controllers: [UserController],
  providers: [AuthService, UserService, PrismaService, JwtStrategy, {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
	}]
})
export class UserModule {}
