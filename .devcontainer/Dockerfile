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

# Setup user
# RUN adduser $USERNAME -s /bin/sh -D -u $USER_UID $USER_GID && \
#     mkdir -p /etc/sudoers.d && \
#     echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME && \
#     chmod 0440 /etc/sudoers.d/$USERNAME

# RUN apk add -q --update --progress --no-cache git sudo openssh-client zsh

# # Install some needed packages
# RUN apk add --no-cache \
# 	ca-certificates \
# 	curl \
# 	jq \
# 	libc6-compat \
# 	libffi-dev \
# 	libcap \
# 	linux-headers \
# 	mailcap \
# 	netcat-openbsd \
# 	xmlsec-dev \
# 	tzdata \
#     git \
# 	&& rm -rf /tmp/*

# Create non-root doge user
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && bash /tmp/scripts/user.sh "$USERNAME" "$USER_UID" "$USER_GID" \
    # Clean up
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg

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