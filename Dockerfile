FROM arm64v8/node:20-alpine

ENV APP_HOME /usr/src/app

WORKDIR /$APP_HOME

COPY package.json $APP_HOME/

RUN npm install

COPY . $APP_HOME/

CMD [ "npm", "start" ]