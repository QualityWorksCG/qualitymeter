const phantomas = require('phantomas');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const ProgressBar = require('progress');

var getPerformance = function (config, cb) {

  if (Array.isArray(config.url)) {
    var output = []
    async.each(config.url, function (url, done) {
      _getPerformance(url, function (err, json) {
        //something extra should be done here for errors
        if (err) {
          output.push({ "err": true, "errMessage": err, "url": url });
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
    _getPerformance(config.url, function (err, json) {
      json.url = config.url;
      if (err) {
        cb(err, null);
      }
      else {
        cb(null, _filterData(config, json))
      }
    })
  }
}

function _getPerformance(url, cb) {
  var startTime = moment();
  var bar;

  bar = new ProgressBar('[:bar] :percent :etas', {
    total: 100,
    width: 50
  });

  console.log("Running performance test on: " + url);

  var child = phantomas(url, function (err, json, results) {
    if (err) {
      cb(err, null)
    }
    else {
      json.startTime = startTime;
      cb(null, json);
    }
  });

  child.on('progress', function (progress, inc) { 
    if (bar) {
      bar.tick(inc);
    }
    progress == 100 ? console.log("Saving report data."):"";
    
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
        _output = _findTotalLoadTime(_output, jsonObject);
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

export default getPerformance;