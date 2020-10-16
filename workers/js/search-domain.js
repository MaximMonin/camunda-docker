const { Variables, File } = require('camunda-external-task-client-js');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

function searchdomain (task, taskService)
{
  const { processInstanceId, processDefinitionKey, activityId } = task;
  switch (activityId) {
  case 'default-zone-list':
    defaultzonelist (task, taskService);
    break;
  case 'full-zone-list':
    fullzonelist (task, taskService);
    break;
  case 'get-domain-list':
    getdomainlist (task, taskService);
    break;
  case 'get-domain-data':
    getdomaindata (task, taskService);
    break;
  case 'get-whois-data':
    getwhoisdata (task, taskService);
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

function defaultzonelist(task, taskService) {
  const zonelist = convertlist(task.variables.get('default_zone_list'));
  const key = task.businessKey;

  var result = {
    activityId: task.activityId,
    processId: task.processInstanceId,
    data: {zonelist: zonelist}
  }
  console.log (JSON.stringify(result));
  taskService.complete(task);
};

function fullzonelist(task, taskService) {
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
  console.log (JSON.stringify(result));

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

function getdomainlist(task, taskService) {
  console.log(task);
  taskService.complete(task);
};

function getdomaindata(task, taskService) {
  console.log(task);
  taskService.complete(task);
};

function getwhoisdata(task, taskService) {
  console.log(task);
  taskService.complete(task);
};
