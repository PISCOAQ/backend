# base
FROM node:24.13-alpine3.23 AS base

WORKDIR /backend

COPY package*.json ./
    
RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENTRYPOINT ["npm","start"]
