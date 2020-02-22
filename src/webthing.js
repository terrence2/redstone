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

function make_read_property(self, propname) {
  return function(req, res) {
    self.on_read_property(propname, req, res);
  };
}

function make_write_property(self, propname) {
  return function(req, res) {
    self.on_write_property(propname, req, res);
  };
}

function WebThing(config, state) {
  // Default routes for any thing.
  let routes = {
    'GET+/': this.on_thing.bind(this),
    'GET+/thing': this.on_thing.bind(this),
    'GET+/thing/properties': this.on_thing_properties.bind(this),
  };

  // Extend default routes with a route for our properties.
  for (let propname of state.get_property_names()) {
    state.set_property_link(propname, 'http://' + config.host + '/thing/properties/' + propname);
    routes['GET+/thing/properties/' + propname] = make_read_property(this, propname);
    routes['POST+/thing/properties/' + propname] = make_write_property(this, propname);
  }

  this.websocket_connections = [];
  this.routes = routes;
  this.config = config;
  this.state = state;
  this.server = ws.createServer(this.on_request.bind(this));

  this.server.listen(config.port);
  this.server.on('websocket', this.on_websocket_connection.bind(this));
  this.state.watch_properties('thing', this.on_property_changed.bind(this));
}

WebThing.prototype.on_websocket_connection = function(ws) {
  this.websocket_connections.push(ws);
  let self = this;
  ws.on('close', function() {
    let i = self.websocket_connections.indexOf(ws);
    if (i != -1) {
      self.websocket_connections.splice(i, 1);
    }
  });
  ws.on('message', function(msg) {
    let body = JSON.parse(msg);
    if (body['messageType'] === 'setProperty') {
      for (let property in body['data']) {
        self.state.set_property(property, body['data'][property]);
      }
    }
  });
};

WebThing.prototype.on_property_changed = function(name, value) {
  let raw_message = {
    messageType: 'propertyStatus',
    data: {}
  };
  raw_message.data[name] = value;
  let message = JSON.stringify(raw_message);
  for (let i in this.websocket_connections) {
    this.websocket_connections[i].send(message);
  }
};

WebThing.prototype.on_request = function(req, res) {
  let route_name = req.method + '+' + req.url;
  let route = this.routes[route_name];
  if (route) {
    route(req, res);
    return;
  }
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.end('<html><head><title>Not Found</title></head><body>Not Found</body></html>');
};

WebThing.prototype.on_thing = function(_req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
    '@context': 'https://iot.mozilla.org/schemas/',
    '@type': [this.config.name],
    id: 'http://' + this.config.host + '/thing',
    title: 'Redstone WebThing',
    description: 'A WebThing implemented on the Redstone platform',
    properties: this.state.get_properties(),
    actions: {},
    events: {},
    links: [
      {
        rel: 'thing',
        href: 'http://' + this.config.host + '/thing'
      },
      {
        rel: 'properties',
        href: 'http://' + this.config.host + '/thing/properties'
      },
      {
        rel: 'alternate',
        href: 'ws://' + this.config.host + '/thing'
      },
    ]
  }));
}

WebThing.prototype.on_thing_properties = function(_req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({properties: this.state.get_properties()}));
}

WebThing.prototype.on_read_property = function(propname, _req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  let out = {};
  out[propname] = this.state.get_property(propname);
  res.end(JSON.stringify(out));
}

WebThing.prototype.on_write_property = function(propname, req, res) {
  if (this.state.property_is_read_only(propname)) {
    res.writeHead(403, {'Content-Type': 'text/html'});
    res.end('<html><head><title>Forbidden</title></head><body>Forbidden: read-only</body></html>');
    return;
  }
  this.state.set_property(propname, req.read());
  return this.on_read_property(propname, req, res);
}

module.exports = WebThing;