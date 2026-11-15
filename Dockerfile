FROM node:24-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

ENV PORT=8000
ENV FINN_DATA_DIR=/app/data
EXPOSE 8000

CMD ["npm", "start"]
