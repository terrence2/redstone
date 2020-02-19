// This file is part of Redstone.
//
// Redstone is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Redstone is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Redstone.  If not, see <http://www.gnu.org/licenses/>.
'use strict';
const ws = require('ws');

function on_thing(req, res, config, state) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
    '@context': 'https://iot.mozilla.org/schemas/',
    '@type': [config.name],
    id: 'http://' + config.host + '/thing',
    title: 'Redstone WebThing',
    description: 'A WebThing implemented on the Redstone platform',
    properties: state.properties,
    actions: {},
    events: {},
    links: [
      {
        rel: 'thing',
        href: '/thing'
      },
      {
        rel: 'properties',
        href: '/thing/properties'
      },
      {
        rel: 'alternate',
        href: 'ws://' + config.host + '/thing'
      },
    ]
  }));
}

function on_thing_properties(req, res, config, state) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(state));
}

function on_read_property(propname, req, res, config, state) {
  console.log('thing: reading property \'' + propname + '\'');
  res.writeHead(200, {'Content-Type': 'application/json'});
  let out = {};
  out[propname] = state.get_property(propname);
  res.end(JSON.stringify(out));
}

function on_write_property(propname, req, res, config, state) {
  if (state.properties[propname].readOnly) {
    res.writeHead(403, {'Content-Type': 'text/html'});
    res.end('<html><head><title>Forbidden</title></head><body>Forbidden: read-only</body></html>');
    return;
  }
  state.set_property(propname, req.read());
  res.writeHead(200, {'Content-Type': 'application/json'});
  let out = {};
  out[propname] = state.get_property(propname);
  res.end(JSON.stringify(out));
}

function on_request(req, res, config, state) {
  let route_name = req.method + '+' + req.url;
  console.log('routing request: ' + route_name);
  let route = routes[route_name];
  if (route) {
    console.log('found route: ' + route);
    route(req, res, config, state);
    return;
  }
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end('<html><head><title>Not Found</title></head><body>Not Found</body></html>');
}

function make_read_property(key, config, state) {
  return function(req, res, config, state) {
    on_read_property(key, req, res, config, state);
  };
}

function make_write_property(key, config, state) {
  return function(req, res, config, state) {
    on_write_property(key, req, res, config, state);
  };
}

let routes = {
  'GET+/': on_thing,
  'GET+/thing': on_thing,
  'GET+/thing/properties': on_thing_properties,
};
function start_thing(config, state) {
  for (let key in state.properties) {
    console.log('thing: adding property \'' + key + '\'');
    state.properties[key]['links'] = [
      {href: 'http://' + config.host + '/thing/properties/' + key}
    ];
    routes['GET+/thing/properties/' + key] = make_read_property(key, config, state);
    routes['POST+/thing/properties/' + key] = make_write_property(key, config, state);
  }

  let server = ws.createServer(function (req, res) {
    on_request(req, res, config, state);
  });
  let websocket_connections = [];
  server.listen(config.port);
  server.on('websocket', function(ws) {
    websocket_connections.push(ws);
    console.log('new connection');
    ws.on('close', function() {
      console.log('closing connection');
      let i = websocket_connections.indexOf(ws);
      if (i != -1) {
        websocket_connections.splice(i, 1);
      }
    });
    ws.on('message', function(msg) {
      print('[WS] ' + msg);
      let body = JSON.parse(msg);
      if (body['messageType'] === 'setProperty') {
        for (let property in body['data']) {
          state.set_property(property, body['data'][property]);
        }
      }
    });
  });
  state.watch_properties('thing', function(name, value) {
    let raw_message = {
      messageType: 'propertyStatus',
      data: {}
    };
    raw_message.data[name] = value;
    let message = JSON.stringify(raw_message);
    for (let i in websocket_connections) {
      console.log('sending to: ' + websocket_connections[i]);
      websocket_connections[i].send(message);
    }
  });
}

module.exports = {
  start: start_thing,
};