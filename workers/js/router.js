const { paymentretrieval } = require ('./payment-retrieval.js');
const { searchdomain } = require ('./search-domain.js');

function router(task, taskService, wss) {
  const { processInstanceId, processDefinitionKey, activityId } = task;

  console.log (JSON.stringify(task)); 

  switch (processDefinitionKey) {
  case 'payment-retrieval':
    paymentretrieval(task, taskService, wss);
    break;
  case 'search-domain':
    searchdomain(task, taskService, wss);
    break;
  default:
    {
      console.log('Unknown Process ' + processDefinitionKey);
      taskService.handleFailure(task, {
        errorMessage: "Unknown process " + processDefinitionKey,
        errorDetails: '',
        retries: 0
      });
    }
  }

};

module.exports = { router };
