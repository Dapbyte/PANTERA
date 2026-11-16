
FROM node:24.14.0-bookworm-slim

# Samakan versi npm dengan komputer pengembangan
RUN npm install --global npm@11.9.0

WORKDIR /app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]