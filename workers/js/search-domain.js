const { Variables, File } = require('camunda-external-task-client-js');
const WebSocket = require('ws');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

function searchdomain (task, taskService, wss)
{
  const { processInstanceId, processDefinitionKey, activityId } = task;
  switch (activityId) {
  case 'default-zone-list':
    defaultzonelist (task, taskService, wss);
    break;
  case 'full-zone-list':
    fullzonelist (task, taskService, wss);
    break;
  case 'get-domain-list':
    getdomainlist (task, taskService, wss);
    break;
  case 'get-domain-data':
    getdomaindata (task, taskService, wss);
    break;
  case 'get-whois-data':
    getwhoisdata (task, taskService, wss);
    break;
  default:
    {
      console.log('Unknown activityId in process ' + processDefinitionKey + ' (' + activityId + ')');
      taskService.handleFailure(task, {
        errorMessage: 'Unknown activityId in process ' + processDefinitionKey + ' (' + activityId + ')',
        errorDetails: '',
        retries: 0
      });
    }
  }
};

module.exports = {searchdomain};

function defaultzonelist(task, taskService, wss) {
  const zonelist = convertlist(task.variables.get('default_zone_list'));

  var result = {
    activityId: task.activityId,
    processId: task.processInstanceId,
    data: {zonelist: zonelist}
  }
  // Callback to web client
  console.log (task.activityId + " -> ws");
  wss.clients.forEach(function each(client) {
    // Only send to client subscribed on process with processId
    if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
      client.send(JSON.stringify(result));
    }
  });

  taskService.complete(task);
};

function fullzonelist(task, taskService, wss) {
  zone1 = convertlist(task.variables.get('ukraine_zone'));
  zone2 = convertlist(task.variables.get('international_zone'));
  zone3 = convertlist(task.variables.get('international_new_zone'));
  obj1 = {name: 'ukraine_zone', zonelist: zone1};
  obj2 = {name: 'international_zone', zonelist: zone2};
  obj3 = {name: 'international_new_zone', zonelist: zone3};

  var result = {
    activityId: task.activityId,
    processId: task.processInstanceId,
    data: {zonelist: [obj1, obj2, obj3]}
  }
  // Callback to web client
  console.log (task.activityId + " -> ws");
  wss.clients.forEach(function each(client) {
    // Only send to client subscribed on process with processId
    if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
      client.send(JSON.stringify(result));
    }
  });

  taskService.complete(task);
};

function convertlist (list) {
  list = list.split(" ");
  var stringArray = new Array();
  for(var i =0; i < list.length; i++) {
    if (list[i] == '' || list[i] == ' ') {
    }
    else {
      stringArray.push(list[i]);
    }
  }
  return stringArray;
}

function getdomainlist(task, taskService, wss) {
  console.log(task);
  taskService.complete(task);
};

function getdomaindata(task, taskService, wss) {
  console.log(task);
  taskService.complete(task);
};

function getwhoisdata(task, taskService, wss) {
  console.log(task);
  taskService.complete(task);
};
