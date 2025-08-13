I'll be using bash for running the commands as I'm on debian linux. If you're are on windows you can either use WSL or find the equivalent commands on your own and same for the mac os.

## Installation

1. Clone the repo

```bash
git clone https://github.com/bhishekprajapati/beat22
```

2. Install `node@20` and `pnpm@9`. You can use [node version manager](https://github.com/nvm-sh/nvm). Run to verify the version.

```bash
node -v # 20.x.x
```

```bash
pnpm -v # 9.x.x
```

3. Install docker on your machine. You can use docker install script [click here](https://github.com/docker/docker-install).

Verify docker compose version by running this below
command.

```bash
sudo docker compose version # Docker Compose version v2.38.1
```

## Setup environment variables

1. Check example env file at `~/services/auth/.env.example` from the project root.

Then create a new .env file with these variables

```
# Go to your mongo atlas and grab the connection string
DATABASE_URL="<REPLACE-WITH-YOUR-MONGO-ATLAS-REPLICA-SET-URL>"

# To generate the key run this command
# openssl rand -hex 32
AUTH_JWT_PRIVATE_KEY="<REPLACE-WITH-YOUR-PRIVATE-KEY>"

# To generate the associated id run this command
# openssl rand -hex 16
AUTH_JWT_KEY_ID="<REPLACE-WITH-YOUR-KEY-ID>"
```

2. Check example env file at `~/services/files/.env.example` from the project root.

Then create a new .env file with these variables

```
# Go to your mongo atlas and grab the connection string
DATABASE_URL="<REPLACE-WITH-YOUR-MONGO-ATLAS-REPLICA-SET-URL>"
```

Other environment variables are optional and provided by docker compose file and some default at server implementation level.

You can check `~/services/auth/srv/env.ts` and `~/services/files/srv/env.ts` files to see all the environment variables.

## Postman Workspace

Due to time constraints i haven't wired up the UI. Though, It's almost done.

In order to test the apis locally. Clone the postman workspace from [here](https://www.postman.com/gold-crescent-532919/workspace/beat22)

## Run the local infra

Now, We are ready to start our local infra setup.
Run these below commands one by one.

```
# cd /into/project/root

sudo docker compose up -d
```

Wait until all the containers finshes building and running. Once that's done. the run this below command to follow logs of all the services.

```bash
sudo docker compose logs -f
```

Now, We're ready to interact with apis from postman.
Watch the short demo video for postman workspace collections walk through.

After finishing, tear down the local running infra

```bash
sudo docker compose down
```
