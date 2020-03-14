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
//import WebThing from './webthing/webthing.js';
//let WebThingState = require('../src/state.js');

const REPEAT_TIMEOUT = 15;
const DEBOUNCE_TIMEOUT = 30;
const RESTORE_TIMEOUT = 1000;

SPI1.setup({mosi:A7, sck:A5});
function set_color(r, g, b) {
  const HEADER = [0x00, 0x00, 0x00, 0x00];
  const FOOTER = [0xFF, 0xFF, 0xFF, 0xFF];
  let pix = [0xff, b, g, r];
  let buffer = HEADER.concat(pix, pix, pix, pix, FOOTER);
  SPI1.write(buffer);
}

/**
 * A state object for communication with the webthings runtime.
 * 
 * Note: subclassing does not work in espruino, so this class is
 *       intended to be used directly. Users will generally want to
 *       call createProperty before passing the state to WebThing.
 */
class WebThingState {
  constructor() {
    this._properties = {};
    this._property_watchers = {};
  }

  create_property({
    name,
    type,
    initial_value,
    title,
    description,
    read_only = true,
    enumerants = null
  }) {
    this._properties[name] = {
      value: initial_value,
      title: title,
      type: type,
      readOnly: read_only,
      description: description
    };
    if (enumerants != null) {
      this._properties[name]['enum'] = enumerants;
    }
  }

  get_properties() {
    return this._properties;
  }

  get_property_names() {
    let a = [];
    for (let propname in this._properties) {
      a.push(propname);
    }
    return a;
  }

  property_is_read_only(name) {
    return this._properties[name].readOnly || false;
  }

  get_property(name) {
    return this._properties[name].value;
  }

  set_property(name, value) {
    this._properties[name].value = value;
    for (let watch_name in this._property_watchers) {
      const watch_func = this._property_watchers[watch_name];
      watch_func(name, value);
    }
  }

  set_property_link(name, href) {
    this._properties[name]['links'] = [{'rel': 'property', 'href': href}];
  }

  watch_properties(watch_name, watch_func) {
    this._property_watchers[watch_name] = watch_func;
  }

  unwatch_properties(watch_name) {
    delete this._property_watchers[watch_name];
  }
}

const PIN_MAP = {
  A0: 0,
  A1: 1,
  B9: 2,
  B8: 3
};

function onStartButtonPress(initial_pin_value, pin, state, thing) {
  let initial_time = getTime();
  if (initial_pin_value != false) {
    // console.log('' + initial_time + ': reject  ' + PIN_MAP[pin]);
    return;
  }

  // console.log('' + initial_time + ': waiting ' + PIN_MAP[pin]);
  setTimeout(function() {
    let sample_time = getTime();
    let final_pin_value = !!digitalRead(pin);
    if (initial_pin_value == final_pin_value) {
      // console.log('' + sample_time + ': press   ' + PIN_MAP[pin] + ' : ' + initial_time + ' -> ' + sample_time + ' => ' + final_pin_value);
      onFinishButtonPress(pin, state, thing);
    } else {
      // console.log('' + sample_time + ': filter  ' + PIN_MAP[pin]);
    }
  }, DEBOUNCE_TIMEOUT);
}

let prior_state = -1;
function onFinishButtonPress(pin, state, thing) {

  let next_state = PIN_MAP[pin];
  if (next_state == prior_state) {
    return;
  }
  prior_state = next_state;
  state.set_property('most_recent_button_press', next_state);

  setTimeout(function() {
    prior_state = -1;
  }, RESTORE_TIMEOUT);

  // Emit events too?
  //thing.send_event('button_press', next_state);
}

function make_watch_func(pin, state, thing) {
  return function(context) {
    onStartButtonPress(context.state, pin, state, thing);
  };
}

const HEADER = [0x00, 0x00, 0x00, 0x00];
const FOOTER = [0xFF, 0xFF, 0xFF, 0xFF];
let prior_color = '';
function set_solid_color_interval(state, dim) {
  let color = state.get_property('color');
  if (prior_color === color) {
    return;
  }
  prior_color = color;

  let [r, g, b] = colorspace.parse_html(color);
  let pix0 = [0xff, b, g, r];
  let pix1 = pix0;
  if (dim) {
    pix1 = [0xff, 0, 0, 0];
  }

  let buffer = HEADER.concat(pix0, pix1, pix1, pix1, FOOTER);
  SPI1.write(buffer);
}

function clamp(v) {
  return Math.min(255, Math.max(0, v));
}

