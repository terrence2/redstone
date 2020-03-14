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
let wifi = require('Wifi');

function connect_to_wifi(config, complete) {
  LED1.write(true);
  wifi.connect(config.ssid, { 'password': config.password }, function(err) {
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
    LED1.write(false);
    complete();
  });
}

function connection_error() {
  let on = false;
  setInterval(function() {
    on = !on;
    LED1.write(on);
  }, 500);
}

module.exports = {
  connect_to_wifi: connect_to_wifi
};