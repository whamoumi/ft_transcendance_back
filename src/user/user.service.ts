import { Body, Injectable } from '@nestjs/common';
import { UserDetails } from 'src/utils/types';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
		private prisma: PrismaService
    ){}

    async createMatch(body: any) {
      return await this.prisma.matchs.create({
        data:
        { id: body[2].Roomid, name: 'match'}
        ,
       // skipDuplicates: true,
      })
    }

    async updateForme(body: any, pre: any) {
      const forme = await this.prisma.user.update({
        where: {
          id: body
        },
        data:
        {ball: pre.forme}
        ,
       // skipDuplicates: true,
      })
      console.log()
    }

    async updateUserForm(body: any) {
		    let up;
		    up =  await this.prisma.user.update({
		  	where: {
		  		id: body,
		  	},
		  	data: {
		  		ball: "carre",
		  		}
		  	});
        return up.ball
      }

    async createPresets(body: any) {
      return await this.prisma.presets.create({
        data:
        { id: Date.now() , usersId: body, paddle1: "#ffff00", paddle2: "#ffffff", floor: "#172A3A", wall: "#EE4266", ball: "#ffffff"}
        ,
       // skipDuplicates: true,
      })
    }

    async updatePresets(body: any, pre: any) {
      const presets = await this.getUserPresets(body)
      console.log('ID', presets.presets[0].id)
      console.log('US ID', body)
      const colors = await this.prisma.presets.update({
        where: {
          id: presets.presets[0].id
        },
        data:
        { paddle1: pre.paddle1, paddle2: pre.paddle2, floor: pre.floor, wall: pre.wall, ball: pre.ball}
        ,
       // skipDuplicates: true,
      })
      console.log()
    }

    async getUserPicture(id: any) {
      const picture = await this.prisma.user.findFirst({
        where: {
          id: id
        },
      })
      if (picture)
        return picture
      else
        return null
    }

    async updateStatus(body: any, status: string) {
      const sta = await this.prisma.user.update({
        where: {
          id: body 
        },
        data:
        {status: status}
        ,
       // skipDuplicates: true,
      })
    }

   /* async updatePictureMatch(body: any, status: string) {
      const sta = await this.prisma.userMatchs.updateMany({
        where: {
          id: body 
        },
        data:
        {: status}
        ,
       // skipDuplicates: true,
      })
    }*/

     async updateUserPicture(id: number, picture: string) {
      const sta = await this.prisma.user.update({
        where: {
          id: id
        },
        data:
        {picture: picture}
      })
    }

    async getUserPresets(body: any) {
      const presets =  await this.prisma.user.findFirst({
        where: {
          id: body
       },
         include: {presets: true}
      })
      if (presets)
        return presets
      else
        return null
    }

    async assignMatchs(userId: number, matchId: number, advername: number, scoreuser: number, scoreadver: number, picture: string, adverId: number){
      const user = await this.findOne(advername)
      const name = await this.findOne(userId)
      return await this.prisma.userMatchs.create({
        data:
        { id: Date.now(), userId: userId, matchsId: matchId, Advername: user.username, Username: name.username, scoreUser: scoreuser, scoreAdver: scoreadver, AdverPicture: picture, AdverId: adverId},
        //skipDuplicates: true,
      })
    }

    async isOwner(body: any) {
      const save =  await this.prisma.channels.findFirst({
      where: {
        id: body.idRoom 
        },
        include: {owner: {include: {channel: true}}}
      })
      if (save)
        return save
      return null
    }   

    async isOwnerUserChannel(id: any, name:string) {
      console.log('IS OWNER BY CHANNEL => ', id, name)
      const save =  await this.prisma.userChannels.findFirst({
      where: {
        userId: id, name: name
        },
      })
      console.log('IS OWNER BY CHANNEL save => ', save)
      if (save)
        return save
      return null
    }   

     async isAdmin(body: any, id) {
      const save =  await this.prisma.admin.findMany({})
      const item = save.map(item => item.userId).indexOf(id)
      if (item >= 0)
        return item
      return null
    }   

    async createchannel(body: any) {
      let save;
      if (body.password)
      {
        const salt = await bcrypt.genSalt();
        const password = body.password;
        const hash = await bcrypt.hash(password, salt);
        save = await this.prisma.channels.createMany({
          data:[
          { id: body.id, name: body.name, type: body.type, password: hash},
          ],
          skipDuplicates: true,
        })
      }
      else
      {
          save = await this.prisma.channels.createMany({
          data:[
          { id: body.id, name: body.name, type: body.type, password: body.password},
          ],
          skipDuplicates: true,
        })
      }
      if (save)
        return save
      return null
    }

    async createDm(body: any) {
      const save = await this.prisma.dM.createMany({
      data:[
        { id: body.id, name: body.oppoUsername},
        ],
        skipDuplicates: true,
      })
    }

    async updateUserDm(body: any) {
      return await this.prisma.userDM.updateMany({
        where: {
        userId: body.userId
        },
        data:
          { joined: true},
      })
    }  

    async assignBlocked(body: any) {
      const user = await this.getUserByNameJson(body.username)
      return await this.prisma.blocked.create({
        data:
          { id: Date.now(), usersId: body.userId, name: body.username, idUser: user},
      })
    } 

    async assignFriends(body: any) {
      const user = await this.getUserByNameJson(body.username)
      return await this.prisma.friends.create({
        data:
          { id: Date.now(), usersId: body.userId, name: body.username, idUser: user, status: 'online'},
      })
    } 

    async assignDmAtCrea(body: any, id: number, name: string, dmid: number) {
      return await this.prisma.userDM.create({
        data:
          { id: Date.now(), userId: id, dmId: dmid, name: name, joined: false},
      })
    } 

    async assignDmessages(body: any, name: string, text: string) {
      const save = await this.getUserDm(body.userId)
      return await this.prisma.dMessages.create({
        data:
        { id: Date.now(), dmId: body.idDm, userId: body.userId, name: name, text: text},
      })
    }

    async deletechannel(body: any) {
      const save = await this.prisma.userChannels.deleteMany({
        where: {
         channelsId: body.idChannel, userId: body.userId
        },
      })

      if (save)
        return save
      return null
    }

    async deleteblocked(body: any) {
      console.log('DELETE =>', body)
      const save = await this.prisma.blocked.deleteMany({
        where: {
          usersId: body.userId, name: body.username, idUser: body.userOppoId
        },
      })
      if (save)
        return save
      return null
    }

    async deleteFriends(body: any) {
      const save = await this.prisma.friends.deleteMany({
        where: {
          usersId: body.userId, name: body.userOppo
        },
      })
      if (save)
        return save
      return null
    }

    async assignchannel(body: any, client) {
      return await this.prisma.userChannels.createMany({
        data:[
        { id: Date.now(), userId: body.userId, socketId: 'null', channelsId: body.idRoom, name: body.room, admin: false, owner: false, ban: false, mute: false, timeofban: 0, timeofmute: 0, durationofmute: 0, durationofban: 0, joined: true, kick: false}
        ],
        skipDuplicates: true,
      })
    }

    async assignChannelAtCreation(body: any, client: any) {
      return await this.prisma.userChannels.create({
        data:
        { id: Date.now(), userId: body.userId, socketId: 'null', channelsId: body.id, name: body.name, admin: true, owner: true, ban: false, mute: false, timeofban: 0, timeofmute: 0, durationofmute: 0, durationofban: 0, joined: true, kick: false}
        ,
      })
    }  

    async assignInvite(body: any, id) {
      return await this.prisma.invited.createMany({
        data:[
        { id: Date.now(), userId: id, channelId: body.currentIdChannel, name: body.name}
        ],
        skipDuplicates: true,
      })
    }
    /*async assignChannel(body: any) {
      return await this.prisma.userChannels.create({
        data:
        { id: Date.now(), userId: body.userId, channelsId: body.idRoom, name: body.name, admin: false, owner: false, ban: false, mute: false}
        ,
      })
    } */     

    async assignmessage(body: any, name: string, text: string) {
      const save = await this.getUserChannel(body.userId)
      console.log('SAVE MESSAGES => ', save)
      const item = save[0].channels.map(item => item.joined).indexOf(true)
      console.log('ITEM USER SERVICE =>', item)
      return await this.prisma.messages.create({
        data:
        { id: Date.now(), channelId: save[0].channels[item].channelsId, name: name, text: text},
      })
    }

    async assignAdmin(body: any, user: any) {
      return await this.prisma.admin.create({
        data:
        { id: Date.now(), channelId: body.currentIdChannel, userId: user},
      })
    }

    async assignOwner(body: any) {
      const save = await this.getUserChannel(body.userId)
      return await this.prisma.owner.create({
        data:
        { id: Date.now(), channelId: body.id, userId: body.userId},
      })
    }

    async getAllChannels() {
      const chan = await this.prisma.channels.findMany({})
      if (chan)
        return chan
      return null
    }

    async getSecretChannels() {
      const chan = await this.prisma.channels.findMany({
        where: {
          type: 'secret'
        },
        include: {owner: true, invite: true}
      })
      if (chan)
        return chan
      return null
    }

    async getAllDmByUser(id: any) {
      const chan = await this.prisma.user.findMany({
      where: {
        id: +id.id
      },
      include: {DM: {include: {DM: true}}}
      })
      if (chan)
        return chan
      return null
    }

    async getAllFriendsByUser(id: any) {
      const chan = await this.prisma.user.findMany({
      where: {
        id: id
      },
      include: {friends: true}
      })
      console.log(chan[0].friends)
      if (chan)
        return chan[0].friends
      return null
    }

    async getAllBlockedByUser(id: any) {
      const chan = await this.prisma.user.findMany({
      where: {
        id: id
      },
      include: {bloque: true}
      })
      if (chan)
        return chan[0].bloque
      return null
    }

    async getUserDmToSend(id: any) {
      const chan = await this.prisma.user.findMany({
      where: {
        id: +id.id
      },
      include: {DM: {include: {DM: true}}}
      })
      if (chan)
        return chan[0].DM
      return null
    }

    async getChannelsByType(type: string) {
      return await this.prisma.channels.findMany({
        where: {
          type: type
        }
      }) 
    }

    async getChannelsById(id: number) {
      return await this.prisma.channels.findMany({
        where: {
          id: +id
        }
      }) 
    }

     async getChannelsByName(type: string) {
      return await this.prisma.channels.findUnique({
        where: {
          name: type
        }
      }) 
    }

    async getUserByChannel(id: number) {
      return await this.prisma.channels.findMany({
        where: {
          id: id
        },
        include: {members: {include: {channels: true}}},
      }) 
    }

    async getUserChannel(id: number) {
      return await this.prisma.user.findMany({
        where: {
          id: id
        },
        include: {channels: {include: {channels: true}}},
      }) 
    }

    async getUserDm(id: number) {
      return await this.prisma.user.findMany({
        where: {
          id: id
        },
        include: {DM: {include: {DM: true}}},
      }) 
    }

    async getUserByName(name) {
      const save =  await this.prisma.user.findMany({
        where: {
          username: name.name
        },
        select: {
          id: true,
        },
      }) 
     if (save[0] != undefined)
        return +save[0].id
      return null
    }

    async getUserByNameJson(name) {
      const save =  await this.prisma.user.findMany({
        where: {
          username: name
        },
        select: {
          id: true,
        },
      }) 
      if (save[0] != undefined)
        return +save[0].id
      return null
    }

     async getAllMessagesByChannelId(id: number) {
      const chan = await this.prisma.messages.findMany({
        where:{
          channelId: id, 
          }
      })
      if (chan)
        return chan
      return null
    }

      async getAllMessagesByDm(id: number) {
      const chan = await this.prisma.dMessages.findMany({
        where:{
          dmId: id, 
          }
      })
      if (chan)
        return chan
      return null
    }

      async deleteDm(dm: any)
      {
        const up =  await this.prisma.userDM.deleteMany({
				where: {
					  dmId: dm.id,
				  },
		    });
        if (up != undefined)
          return up
        else
          return null
      }


      async deleteDmTable(dm: any)
      {
        const up =  await this.prisma.dM.deleteMany({
				where: {
					  id: dm.id,
				  },
		    });
        if (up != undefined)
          return up
        else
          return null
      }

    async getMatchsByUser(id : number) {
      const user = await this.prisma.user.findMany({
      where: {
          id : id
      },
      include: {matchs: {include: {matchs: true}}},
      })
      /*const opo = await this.prisma.user.findUnique({
        where: {
          id: user[0].matchs[0].oposant
        },
        include: {matchs: {include: {matchs: true}}},
      })*/
	  if (user[0] != undefined)
      	return (user[0].matchs)
	return null
    }

    async findOne(id: number){
         return await this.prisma.user.findUnique({
	 		where: {
	 			id
	 		}
	 	});
       }

      async getRightsByUserChannel(id: number)
      {
        const save = await this.prisma.user.findUnique({
          where: {
            id: id 
          },
          include: {channels: {include: {channels: true}}}
        })
        if (save != undefined)
          return save
        return null
      }

       async completed(id: number) {
        const save = await this.prisma.user.findUnique({
	 		  where: {
	 			  id: id
	 		    }
	 	    });
        if (save.username == undefined)
          return false
        return true
      }

      async updateUserVictory(body: any) {
		    let up;
		    up =  await this.prisma.user.update({
		  	where: {
		  		id: body[2].win,
		  	},
		  	data: {
		  		winning: {increment: 1},
		  		}
		  	});
      }

      async updateUserExp(body: any) {
		    let up;
        if (body[2].win === body[0].userId)
        {
		      up =  await this.prisma.user.update({
		  	  where: {
		  	  	id: body[0].userId,
		  	  },
		  	  data: {
		  	  	exp: {increment: 3},
		  	  	}
		  	  });
        }
        if (body[2].win === body[1].userId)
        {
		      up =  await this.prisma.user.update({
		  	  where: {
		  	  	id: body[1].userId,
		  	  },
		  	  data: {
		  	  	exp: {increment: 3},
		  	  	}
		  	  });
        }
        if (body[2].loose === body[0].userId)
        {
		      up =  await this.prisma.user.update({
		  	  where: {
		  	  	id: body[0].userId,
		  	  },
		  	  data: {
		  	  	exp: {increment: 2},
		  	  	}
		  	  });
        }
        if (body[2].loose === body[1].userId)
        {
		      up =  await this.prisma.user.update({
		  	  where: {
		  	  	id: body[1].userId,
		  	  },
		  	  data: {
		  	  	exp: {increment: 2},
		  	  	}
		  	  });
        }
      }

      async getUserLevel(id: number)
      {
        const user = await this.findOne(id)
        let level = user.exp / 10
        return level
      }

      async updateUserLose(body: any) {
		    let up;
		    up =  await this.prisma.user.update({
		  	where: {
		  		id: body[2].loose,
		  	},
		  	data: {
		  		losing: {increment: 1},
		  		}
		  	});
      }

     async updateUser(id: number, userdetails: UserDetails, picture: string) {
		    let up;
		    if (picture)
		    {
		    	up =  await this.prisma.user.update({
		  		where: {
		  			id: id,
		  		},
		  		data: {
		  			username: userdetails.username,
		  			picture: picture,
		  		}
		  	});
		  }
		  else
		  {
		  	up =  await this.prisma.user.update({
		  		where: {
		  			id: id,
		  		},
		  		data: {
		  			username: userdetails.username
		  		}
		  	});
		  }
		
            return up;
       }

      async updateUserRights(id: number) {
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: id,
				  },
				  data: {
            admin: true,
				  }
			  });
        return up;
		  }

      async updateUserOwner(id: number, name: string) {
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: id, name: name
				  },
				  data: {
            owner: true,
				  }
			  });
        return up;
		  }

      async deleteUserRights(id: number) {
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: id,
				  },
				  data: {
            admin: false,
				  }
			  });
        return up;
		  }

      async deleteFromAdminTable(id: number) {
			  const up =  await this.prisma.admin.deleteMany({
				  where: {
				  	userId: id,
				  },
			  });
        return up;
		  }

    async updateUserBan(body: any) {
        const save = await this.getUserByNameJson(body.username);
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: save, name: body.room
				  },
				  data: {
            ban: true,
            timeofban: body.time,
            durationofban: +body.timeBan
				  }
			  });
        if (up != undefined)
        {
          return {up: up,
                save: save};
        }
        else
          return null
		  }

    async updateUserJoined(body: any, info: boolean, room: string) {
        console.log('JOINED FALSE => ', body, info, room)
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: body, name: room
				  },
				  data: {
           joined: info 
				  }
			  });
        return up;
		  }

    async updateUserDmJoined(body: any, info: boolean, room: string) {
			  const up =  await this.prisma.userDM.updateMany({
				  where: {
				  	userId: body.userId, name: room
				  },
				  data: {
           joined: info 
				  }
			  });
        return up;
		  }

    async updateUserMute(body: any) {
        const save = await this.getUserByNameJson(body.username);
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: save,
				  },
				  data: {
            mute: true,
            timeofmute: body.time,
            durationofmute: +body.timeMute
				  }
			  });
        return up;
		  }

    async updateUserKick(body: any, kick: boolean) {
        const save = await this.getUserByNameJson(body.username);
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: save,
				  },
				  data: {
            kick: kick 
				  }
			  });
        return up;
		  }

    async updateUserKickId(body: any, kick: boolean) {
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: body.userId,
				  },
				  data: {
            kick: kick 
				  }
			  });
        return up;
		  }

    async deleteUserMute(id: any) {
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: id,
				  },
				  data: {
            mute: false,
            timeofmute: 0,
            durationofmute: 0
				  }
			  });
        return up;
		  }

      async updateSocketId(body: any, id) {
			  const up =  await this.prisma.userChannels.updateMany({
				  where: {
				  	userId: body.userId,
				  },
				  data: {
           socketId: id 
				  }
			  });
        return up;
		  }

       async updateSocketIdInUserTable(body: any, id) {
			  const up =  await this.prisma.user.updateMany({
				  where: {
				  	id: body.userId,
				  },
				  data: {
           socketId: id 
				  }
			  });
        return up;
		  }

    async updateChannelMdpAndType(body: any, hash) {
			  const up =  await this.prisma.channels.updateMany({
				  where: {
				  	id: body.channelId,
				  },
				  data: {
           password: hash, 
           type: body.type 
				  }
			  });
        return up;
		  }

     async deleteUser(id: number) {
         return this.prisma.user.delete({
	 		where: {
	 			id
	 		}
	 	});
       }

    async getUser(id: number) {
         return this.prisma.user.findFirst({
	 		where: {
	 			id: id
	 		}
	 	});
       }
}

