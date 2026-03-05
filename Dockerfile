FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# 빌드 후 dev 패키지 정리
RUN yarn install --production

CMD ["node", "dist/main.js"]