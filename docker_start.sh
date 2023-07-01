#!/bin/sh
docker run -t --rm -p 5000:5000 -v `pwd`:/host -it locky-docker:latest bash
