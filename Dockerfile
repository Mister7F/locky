FROM ubuntu:24.10
ARG timezone=Europe/Brussels

ENV TERM xterm-256color

WORKDIR /host/svelte

RUN apt update && apt -y upgrade && apt install -y nodejs npm

# docker build . -t "locky-docker"
# docker run -t --rm --network="host" -v `pwd`:/host -it locky-docker:latest bash
