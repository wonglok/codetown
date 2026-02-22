FROM node:20-alpine
WORKDIR /app
COPY . /app
# USER node
EXPOSE 8077
ENV NODE_ENV production
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
