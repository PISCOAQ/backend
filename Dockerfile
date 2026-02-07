# base
FROM node:24.13-alpine3.23 AS base

WORKDIR /backend

COPY . .
    
RUN npm ci

EXPOSE 5000

CMD ["npm","start"]
