const ws = require('ws');

function onPageRequest(req, res) {
  console.log('routing request');
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('hello');
}

function start_thing(config) {
  let server = ws.createServer(onPageRequest);
  server.listen(config.port);
  server.on('websocket', function(ws) {
    // ws.on('message',function(msg) { print("[WS] "+JSON.stringify(msg)); });
    // ws.send("Hello from Espruino!");
    console.log('new connection');
  });
}

module.exports = {
  start: start_thing,
};