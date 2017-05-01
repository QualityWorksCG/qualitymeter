const phantomas = require('phantomas');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const ProgressBar = require('progress');
const tough = require('tough-cookie');
const Cookie = tough.Cookie;
const CookieJar = new tough.CookieJar();
const request = require('request');
var FileCookieStore = require('file-cookie-store');

var getPerformance = function (config, cb) {

  if (Array.isArray(config.url)) {
    var output = [];
    var index = 0;
    async.each(config.url, function (url, done) {
      _getPerformance(url, config.fileData.timeout, config.fileData.cookies, config.fileData.screenshot, function (err, json) {
        if (err) {
          output.push(_setError(err, url, config.fileData.timeout));
          done();
        } else {
          output.push(json);
          done();
        }
      })
    }, function (err) {
      if (err) {
        cb(err, null);
      }
      else {
        cb(null, _filterData(config, output))
      }
    });
  }
  else {
    _getPerformance(config.url, config.fileData.timeout, config.fileData.cookies, config.fileData.screenshot, function (err, json) {
      if (err) {
        cb(err, _setError(err, config.url, config.fileData.timeout));
      }
      else {
        json.url = config.url;
        cb(null, _filterData(config, json))
      }
    })
  }
}

function _getPerformance(url, timeout, cookieDough, screenshot, cb) {
  var bar;
  var startTime = moment().format("MMM Do, YYYY h:mm:ss a");
  var screenshotName = null;

  bar = new ProgressBar('[:bar] :percent :etas', {
    total: 100,
    width: 50
  });

  console.log("Running performance test on: " + url);

  if (screenshot === true) {
    screenshotName = "screenshots/screenshot - " + url.replace(/\//g, "_") + ".png";
  }
  
  var child = phantomas(url, { timeout: timeout, config:"./config.json", log:"pjs-log.txt", screenshot: screenshotName }, function (err, json, results) {
    if (err) {
      cb(err, null)
    }
    else {

      var endTime = moment().format("MMM Do, YYYY h:mm:ss a");
      json.startTime = startTime;
      json.endTime = endTime;
      cb(null, json);
    }
  });

  child.on('progress', function (progress, inc) {
    if (bar) {
      bar.tick(inc);
    }
    progress = progress == 100 ? 0 : progress;

  });
}

function _filterData(config, json) {
  var output = {};

  if (config.fileData.whitelist && config.fileData.whitelist != null && config.fileData.whitelist.length > 0) {
    if (Array.isArray(json)) {
      output = [];
      _.forEach(json, function (jsonObject) {
        var _output = {};
        if (!jsonObject.err) {
          _.forEach(config.fileData.whitelist, function (element) {

            if (_.get(jsonObject, element) != undefined) {
              _output[element] = _.get(jsonObject, element);
            }
            else {
              _output[element] = "Property not found";
            }
          })
          _output["url"] = _.get(jsonObject, "url");
          _output["startTime"] = _.get(jsonObject, "startTime");
          _output["endTime"] = _.get(jsonObject, "endTime");
          _output = _findTotalLoadTime(_output, jsonObject);
          output.push(_output);
        }
        else {
          output.push(jsonObject);
        }
      })
    } else {
      if (!json.err) {
        _.forEach(config.fileData.whitelist, function (element) {
          if (_.get(json, element) != undefined) {
            output[element] = _.get(json, element);
          }
          else {
            output[element] = "Property not found";
          }
        })
        output["url"] = _.get(json, "url");
        output["startTime"] = _.get(json, "startTime");
        output["endTime"] = _.get(json, "endTime");
        output = _findTotalLoadTime(output, json);
      }
      else {
        output = json;
      }
    }
  }
  else {
    output = _findTotalLoadTime(json, json);
  }

  return output;
}

function _findTotalLoadTime(output, json) {
  if (_.get(json, "metrics.timeToFirstByte") != undefined && _.get(json, "metrics.domComplete") != undefined) {
    try {

      output["total_load_time"] = parseInt(_.get(json, "metrics.timeToFirstByte")) + parseInt(_.get(json, "metrics.domComplete"));
    }
    catch (e) {
      output["total_load_time"] = null;
    }
  }
  else {
    output["total_load_time"] = null;
  }

  return output;
}

function _setError(err, url, timeout) {
  var errObj = { "err": true, "errMessage": err, "url": url, "errDescription": "" };

  if (err.toString() == 'Error: 254') {
    errObj.errDescription = "The url may be invalid";
  }
  else if (err.toString() == 'Error: 252') {
    errObj.errDescription = "The website may not have loaded within the given timeout period. (" + timeout + "s)";
  }

  return errObj;
}

function bake_cookies(cookieDough, url) {
  var jar = null
  if (cookieDough && Array.isArray(cookieDough) && cookieDough.length > 0) {
    jar = request.jar();
    cookieDough.forEach(function (piece) {
      var cookieString = "";
      Object.keys(piece).forEach(function (key) {

        if (key === 'key') {
          cookieString += piece.key + "=" + piece.value + ",";
        } else {
          cookieString += key + "=" + piece[key] + ",";
        }
      });

      var cookie = request.cookie(cookieString);
      jar.setCookie(cookie, url);
    });
  }

  return jar;
}

export default getPerformance;