FROM node:19.8.1-alpine3.16

COPY . .

RUN npm i -g pnpm
RUN pnpm install --frozen-lockfile


RUN pnpm build

EXPOSE 3000
ENTRYPOINT ["pnpm", "start"]
