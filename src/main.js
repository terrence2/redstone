'use strict';
let wifi = require('Wifi');
import config from './config.js';
import webthing from './thing.js';

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

let error_flasher = null;
let wifi_initialized = false;
function connect_to_wifi(complete) {
  if (wifi_initialized) {
    return;
  }
  wifi_initialized = true;
  LED1.write(true);
  wifi.connect(config.wifi.ssid, { 'password': config.wifi.password }, function(err) {
    if (err) {
      console.log('Connection error: ' + err);
      connection_error();
      return;
    }
    console.log('Connected!');
    wifi.getIP(function(err, data) {
      if (err) {
        console.log('ERROR: no IP: ' + err);
        return;
      }
      console.log('IP:  ' + data.ip);
      console.log('MAC: ' + data.mac);
    });
    if (error_flasher) {
      clearInterval(error_flasher);
    }
    LED1.write(false);
    complete();
  });
}

function connection_error() {
  let on = false;
  error_flasher = setInterval(function() {
    on = !on;
    LED1.write(on);
  }, 500);
}

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

let current_state = read_switch_state();
console.log('initial switch state: ' + current_state);

function onStateChange(_state, _time, _lastTime) {
  let next_state = read_switch_state();
  if (next_state == current_state) {
    return;
  }
  current_state = next_state;

  console.log('new state: ' + current_state);
}

function onInit() {
  connect_to_wifi(function() {
    let opts = { repeat: true };
    let watchablePins = [A0, A1, B9, B10, B13, B14, B15];
    for (const pin of watchablePins) {
      setWatch(onStateChange, pin, opts);
    }

    let thing = webthing.start(config.thing);
  });
}
onInit();
