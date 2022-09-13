ARG GO_VERSION=1.13
ARG ALPINE_VERSION=3.10
ARG PATH="/mattermost/bin:${PATH}"

ARG MM_INSTALL_TYPE=docker

ARG edition=enterprise
ARG PUID=2000
ARG PGID=2000
ARG MM_BINARY=
ARG MM_VERSION=5.36.0

FROM golang:latest
ARG USERNAME=mmdev
ARG USER_UID=1000
ARG USER_GID=1000

COPY scripts/*.sh /tmp/scripts/

# Create non-root doge user
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && bash /tmp/scripts/user.sh "$USERNAME" "$USER_UID" "$USER_GID" \
    # Clean up
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg

RUN bash /tmp/scripts/db.sh

# Install Node.js
ARG NVM_DIR=/home/$USERNAME/.nvm
ARG NODE_VERSION="lts/*"

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    # Install common packages, non-root user, update yarn and install nvm
    && bash /tmp/scripts/node.sh "$NVM_DIR" "$NODE_VERSION" "$USERNAME" \
    # Clean up
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg

# Cleanup scripts
RUN rm -rf /tmp/scripts

CMD ["sleep", "infinity"]