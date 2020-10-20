const { Variables, File } = require('camunda-external-task-client-js');
const WebSocket = require('ws');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const whois = require('whois-json');

const bot = process.env.TelegramBot;
const channel = process.env.TelegramChannel;

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
  case 'get-domains-data':
    getdomainsdata (task, taskService, wss);
    break;
  case 'get-whois-data':
    getwhoisdata (task, taskService, wss);
    break;
  case 'domain-register-notify':
    registernotify (task, taskService, wss);
    break;
  case 'domain-stop-session':
    stopsession (task, taskService, wss);
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
//  console.log (task.activityId + " -> ws");
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
//  console.log (task.activityId + " -> ws");
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

async function getdomainsdata(task, taskService, wss) {
  searchname = task.variables.get('searchname');
  zonelist = JSON.parse (task.variables.get('zonelist'));

  domains = new Array();
  for(var i =0; i < zonelist.length; i++) {
    domains.push (searchname + zonelist[i]);
  }

  // We can answer to query many times
  // Now we return domain-list only
  var result = {
    activityId: task.activityId,
    processId: task.processInstanceId,
    data: domains
  }

//  console.log (task.activityId + " -> ws");
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
      client.send(JSON.stringify(result));
    }
  });

  // Lets calc each domain data and return it to client
  domainsdata = new Array();
  for(var i =0; i < domains.length; i++) {
    domaindata = await getdomaindata (domains[i]);
    domainsdata.push (domaindata);

    var result = {
      activityId: task.activityId + '-full',
      processId: task.processInstanceId,
      data: domaindata
    }
//    console.log (JSON.stringify(result) + " -> ws");

    // Callback to web client
//    console.log (task.activityId + "-full -> ws");
    wss.clients.forEach(function each(client) {
      // Only send to client subscribed on process with processId
      if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
        client.send(JSON.stringify(result));
      }
    });
  }

  const processVariables = new Variables();
  processVariables.set("domains", domainsdata);

  taskService.complete(task, processVariables);
};

async function getdomaindata(domain) {
  var status;
  try {
    var result = await whois(domain);
    if (result.domain) {
      status = 'busy';
    }
    else {
      status = 'free';
    }
  }
  catch (error) {
    console.log ('domain data error:' + JSON.stringify(error));
    status = 'error';
  }
  return {domain: domain, status: status};
};

function getwhoisdata(task, taskService, wss) {
  domain = task.variables.get('whoisdomain');
  api = task.variables.get('whoisapi');

  axios.get(api + domain)
  .then(response => {
    const data = response.data;

    var result = {
      activityId: task.activityId,
      processId: task.processInstanceId,
      data: data
    }

//    console.log (task.activityId + " -> ws");
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
        client.send(JSON.stringify(result));
      }
    });
    taskService.complete(task);
  })
  .catch(error => {
    console.log ('whois data error:' + JSON.stringify(error));
    taskService.complete(task);
  });
}

function registernotify(task, taskService, wss) {
  const domainlist = task.variables.get('domainlist');

  const info = "Бизнес процесс выбора домена завершен. Для регистрации выбраны следующие домены: " + domainlist;

  // send message to telegram channel
  axios.post( 'https://api.telegram.org/bot' + bot + '/sendMessage', {chat_id: channel,  parse_mode: 'HTML', text: info  })
  .then(response => {})
  .catch(function (error) {
    console.log(error.response.data);
  });

  var result = {
    activityId: task.activityId,
    processId: task.processInstanceId,
    data: {info: info}
  }
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
      client.send(JSON.stringify(result));
    }
  });

  taskService.complete(task);
};

function stopsession(task, taskService, wss) {
  var result = {
    activityId: task.activityId,
    processId: task.processInstanceId,
    data: {info: 'Process stoped by timeout'}
  }
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client.channel == 'Camunda' && client.processId == task.processInstanceId) {
      client.send(JSON.stringify(result));
    }
  });
  taskService.complete(task);
};
