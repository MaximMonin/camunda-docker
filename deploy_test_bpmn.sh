#!/bin/bash

curl -H "Content-Type: multipart/form-data" -X POST -F "deployment-name=payment-retrieval" -F 'upload=@"./camunda/bpms/examples/payment-retrieval.bpmn"' http://localhost:2580/engine-rest/deployment/create
