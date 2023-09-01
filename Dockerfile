
FROM  node:18.12.1-bullseye-slim AS build
    WORKDIR /usr/src/app
    COPY package.json package-lock.json ./
    RUN npm install
    COPY . .
    RUN npm run build
### STAGE 2: Run ###
FROM nginx:stable-alpine
    COPY --from=build /usr/src/app/dist/resource-365 /usr/share/nginx/html/home
    COPY ./nginx.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80