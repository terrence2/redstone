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
import config from './config.js';
let espruino = require('../src/hardware/espruino_wifi.js');
let colorspace = require('../src/util/colorspace.js');
let WebThing = require('../src/webthing.js');

SPI1.setup({mosi:A7, sck:A5});
function set_color(r, g, b) {
  const HEADER = [0x00, 0x00, 0x00, 0x00];
  const FOOTER = [0xFF, 0xFF, 0xFF, 0xFF];
  let pix = [0xff, b, g, r];
  let buffer = HEADER.concat(pix, pix, pix, pix, FOOTER);
  SPI1.write(buffer);
}

/*
class State {
  constructor() {
    this.properties = {
      most_recent_button_press: {
        value: 0,
        title: 'MostRecentButtonPress',
        type: 'integer',
        readOnly: true,
        description: 'The most recently pressed button'
      },
      color: {
        value: 'none',
        title: 'Color',
        type: 'string',
        readOnly: false,
        description: 'The color to set the LEDs'
      },
      effect: {
        value: 'solid',
        title: 'EffectStyle',
        type: 'string',
        enum: ['solid'],
        readOnly: false,
        description: 'The effect style with which to drive the LEDs'
      }
    };
    this.property_watchers = {};
  }

  get_properties() {
    return this.properties.keys();
  }

  get_property(name) {
    return this.properties[name].value;
  }

  set_property(name, value) {
    this.properties[name].value = value;
    for (let key in this.property_watchers) {
      const watch_func = this.property_watchers[key];
      watch_func(name, value);
    }
  }

  watch_properties(watch_name, watch_func) {
    this.property_watchers[watch_name] = watch_func;
  }

  unwatch_properties(watch_name) {
    delete this.property_watchers[watch_name];
  }
}
*/

function State() {
  this._properties = {
    most_recent_button_press: {
      value: 0,
      title: 'MostRecentButtonPress',
      type: 'integer',
      readOnly: true,
      description: 'The most recently pressed button'
    },
    color: {
      value: 'none',
      title: 'Color',
      type: 'string',
      readOnly: false,
      description: 'The color to set the LEDs'
    },
    effect: {
      value: 'solid',
      title: 'EffectStyle',
      type: 'string',
      enum: ['solid'],
      readOnly: false,
      description: 'The effect style with which to drive the LEDs'
    }
  };
  this._property_watchers = {};
}

State.prototype.get_properties = function() {
  return this._properties;
};

State.prototype.get_property_names = function() {
  let a = [];
  for (let propname in this._properties) {
    a.push(propname);
  }
  return a;
};

State.prototype.property_is_read_only = function(name) {
  return self._properties[name].readOnly || false;
};

State.prototype.get_property = function(name) {
  return this._properties[name].value;
};

State.prototype.set_property = function(name, value) {
  this._properties[name].value = value;
  for (let watch_name in this._property_watchers) {
    const watch_func = this._property_watchers[watch_name];
    watch_func(name, value);
  }
};

State.prototype.set_property_link = function(name, href) {
  this._properties[name]['links'] = [{'rel': 'property', 'href': href}];
};

State.prototype.watch_properties = function(watch_name, watch_func) {
  this._property_watchers[watch_name] = watch_func;
};

State.prototype.unwatch_properties = function(watch_name) {
  delete this._property_watchers[watch_name];
};

function onButtonPress(pin, state, thing) {
  const PIN_MAP = {
    A0: 0,
    A1: 1,
    B9: 2,
    B8: 3
  };

  let next_state = PIN_MAP[pin];
  if (next_state == state.get_property('most_recent_button_press')) {
    return;
  }
  state.set_property('most_recent_button_press', next_state);

  // TODO: emit events too
  //thing.send_event('button_press', next_state);
}

let prior_color = '';
function set_solid_color_interval(state) {
  const HEADER = [0x00, 0x00, 0x00, 0x00];
  const FOOTER = [0xFF, 0xFF, 0xFF, 0xFF];
  let color = state.get_property('color');
  if (prior_color === color) {
    return;
  }
  prior_color = color;

  let [r, g, b] = colorspace.parse_html(color);
  let pix = [0xff, b, g, r];

  let buffer = HEADER.concat(pix, pix, pix, pix, FOOTER);
  SPI1.write(buffer);
}

let thing = null;
function onConnected() {
  let state = state = new State();
  thing = new WebThing(config.thing, state);

  const opts = { repeat: true };
  pinMode(A0, 'input_pullup');
  setWatch(function(_state, _time, _lastTime) { onButtonPress(A0, state, thing); }, A0, opts);
  pinMode(A1, 'input_pullup');
  setWatch(function(_state, _time, _lastTime) { onButtonPress(A1, state, thing); }, A1, opts);
  pinMode(B9, 'input_pullup');
  setWatch(function(_state, _time, _lastTime) { onButtonPress(B9, state, thing); }, B9, opts);
  pinMode(B8, 'input_pullup');
  setWatch(function(_state, _time, _lastTime) { onButtonPress(B8, state, thing); }, B8, opts);

  setInterval(function() {
    let effect = state.get_property('effect');
    if (effect === 'solid') {
      set_solid_color_interval(state);
    }
  }, 16);
}

function main() {
  set_color(255, 0, 0);
  espruino.connect_to_wifi(config.wifi, onConnected);
}

E.on('init', main);