let time_offset = 0;
function set_wave_color_interval(state) {
  let color = state.get_property('color');
  let [r, g, b] = colorspace.parse_html(color);

  function mkpix(period, r, g, b) {
    let w = time_offset * 3.14 / 180 * period;
    return [
      0xff,
      clamp(b + (b / 2) * Math.sin(w)),
      clamp(g + (g / 2) * Math.sin(w)),
      clamp(r + (r / 2) * Math.sin(w))
    ];
  }

  let buffer = HEADER.concat(
    mkpix(1 / 3, r, g, b),
    mkpix(1 / 9, r, g, b),
    mkpix(1 / 7, r, g, b),
    mkpix(1 / 11, r, g, b),
    FOOTER
  );
  SPI1.write(buffer);

  time_offset += 16;
  time_offset %= 160000;
}

function set_swirl_color_interval(state) {
  const interval = 6000;
  let h = (time_offset % interval) / interval;
  let [r, g, b] = E.HSBtoRGB(h, 1, 0.5, true);

  function mkpix(period, r, g, b) {
    let w = time_offset * 3.14 / 180 * period;
    return [
      0xff,
      clamp(b + (b / 2) * Math.sin(w)),
      clamp(g + (g / 2) * Math.sin(w)),
      clamp(r + (r / 2) * Math.sin(w))
    ];
  }

  let buffer = HEADER.concat(
    mkpix(1 / 3, r, g, b),
    mkpix(1 / 9, r, g, b),
    mkpix(1 / 7, r, g, b),
    mkpix(1 / 11, r, g, b),
    FOOTER
  );
  SPI1.write(buffer);

  time_offset += 16;
  time_offset %= 16000000;
}

function set_flame_color_interval(state) {
  let color = state.get_property('color');
  let [r, g, b] = colorspace.parse_html(color);

  function mkpix(period, amplitude, r, g, b) {
    let w = time_offset * 3.14 / 180;
    let wind_effect = (1 + Math.sin(w / 7)) / 2 * (1 + Math.sin(w / 5)) / 2;
    let flicker = wind_effect * Math.random();
    return [
      0xff,
      clamp(b + (b * amplitude + flicker * 5) * Math.sin(w * period + flicker)),
      clamp(g + (g * amplitude + flicker * 5) * Math.sin(w * period + flicker)),
      clamp(r + (r * amplitude + flicker * 5) * Math.sin(w * period + flicker))
    ];
  }

  let buffer = HEADER.concat(
    mkpix(1 / 2, 1 / 8, 128, 64, 0),
    mkpix(1 / 3, 1 / 6, 192, 32, 0),
    mkpix(1 / 7, 1 / 2, 96, 96, 32),
    mkpix(1 / 5, 1 / 4, 128, 64, 0),
    FOOTER
  );
  SPI1.write(buffer);

  time_offset += 16;
  time_offset %= 160000;
}

let thing = null;
function onConnected() {
  let state = state = new WebThingState();
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
  thing = new WebThing(config.thing, state);
  // state.set_property('color', 'rgb(128, 64, 0)');
  // state.set_property('effect', 'swirl');

  // Button: listen for presses
  pinMode(A0, 'input_pullup');
  pinMode(A1, 'input_pullup');
  pinMode(B9, 'input_pullup');
  pinMode(B8, 'input_pullup');
  const opts = { repeat: true, debounce: REPEAT_TIMEOUT };
  setWatch(make_watch_func(A0, state, thing), A0, opts);
  setWatch(make_watch_func(A1, state, thing), A1, opts);
  setWatch(make_watch_func(B9, state, thing), B9, opts);
  setWatch(make_watch_func(B8, state, thing), B8, opts);

  // Color: refresh driver
  setInterval(function() {
    let effect = state.get_property('effect');
    if (effect === 'wave') {
      set_wave_color_interval(state);
    } else if (effect === 'swirl') {
      set_swirl_color_interval(state);
    } else if (effect === 'flame') {
      set_flame_color_interval(state);
    } else if (effect === 'dim') {
      set_solid_color_interval(state, true);
    } else {
      set_solid_color_interval(state, false);
    }
  }, 16);

  // Temperature: update once a minute
  setInterval(function() {
    state.set_property('temperature', E.getTemperature());
  }, 60000);
}

function main() {
  set_color(255, 0, 0);
  espruino.connect_to_wifi(config.wifi, onConnected);
  // onConnected();
}

E.on('init', main);