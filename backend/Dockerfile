FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# database/seed lives one level up from backend/ in the repo, so the seed script
# expects to be run with that structure. When containerized standalone, mount
# or copy database/ alongside this Dockerfile's build context if you need `npm run seed`.

EXPOSE 5000
CMD ["node", "src/server.js"]
