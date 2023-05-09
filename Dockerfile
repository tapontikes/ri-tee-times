# Stage 1: Build Angular app
FROM node:lts as ng-builder

WORKDIR /app

COPY ./frontend/package*.json ./

RUN npm install

COPY ./frontend .

RUN npm run ng build --prod --output-path=./dist

# Stage 2: Build Node.js app
FROM node:lts as server

WORKDIR /app

COPY ./backend/package*.json ./

RUN npm install

COPY --from=ng-builder /app/dist/client /app/public

COPY ./backend .

EXPOSE 3000

CMD [ "npm", "start" ]