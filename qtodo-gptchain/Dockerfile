# Stage 1: build the React app
# This stage installs 847 npm packages to compile what is essentially
# five checkboxes and a textarea. This is fine. This is modern web development.
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Stage 2: serve with nginx
# The entire 800MB node_modules directory is thrown away here.
# It served its purpose. It will not be missed.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
