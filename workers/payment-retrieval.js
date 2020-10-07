const { Client, logger, Variables, File } = require('camunda-external-task-client-js');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const faker = require ('faker');

// configuration for the Client:
//  - 'baseUrl': url to the Process Engine
//  - 'logger': utility to automatically log important events
//  - 'asyncResponseTimeout': long polling timeout (then a new request will be issued)

//  - 'maxTasks': The maximum number of tasks to fetch from Camunda in batch
//  - 'maxParallelExecutions': The maximum number of tasks to be worked on simultaneously
//  Number of async execution threads = maxTasks if maxParallelExcecutions is not set
//  Else Number of async threads = min (MaxTasks,maxParallelExcecutions)

const url = process.env.CamundaURL || 'http://camunda:8080/engine-rest';
const bpm = 'payment-retrieval';
const timeout = process.env.ResponseTimeout || 10000;
const config = { baseUrl: url, use: logger, asyncResponseTimeout: timeout, maxTasks: 50, maxParallelExecutions: 10 };

// create a Client instance with custom configuration
const client = new Client(config);

// susbscribe to the topic: 'charge-card'
client.subscribe('charge-card', {processDefinitionKey: bpm}, async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const amount = task.variables.get('amount');
  const item = task.variables.get('item');

  console.log(`Charging credit card with an amount of ${amount}€ for the item '${item}'...` );
  console.log(`Process: ` + url + '/process-instance/' + task.processInstanceId )

  axios.get(url + '/process-instance/' + task.processInstanceId ).then(response => {
     const data = response.data;
     console.log('Process data: ' + JSON.stringify(data));

     // Complete the task
     taskService.complete(task);
  })
  .catch(function (error) {
    if (error.response) {
      // Request made and server responded
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

    // Handle a Failure
    if (Math.random() > 0.2)
    {
    // repeat again and again
      taskService.handleFailure(task, {
        errorMessage: "Cannot exctract process id data",
        errorDetails: error.response.data.message,
        retries: 1,
        retryTimeout: 1000
      });
    }
    else {
    // Create incident
      taskService.handleFailure(task, {
        errorMessage: "Cannot exctract process id data",
        errorDetails: error.response.data.message,
        retries: 0,
        retryTimeout: 1000
      });
    }
  });

});

// susbscribe to the topic: 'charge-card-premium'
client.subscribe('charge-card-premium', {processDefinitionKey: bpm}, async function({ task, taskService }) {
  // Put your business logic here

  // Get a process variable
  const amount = task.variables.get('amount');
  const item = task.variables.get('item');

  console.log(`Premium charging credit card with an amount of ${amount}€ for the item '${item}'...`);

  // Complete the task
  await taskService.complete(task);
});


// susbscribe to the topic: 'generate-item-amount'
client.subscribe('generate-item-amount', {processDefinitionKey: bpm},  async function({ task, taskService }) {

  console.log(`Generating amount and item for process...`);

  const processVariables = new Variables();
  processVariables.set("amount", Number(faker.fake('{{finance.amount}}')));
  processVariables.set('item', faker.fake('{{commerce.product}}'));

  // Complete the task
  await taskService.complete(task, processVariables);
});
