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
import espruino from '../node_modules/redstone/src/hardware/espruino_wifi.js';
import WebThing from '../node_modules/redstone/src/webthing.js';
import WebThingState from '../node_modules/redstone/src/state.js';

// On
pinMode(B10, 'input_pullup');
pinMode(B13, 'input_pullup');
pinMode(B14, 'input_pullup');
pinMode(B15, 'input_pullup');

// Off
pinMode(A0, 'input_pullup');
pinMode(A1, 'input_pullup');
pinMode(B0, 'input_pullup');
pinMode(B9, 'input_pullup');

function read_switch_state() {
  let status = digitalRead([B10, B13, B14, B15, A0, B0, A1, B9]);
  let is_open = status == 0xFF;
  let is_up = (status & 0xF0) != 0xF0;
  let is_down = (status & 0xF) != 0xF;
  if (is_up + is_open + is_down != 1) {
    console.log('ERROR: invalid state, more than one of up, down, open');
    return 'error';
  }
  if (is_up) {
    return 'up';
  }
  if (is_open) {
    return 'open';
  }
  return 'down';
}

function onStateChange(state) {
  let next_state = read_switch_state();
  if (next_state == state.get_property('position')) {
    return;
  }
  state.set_property('position', next_state);
}

function onConnected() {
  let state = new WebThingState();
  state.create_property({
    name: 'position',
    type: 'string',
    enumerants: ['up', 'open', 'down'],
    initial_value: read_switch_state(),
    title: 'Position',
    description: 'The current position of the knife switch',
    read_only: true
  });
  state.create_property({
    name: 'temperature',
    initial_value: E.getTemperature(),
    title: 'Temperature',
    type: 'number',
    description: 'The value of the onboard temperature sensor'
  });
  let thing = new WebThing(config.thing, state);

  let opts = { repeat: true };
  let watchablePins = [A0, A1, B9, B10, B13, B14, B15];
  for (const pin of watchablePins) {
    setWatch(function(_context, _time, _location) { onStateChange(state); }, pin, opts);
  }

  // Temperature: update once a minute
  setInterval(function() {
    state.set_property('temperature', E.getTemperature());
  }, 60000);
}

function main() {
  espruino.connect_to_wifi(config.wifi, onConnected);
}
E.on('init', main);