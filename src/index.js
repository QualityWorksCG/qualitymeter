
import perf from  './qualitymeter';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import pug from 'pug';

var qualitymeter = function () {
  var help = require('./utils/help');

  //If the argument is less than 2, some properties were missing
  if (process.argv.length < 2) {
    console.log('Usage: qualitymeter <URL> [options] (qualitymeter --help to display options)');
  } else {

    var config = _parseCommandArgs(process);

    //if the user wants to see help, we show them and nothing else.
    if (config.isHelp) {
      help.show();
    } else {
      if (config.url == null) {
        console.log("No url was found in the command or configuration file.");
        process.exit(1);
      }

      //if the config data is empty, we populate it with default data.
      if (_.isEmpty(config.fileData)) {
        config = _setDefaultConfigs(config);
      }

      //The verbose options outputs the configurations that are being used.
      if (config.verbose == true) {
        console.log('\nqualitymeter configurations: ');
        console.log(config.fileData);
      }

      //carry out performance tests
      perf(config, function (err, output) {
        if (err) {
          console.log('\nThere was an error running performance test.\n')
          console.log(output);
        }
        else {
          if (config.fileData.output_to_screen && config.fileData.output_to_screen == true) {
            console.log('\nqualitymeter performanace results: ');
            console.log(output);
          }

          //Handle saving to a file
          if (_dataExists(config.fileData.save_to_file)) {
            _saveToFile(config, output, function (err) {
              if (err) {
                console.log('\nThere was a problem saving qualitymeter results to: ' + config.fileData.save_to_file);
                console.log(err);
              }
              else {
                console.log('\nqualitymeter performanace results saved to: ' + config.fileData.save_to_file);

                var fileData = JSON.parse(fs.readFileSync(path.join(process.cwd(), config.fileData.save_to_file), 'utf8'));

                //Handle creating a report - report can only be generated if the data was saved to a file
                if (config.report === true) {

                  //default output file is 'qualitymeter.html'
                  var reportOutput = _dataExists(config.fileData.report_output) ? config.fileData.report_output : "qualitymeter.html";
                  var reportTemplate = _dataExists(config.fileData.report_template) ? _absoluteOrRelative(config.fileData.report_template) : path.join(appRoot.path, "qualitymeter_template.jade");

                  if (reportTemplate == null) {
                    console.log("\nReport template does not exist. [" + path.join(appRoot.path, reportTemplate) + "]");
                  } else {
                    var html = pug.renderFile(reportTemplate, { filename: reportOutput, pretty: true, data: fileData });

                    _writeToFile(html, reportOutput, function (err) {
                      if (err) {
                        console.log("Error saving report");
                        console.log(err);
                      }
                      else {
                        if (config.verbose == true) {
                          console.log("\nSaving performance report to [" + reportOutput + "] complete.");
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        }
      });
    }
  }
};

function _parseCommandArgs(process) {

  var config = {};
  config.isHelp = false;
  config.fileData = {};
  config.verbose = false;
  config.report = false;
  config.url = [];

  var _process = process;
  var argSize = _process.argv.length;

  //We ierate through the commands that were sent to do the correct process
  for (var i = 0; i < argSize; i++) {
    var arg = process.argv[i];
    //console.log(arg);
    switch (arg) {
      case "--help":
      case "-h":
        config.isHelp = true;
        break;

      case "--config":
      case "-c":
        var filepath = process.argv[i + 1];
        try {
          fs.accessSync(path.join(process.cwd(), filepath), fs.F_OK);
          config.fileData = JSON.parse(fs.readFileSync(path.join(process.cwd(), filepath), 'utf8'));
        } catch (e) {
          try {
            fs.accessSync(filepath, fs.F_OK);
            config.fileData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          } catch (e) {
            console.log('File name: ' + filepath + ' does not exist.');
            console.log('Using default configuration settings.');

            config = _setDefaultConfigs(config);
          }
        }
        break;
      case "--verbose":
      case "-v":
        config.verbose = true;
        break;

      case "--report":
      case "-r":
        config.report = true;
        break;
      default:
        break;
    }
  }
  //if there a second argument exists and it doenst start with a dash, we assume it is the url and add http:// infront if needed.
  if (process.argv[2] != undefined && !process.argv[2].startsWith("-")) {
    config.url = (process.argv[2].indexOf('http') !== 0) ? 'http://' + process.argv[2] : process.argv[2];
  }
  else {
    config.url = (config.fileData.urls && config.fileData.urls != undefined) ? config.fileData.urls : null
  }

  return config;
}

function _writeToFile(data, filename, cb) {
  fs.writeFile(filename, data, { flag: 'w' }, function (err, fd) {
    if (err) {
      cb(err)
    } else {
      cb(null);
    }
  });
}

function _saveToFile(config, output, cb) {
  if (_dataExists(config.fileData.file_write_format)) {

    //if the file write format is a or w, we accept it, otherwise we use w
    var flag = (config.fileData.file_write_format.trim() == 'w' || config.fileData.file_write_format.trim() == 'a') ? config.fileData.file_write_format.trim() : "w"
    var resultsData = {};

    if (config.verbose == true) {
      console.log("\nSaving performance test results using '" + flag + "' foramt.");
    }

    if (flag === 'w') {
      output.forEach(function (element) {
        if (resultsData[element.url]) {
          resultsData[element.url].push(element);
        }
        else {
          resultsData[element.url] = [];
          resultsData[element.url].push(element)
        }
      });

      _writeToFile(JSON.stringify(resultsData), config.fileData.save_to_file, function (err) {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      })
    } else {
      //if it is an append format, we check if the file exists, read the data into an array variable, push to the array, then write the data back to the file.
      var existingDataFilePath = _absoluteOrRelative(config.fileData.save_to_file)

      if (existingDataFilePath != null) {
        var existingData = JSON.parse(fs.readFileSync(existingDataFilePath, 'utf8'));

        output.forEach(function (element) {
          if (existingData[element.url]) {
            existingData[element.url].push(element);
          }
          else {
            existingData[element.url] = [];
            existingData[element.url].push(element)
          }
        });

        _writeToFile(JSON.stringify(existingData), config.fileData.save_to_file, function (err) {
          if (err) {
            cb(err);
          } else {
            cb(null);
          }
        })
      } else {
        if (config.verbose == true) {
          console.log("Exisiting file not found, creating a new file: " + path.join(appRoot.path, config.fileData.save_to_file));
        }

        output.forEach(function (element) {
          if (resultsData[element.url]) {
            resultsData[element.url].push(element);
          }
          else {
            resultsData[element.url] = [];
            resultsData[element.url].push(element)
          }
        });

        _writeToFile(JSON.stringify(resultsData), config.fileData.save_to_file, function (err) {
          if (err) {
            cb(err);
          } else {
            cb(null);
          }
        })
      }
    }
  }
}

function _dataExists(data) {
  if (data && data != undefined && data != null && data.length > 0) {
    return true;
  }
  else {
    return false;
  }
}

function _fileExists(filepath) {
  try {
    fs.accessSync(filepath, fs.F_OK);
    return true;
  }
  catch (e) {
    return false;
  }
}

function _setDefaultConfigs(config) {
  var _config = config;

  _config.fileData.urls = [];
  _config.fileData.output_to_screen = true;
  _config.fileData.whitleist = null;
  _config.fileData.save_to_file = null;
  _config.fileData.timeout = 15;
  _config.verbose = false;

  return _config;
}

function _absoluteOrRelative(filepath) {
  try {
    fs.accessSync(path.join(process.cwd(), filepath), fs.F_OK);
    return path.join(process.cwd(), filepath);
  } catch (e) {
    try {
      fs.accessSync(filepath, fs.F_OK);
      return filepath;
    } catch (e) {
      return null;
    }
  }
}

module.exports = qualitymeter;
