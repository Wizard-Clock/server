FROM node
RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app
COPY package*.json /app
RUN npm install
COPY . /app
EXPOSE 8080
CMD ["node","app.js"]