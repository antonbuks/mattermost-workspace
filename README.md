# mattermost-unity

### Usage

_Prerequisite: [Install Docker](https://docs.docker.com/install) on your local environment._

To get started, read and follow the instructions in [Developing inside a Container](https://code.visualstudio.com/docs/remote/containers). The [.devcontainer/](./.devcontainer) directory contains pre-configured `devcontainer.json`, `docker-compose.yml` and `Dockerfile` files, which you can use to set up remote development within a docker container.

- Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.
- Open VSCode and bring up the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).
- Type `Remote-Containers: Open Folder in Container`, this will build the container with Go and Node installed, this will also start Postgres.

> If you need to modify environment variables for kousa, you need to modify them inside `/home/mmdev/.bashrc` and restart your terminal.

### Run
#### `server`
```shell
$ make run-server
```
#### `webapp`
```shell
$ yarn
$ yarn dev-server:webapp
```
#### `packages`
```shell
$ yarn workspace @mattermost/types build
$ yarn workspace @mattermost/client build
$ yarn workspace @mattermost/components build
```
