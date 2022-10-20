FROM node:lts-alpine

WORKDIR /usr/app
COPY package*.json ./

RUN npm install --legacy-peer-deps --only=prod
RUN npm install @nestjs/cli

COPY . .

RUN npm run prebuild
RUN npm run build
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:prod"]