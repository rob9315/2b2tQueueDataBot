FROM node:alpine
WORKDIR /svr/app
COPY . /svr/app/
RUN yarn -D && yarn build
CMD node lib/index.js
