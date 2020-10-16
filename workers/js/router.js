const { paymentretrieval } = require ('./payment-retrieval.js');
const { searchdomain } = require ('./search-domain.js');

function router(task, taskService) {
  const { processInstanceId, processDefinitionKey, activityId } = task;

  console.log (JSON.stringify(task)); 

  switch (processDefinitionKey) {
  case 'payment-retrieval':
    paymentretrieval(task, taskService);
    break;
  case 'search-domain':
    searchdomain(task, taskService);
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
