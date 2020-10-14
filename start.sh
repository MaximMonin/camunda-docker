#!/bin/bash

# autobuild
./build.sh
cd workers/node
./build.sh
cd ../..

docker-compose up -d
# setup rights
chmod -R a+rw grafana prometheus workers
