#!/bin/bash

while true; do
    echo "Starting the Node.js server..."
    node app.js
    echo "Server stopped. Restarting..."
    sleep 1
done
