import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './Strategy/jwt.strategy';
import { twofaStrategy } from './Strategy/twofa.strategy';

@Module({
  controllers: [AuthController],
  providers: [UserService, twofaStrategy,
    JwtStrategy,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
	}, PrismaService
],
  imports: [
		PrismaModule, 
		PassportModule,
		UserModule,
		HttpModule,
		PassportModule.register({
			defaultStrategy: 'jwt',
			property: 'user',
			session: false
		}),
		JwtModule.register({
			secret: process.env.SECRET_JWT,
			signOptions: { expiresIn: '1d' },
		})
	]
})
export class AuthModule {}
