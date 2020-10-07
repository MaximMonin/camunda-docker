const { Client, logger, Variables, File } = require('camunda-external-task-client-js');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const faker = require ('faker');

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
//  - 'asyncResponseTimeout': long polling timeout (then a new request will be issued)
var url = process.env.CamundaURL || 'http://camunda:8080/engine-rest';
var timeout = process.env.ResponseTimeout || 10000;
const config = { baseUrl: url, use: logger, asyncResponseTimeout: timeout };

// create a Client instance with custom configuration
const client = new Client(config);

// susbscribe to the topic: 'charge-card'
client.subscribe('charge-card', async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const amount = task.variables.get('amount');
  const item = task.variables.get('item');

  console.log(`Charging credit card with an amount of ${amount}€ for the item '${item}'...` );
  console.log(`Process:` + url + '/process-instance/' + task.processInstanceId )

  axios.get(url + '/process-instance/' + task.processInstanceId ).then(response => {
     const data = response.data;
     console.log('Process data: ' + JSON.stringify(data));
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  });

  // Complete the task
  await taskService.complete(task);
});

// susbscribe to the topic: 'charge-card-premium'
client.subscribe('charge-card-premium', async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const amount = task.variables.get('amount');
  const item = task.variables.get('item');

  console.log(`Premium charging credit card with an amount of ${amount}€ for the item '${item}'...`);

  // Complete the task
  await taskService.complete(task);
});


// susbscribe to the topic: 'generate-item-amount'
client.subscribe('generate-item-amount', async function({ task, taskService }) {

  console.log(`Generating amount and item for process...`);

  const processVariables = new Variables();
  processVariables.set("amount", Number(faker.fake('{{finance.amount}}')));
  processVariables.set('item', faker.fake('{{commerce.product}}'));

  // Complete the task
  await taskService.complete(task, processVariables);
});
