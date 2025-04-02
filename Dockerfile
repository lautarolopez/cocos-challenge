# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm start"]
