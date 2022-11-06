'use strict';
const process = require('process');

function createQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

module.exports = {
  createQueryString,
};
