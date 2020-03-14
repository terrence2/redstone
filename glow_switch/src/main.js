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
import colorspace from '../node_modules/redstone/src/util/colorspace.js';
import DotStar from '../node_modules/redstone/src/hardware/dotstar.js';
import EffectSystem from '../node_modules/redstone/src/effect_system.js';
import espruino from '../node_modules/redstone/src/hardware/espruino_wifi.js';
import WebThing from '../node_modules/redstone/src/webthing.js';
import WebThingState from '../node_modules/redstone/src/state.js';

const REPEAT_TIMEOUT = 15;
const DEBOUNCE_TIMEOUT = 30;
const RESTORE_TIMEOUT = 1000;

const PIN_MAP = {
  A0: 0,
  A1: 1,
  B9: 2,
  B8: 3
};

function onStartButtonPress(initial_pin_value, pin, thing) {
  let initial_time = getTime();
  if (initial_pin_value != false) {
    return;
  }

  setTimeout(function() {
    let sample_time = getTime();
    let final_pin_value = !!digitalRead(pin);
    if (initial_pin_value == final_pin_value) {
      onFinishButtonPress(pin, thing);
    }
  }, DEBOUNCE_TIMEOUT);
}

let prior_state = -1;
function onFinishButtonPress(pin, thing) {
  let next_state = PIN_MAP[pin];
  if (next_state == prior_state) {
    return;
  }
  prior_state = next_state;
  thing.state.set_property('most_recent_button_press', next_state);

  // Emit events too?
  //thing.send_event('button_press', next_state);

  // Reset prior_state lockout after a second so that we can re-send if
  // the hub messes up, was offline, or something.
  setTimeout(function() { prior_state = -1; }, RESTORE_TIMEOUT);
}

function make_watch_func(pin, thing) {
  return function(context) {
    onStartButtonPress(context.state, pin, thing);
  };
}

function onConnected() {
  let state = new WebThingState();
  state.create_property({
    name: 'most_recent_button_press',
    type: 'integer',
    initial_value: 0,
    title: 'MostRecentButtonPress',
    description: 'The most recently pressed button'
  });
  state.create_property({
    name: 'color',
    type: 'string',
    initial_value: 'none',
    title: 'Color',
    description: 'The color to set the LEDs',
    read_only: false
  });
  state.create_property({
    name: 'effect',
    type: 'string',
    enumerants: ['solid', 'wave'],
    initial_value: 'solid',
    title: 'EffectStyle',
    description: 'The effect style with which to drive the LEDs',
    read_only: false
  });
  state.create_property({
    name: 'temperature',
    initial_value: E.getTemperature(),
    title: 'Temperature',
    type: 'number',
    description: 'The value of the onboard temperature sensor'
  });
  let thing = new WebThing(config.thing, state);

  let effects = new EffectSystem(leds);
  thing.state.watch_properties('effect_system', function(prop_name, value) {
    if (prop_name == 'effect') {
      effects.set_effect(value);
    } else if (prop_name == 'color') {
      effects.set_color(colorspace.parse_html(value));
    }
  });

  // Button: listen for presses
  pinMode(A0, 'input_pullup');
  pinMode(A1, 'input_pullup');
  pinMode(B9, 'input_pullup');
  pinMode(B8, 'input_pullup');
  const opts = { repeat: true, debounce: REPEAT_TIMEOUT };
  setWatch(make_watch_func(A0, thing), A0, opts);
  setWatch(make_watch_func(A1, thing), A1, opts);
  setWatch(make_watch_func(B9, thing), B9, opts);
  setWatch(make_watch_func(B8, thing), B8, opts);

  // Temperature: update once a minute
  setInterval(function() {
    state.set_property('temperature', E.getTemperature());
  }, 60000);
}

let leds = new DotStar(SPI1, {mosi:A7, sck:A5}, 4);
function main() {
  leds.fill_color([255, 0, 0]);
  leds.refresh();
  espruino.connect_to_wifi(config.wifi, onConnected);
}

E.on('init', main);