var express = require('express');
var app = express();
var soap = require('soap');
var xml2js = require('xml2js');
var options = {compact: true, ignoreComment: true, spaces: 4};

var loglevel = process.env.LogLevel || 1;
var urlendpoint = process.env.UrlEndPoint;
var url = urlendpoint + '/wsdl?TargetUri=OpenedgeBridge';
var args = { iHandler: "", iInputPars: "", iInputBase64: "", iIncludeMetaSchema: 1 };


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var server = app.listen(3000, function () {
  console.log('Openedge Bridge listening on port 3000...');
});

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};
// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  server.close(() => {
    console.log(`server stopped`);
    process.exit(128 + value);
  });
};
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`Begin shutdown`);
    shutdown(signal, signals[signal]);
  });
});


var processQuery = function (req, res) {
  if (loglevel > 1) console.log ('Incoming ' + req.method + ' query');
  var ipar = req.params[0];
  var iHandler = ipar.substr(ipar.indexOf('/',0) + 1)+ '.p';
  if (loglevel > 1) console.log (iHandler);
  var iParams = Object.assign({}, req.query, req.body);
  if (loglevel > 1) console.log (iParams);

  args.iHandler = 'webservices/Webspeed.p';
  args.iInputPars = iHandler;

  var builder = new xml2js.Builder();
  var xml = builder.buildObject(iParams);

//  console.log (xml);
  args.iInputBase64 = Buffer.from(xml).toString('base64');

  soap.createClient(url, {endpoint: urlendpoint}, function(err, client) 
  {
    if (err) console.log("Connect to webservice ERROR: "+err);
    else 
    {
      client.OpenedgeBridge(args, function(err, result) 
      {
        if (loglevel > 1) console.log("webservice RESULT");
        if (err) console.log("WebService Query Error: "+err);
        else 
        {
          if (loglevel > 1) console.log("OutputPar:", result.oOutputPars);
          var r = Buffer.from(result.oOutputBase64,'base64').toString('utf8');
          if (loglevel > 1) console.log("OutputData:", r);
          if (result.oErrMsg != '') console.log("Webservice ErrMessage:", result.oErrMsg);
          res.status(200).end (r);
        }
      });
    }
  });
}

app.get('/cgi-bin/wspd_cgi.sh/WService*', processQuery);
app.post('//cgi-bin/wspd_cgi.sh/WService*', processQuery);
app.post('/cgi-bin/wspd_cgi.sh/WService*', processQuery);

app.get('/', function(req, res) {
  res.send('Openedge Bridge');
//  console.log ('Incoming query get:', req.url )
});
app.post('/', function (req, res) {
  res.send('Openedge Bridge');
//  console.log ('Incoming query get:', req.url )
});

app.get('/*', function(req, res) {
  res.send(req.url);
  console.log ('Incoming query get:', req.url )
});

app.post('/*', function(req, res) {
  res.send(req.url);
  console.log ('Incoming query post:', req.url )
});
