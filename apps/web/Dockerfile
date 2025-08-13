FROM node:20-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat coreutils
RUN npm i -g pnpm@9

FROM alpine AS root-setup
WORKDIR /app
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml  pnpm-workspace.yaml
COPY turbo.json turbo.json
COPY package.json package.json
RUN echo "store-dir=/app/.pnpm-store" >> .npmrc

FROM root-setup AS workspace-setup
LABEL org.opencontainers.image.source="https://github.com/bhishekprajapati/beat22"
WORKDIR /app
COPY ./apps/web ./apps/web

FROM workspace-setup AS runner
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app
ENTRYPOINT [ "sh" ]
CMD ["-c", "pnpm i && pnpm -F web dev"]

