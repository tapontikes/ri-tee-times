# Stage 1: Build Angular app
FROM node:lts as ng-builder

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY ./frontend ./frontend

RUN npm run build --omit=dev --output-path=./dist

# Stage 2: Build Node.js app
FROM node:lts as server
ENV TZ="America/New_York"


WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY --from=ng-builder /app/frontend/dist/client/browser /app/public

COPY ./backend .

EXPOSE 3000

CMD [ "node", "./bin/www" ]