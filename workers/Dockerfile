FROM node:14.13.0-stretch-slim

RUN mkdir -p /app
COPY ./package.json /app/package.json
RUN cd /app && npm install --production
ENV NODE_PATH=/app/node_modules

COPY ./server.js /app/server.js

ENTRYPOINT ["node", "/app/server.js"]
