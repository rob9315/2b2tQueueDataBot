FROM node:alpine
WORKDIR /svr/app
COPY . /srv/app
RUN yarn
CMD node lib/index.js