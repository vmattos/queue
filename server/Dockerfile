FROM node:7.2.1-alpine

# Copy applicaiton files
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install Node.js dependencies
RUN npm install

CMD [ "node", "server.js" ]
