FROM node:lts-alpine

ENV PORT=6969
WORKDIR /usr/src/api
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 6969
RUN chown -R node /usr/src/api
RUN cd /usr/src/api && npm run build
USER node
CMD ["npm", "start"]
