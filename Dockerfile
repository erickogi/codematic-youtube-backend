# Multi-Stage Docker Build - Stage 1
FROM node:lts-alpine3.17 AS BUILD_IMAGE

# Copy package.json file and Install dependencies
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install -f

COPY . .

# Build application
RUN npm run build


# Multi-Stage Docker Build - Stage 2
FROM node:lts-alpine3.17

WORKDIR /usr/src/app

# Copy from build image
# COPY --from=BUILD_IMAGE /usr/src/app/export.sh ./export.sh
COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /usr/src/app/package*.json ./
# COPY --from=BUILD_IMAGE /usr/src/app/.env ./.env

# Expose the Port
EXPOSE 3009

# Run the app
# ENTRYPOINT ["/bin/sh","-c"]
CMD ["npm", "run", "start:prod"]
################# blank comment #############
