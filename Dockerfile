# this is a common docker file for both the services

ARG NODE_VERSION=20
ARG PNPM_VERSION=9.0.0
ARG WORKSPACE_ROOT
ARG WORKSPACE_NAME

FROM node:${NODE_VERSION}-alpine AS alpine
ARG PNPM_VERSION
ENV NPM_CONFIG_LOGLEVEL info
RUN apk update
RUN apk add --no-cache libc6-compat coreutils
RUN npm i -g pnpm@${PNPM_VERSION}

FROM alpine AS root-setup
WORKDIR /app
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml  pnpm-workspace.yaml
COPY turbo.json turbo.json
COPY package.json package.json
RUN echo "store-dir=/app/.pnpm-store" >> .npmrc
# TODO prune other workspaces for production image build

FROM root-setup AS workspace-setup
ARG WORKSPACE_ROOT
ARG WORKSPACE_NAME
WORKDIR /app
COPY ./${WORKSPACE_ROOT}/${WORKSPACE_NAME} ./${WORKSPACE_ROOT}/${WORKSPACE_NAME}

FROM workspace-setup AS runner
ARG WORKSPACE_NAME
ENV WORKSPACE_NAME=${WORKSPACE_NAME}
WORKDIR /app
ENTRYPOINT [ "sh" ]
CMD ["-c", "pnpm i && pnpm -F $WORKSPACE_NAME dev"]

