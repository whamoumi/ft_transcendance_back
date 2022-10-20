import { Injectable, UnauthorizedException, Body, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDetails } from 'src/utils/types';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateSecret, verify } from '2fa-util'
import { AnyRecordWithTtl } from 'dns';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';


@Injectable()
export class AuthService {
  constructor( 
    private jwtService: JwtService,
	private prisma: PrismaService
	) {}


// Methodes du services Auth


  async validationUser(details: UserDetails) {
    const {id} = details;

    const user = await this.prisma.user.findUnique({
		where: {
			id
		}
	})

    if (user)
      return user;

    await this.createUser(details);
	return null
  };


  async createUser(details: UserDetails) {
    delete details["email"]
    //delete details["username"]
    delete details["profile_completed"]
    await this.prisma.user.create({
		data: {
      ...details
		}
	});
  };

  // lors du login creation d'un token JWT en encapsulant l'id du user.
  // Puis stockage du token dans un cookie

  async jwtGeneration(user: any, tfa:boolean) {
    const payload = { sub: user.id, tfa: tfa};
    const jwt_token= this.jwtService.sign(payload);
    if (!jwt_token) {
      throw new UnauthorizedException();
  }
    return jwt_token;
  }

  async findUserByIdDb(id: number) {
    const user = await this.prisma.user.findUnique({
		where: {
			id
		}
	});
    if (user)
      return user;
    return false;
  };

  async send(query: string) {
    const payload = {
      "grant_type": "authorization_code",
      "client_id": process.env.CLIENT_ID,
      "client_secret": process.env.CLIENT_SECRET,
      "code": query,
      'redirect_uri': process.env.REDIRECT_URI
    };

    //requete post a l'API 42 avec le code de validation et récupérer l'access_token
    const url= "https://api.intra.42.fr/oauth/token";
    const res = await axios.post(url, payload);
    const token = res.data.access_token;

    // requete get pour récupérer les infos du user dans l'API 42

    const url2= "https://api.intra.42.fr/v2/me";
    const save = await axios.get(url2, { 
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { id, login, email, image_url } = save.data;
    let user = {
    	id: id,
    	username: login,
      	picture: image_url,
	  	profile_completed: false,
	  	isTwoFactorEnabled: false,
		level: 0,
		exp: 0,
		winning: 0,
		losing: 0,
    }
    let response = await this.validationUser(user);
	if (response)
	{
		user.username = response.username
		user.picture = response.picture
		user['profile_completed'] = true
		user['twofa_enabled'] = response.isTwoFactorEnabled 
	}
	else
	{
		user['username'] = login
		user['profile_completed'] = false
		user['twofa_enabled'] = false 
	}
    return user;
  }

	async findOne(id: number){
         return await this.prisma.user.findUnique({
	 		where: {
	 			id
	 		}
	 	});
       }

	async twoFactorCreate(id: number) {
		 const token = await generateSecret('sucemachatte', 'TRANS');
		// const iv = randomBytes(16);
		// const password = 'Password used to generate key';

		// 	// The key length is dependent on the algorithm.
		// // In this case for aes256, it is 32 bytes.
		// const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
		// const cipher = createCipheriv('aes-256-ctr', key, iv);

		// const textToEncrypt = token.qrcode;
		// const encryptedText = Buffer.concat([
		// cipher.update(textToEncrypt),
		// cipher.final(),
		// ]);
		// let res = encryptedText
		// console.log('ENCRYPTE', textToEncrypt)
		await this.prisma.user.update({
			where: {
				id
			},
			data: {
				twoFactorSecret: token.secret,
				isTwoFactorEnabled: true,
				qrcode: token.qrcode
			}
		})
		return { qrcode: token.qrcode }
	}

	async twoFactorRemove(id: number) {
		await this.prisma.user.update({
			where: {
				id
			},
			data: {
				twoFactorSecret: null,
				isTwoFactorEnabled: false
			}
		})
		return { msg: "two factor removed" }
	}

	async twoFactorVerify(@Body() body) {
		const user = await this.prisma.user.findUnique({
			where: {
				id: parseInt(body.id)
			},
			select: {
				twoFactorSecret: true
			}
		})
		const isValid = await verify(body.password, user.twoFactorSecret)
		const save = await this.prisma.user.findUnique({
			where: {
				id: parseInt(body.id)
			},
		})
		if (isValid)
			return save;
		else 
			return null;
	}
}