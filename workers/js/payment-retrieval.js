const { Variables, File } = require('camunda-external-task-client-js');
const axios = require ('axios'); axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const faker = require ('faker');

const bot = process.env.TelegramBot;
const channel = process.env.TelegramChannel;

function paymentretrieval (task, taskService, wss)
{
  const { processInstanceId, processDefinitionKey, activityId } = task;
  switch (activityId) {
  case 'generate':
    generate (task, taskService, wss);
    break;
  case 'charge-card':
    charge (task, taskService, wss);
    break;
  case 'charge-card-premium':
    chargepremium (task, taskService, wss);
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

module.exports = {paymentretrieval};

function charge (task, taskService, wss) {
  // Get a process variable
  const amount = task.variables.get('amount');
  const item = task.variables.get('item');

  console.log(`Charging credit card with an amount of ${amount}€ for the item '${item}' ` + ' Process :' + task.processInstanceId );
  taskService.complete(task);

/*
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
    if (Math.random() > 0.1)
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
*/
};

function chargepremium (task, taskService, wss) {
  // Get a process variable
  const amount = task.variables.get('amount');
  const item = task.variables.get('item');

  console.log(`Premium charging credit card with an amount of ${amount}€ for the item '${item}' ` + ' Process :' + task.processInstanceId );
  taskService.complete(task);

/*
  // send message to telegram channel
  axios.post( 'https://api.telegram.org/bot' + bot + '/sendMessage', {chat_id: channel,  parse_mode: 'HTML', 
               text: 'Bingo! We got ' + amount + '€ for ' + item  }).then(response => {
     const data = response.data;
     console.log('Telegram answer: ' + JSON.stringify(data));

     // Complete the task
     taskService.complete(task);
  })
  .catch(function (error) {
    if (error.response) {
      console.log(error.response.data);
    } 
    else {
      console.log('error sending data to telegram');
    }
    // Complete the task
    taskService.complete(task);
  });
*/
};

function generate (task, taskService, wss) {
  console.log(`Generating amount and item for process...` + task.processInstanceId);

  const processVariables = new Variables();
  processVariables.set("amount", Number(faker.fake('{{finance.amount}}')));
  processVariables.set('item', faker.fake('{{commerce.product}}'));

  // Complete the task
  taskService.complete(task, processVariables);
};
