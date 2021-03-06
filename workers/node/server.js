const { Client, logger, Variables, File } = require('camunda-external-task-client-js');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const WebSocket = require('ws');

const { router } = require ('./js/router.js');

// Create websocket server to accept commands and return async api result data
console.log('Camunda Node Websocket server is starting on port 8080...');
const wss = new WebSocket.Server({ port: 8080 });


// configuration for the Camunda Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
//  - 'asyncResponseTimeout': long polling timeout (then a new request will be issued)

//  - 'maxTasks': The maximum number of tasks to fetch from Camunda in batch
//  - 'maxParallelExecutions': The maximum number of tasks to be worked on simultaneously
//  Number of async execution threads = maxTasks if maxParallelExcecutions is not set
//  Else Number of async threads = min (MaxTasks,maxParallelExcecutions)

const url = process.env.CamundaUrl || 'http://camunda:8080/engine-rest';
const timeout = process.env.ResponseTimeout || 10000;
const tasktype = process.env.TaskType || 'service-task';
const loglevel = process.env.LogLevel || 'INFO';

// for fast parallel processing it is critical to reduse polling internal to low value (5ms)
// + camunda recommends to set asyncBefore flag to set transaction save point before each external task (model)
// On this example it works 3 times faster compared to default 10 thread + 300 ms interval
const config = { baseUrl: url, use: logger.level(loglevel), asyncResponseTimeout: timeout, maxTasks: 200, interval: 5 };

// create a Client instance with custom configuration
console.log('Camunda Node worker is starting...')
const client = new Client(config);
const topicSubscription = client.subscribe(tasktype, {}, async function ({task, taskService}) {
//  console.log (JSON.stringify(task)); 

  await router (task, taskService, wss);
});


// Websocket protocol
function heartbeat() {
  this.isAlive = true;
};
function noop() {};

wss.on('connection', function connection(ws, req) {
  ws.isAlive = true;
  ws.channel = "";
  ws.processId = null;

  ws.on('pong', heartbeat);

  ws.on('message', function incoming(message) {
//    console.log('received: %s', message);
    if (message.startsWith("{")) {
      obj = JSON.parse (message);
      if (obj.command == 'subscribe') {
        ws.channel = obj.channel;
        ws.processId = obj.processId;
      }
      if (obj.command == 'startProcess') {
        axios.post( url + '/process-definition/key/' + obj.ProcessKey + '/start', {variables: obj.variables})
        .then(response => {
           const data = response.data;
           console.log('Workflow instance started: ' + JSON.stringify(data));
           ws.channel = 'Camunda';
           ws.processId = data.id;
           ws.send ('processId=' + data.id);
           ws.send (JSON.stringify({message: 'startProcessResult', data: data}));
        })
        .catch(error => {
           if (error.response) {
             console.log(error.response.data);
           }
           ws.send (JSON.stringify({message: 'startProcessError', data: error}));
        });
      }
      if (obj.command == 'publishMessage') {
        var processId = obj.processInstanceId;
        if (processId == null && ws.processId) {
          processId = ws.processId;
        } 
        axios.post( url + '/message', {messageName: obj.messageName, processInstanceId: processId, all: true, processVariables: obj.processVariables})
        .then(response => {
          const mesdata = response.data;
          console.log('Message delivered: ' + JSON.stringify(obj));
          if (obj.processInstanceId) {
            ws.channel = 'Camunda';
            ws.processId = obj.processInstanceId;
          }
          ws.send (JSON.stringify({message: 'publishMessageResult', data: mesdata}));
        })
        .catch(error => {
          if (error.response) {
            console.log(error.response.data);
          }
          ws.send (JSON.stringify({message: 'publishMessageError', data: error}));
        });
      }
    }
  });
 
  ws.send('welcome');
//  console.log ('welcome -> ws');
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
 
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval);
});


// For docker enviroment it catch docker compose down/restart commands
// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};
// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  console.log(`Camunda Node worker stopped`);
  process.exit(128 + value);
};
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`Camunda Node worker is shutdowning`);

    topicSubscription.unsubscribe();
    client.stop();
    console.log(`Camunda Node WebSocket server is shutdowning`);

    wss.clients.forEach(function each(ws) {
      ws.terminate();
    });
    wss.close();
    console.log(`Camunda Node WebSocket server stoped`);

    shutdown(signal, signals[signal]);
  });
});

