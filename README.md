# qualitymeter
### A customizable web performance metrics collector.

[![Build Status](https://travis-ci.org/QualityWorksCG/qualitymeter.svg)](https://travis-ci.org/QualityWorksCG/qualitywatcher)
[![npm version](https://badge.fury.io/js/qualitymeter.svg)](https://badge.fury.io/js/qualitywatcher)
[![npm Downloads](https://img.shields.io/npm/dt/qualitymeter.svg)](https://www.npmjs.com/package/qualitywatcher)
[![Dependency Status](https://david-dm.org/qualityworkscg/qualitymeter.svg)](https://david-dm.org/qualityworkscg/qualitywatcher)
[![npm](https://img.shields.io/npm/l/qualitymeter.svg)](https://www.npmjs.com/package/qualitywatcher)

---
## Requirements
___
* [NodeJS](http://nodejs.org)
* [PhantomJS](http://phantomjs.org/)

## Installation
---
```
npm install qualitymeter -g
```

## Usage
* Using default settings
```
qualitymeter [url]
```

* Avaiable tags
```
--help, -h                                  View the help screen of the module

--config, -c [/path/to/config/file.json]    Use a custom configuration file.

--verbose, -v                               Outputs configuration details being used, 
                                            along with additional output that may help with debugging.

--report, -r                                Generates an html report from the performance data retrieved.
```

## Configuration File
---
Default configurations are as follows:

urls: null \
output_to_screen: true \
save_to_file: null \
file_write_format: w \
report_output: null \
report_template: null \
whitelist: null \

A custom configuration file can be added with the following format
```
{
    "urls": ["url1", "url2", ...],
    "output_to_screen": true,   //output performance results to screen
    "save_to_file": "path/to/file.json",
    "file_write_format": "a",   //a to append, w to overwrite the report json file
    "report_output": "/path/to/file.html",
    "report_template":"/path/to/file.jade",
    "whitelist": ["metrics.timeToFirstByte", "", ...]
}
```

**N.B. the whitelist property can be used to only retrieve specific information from the performance metrics. The other possible metrics can be seen at the [phantomas module](https://github.com/macbre/phantomas)**

This module was made possible with the help of the phantomjs and phantomas frameworks.




