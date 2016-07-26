'use strict';

module.exports = {
    show: function show() {
        //display help menu
        console.log([' Usage: qualitymeter [url] [options]', '', ' qualitymeter options:', '', '  -h, --help                               Output usage information (You are here)', '  --verbose, -v                            Output configuration details that are being used', '  --config/-c /path/to/config.json         Set the config json file to be used', '', 'The url parameter is not needed if urls are provided in the config file.\n\n',' Example usage:', '   qualitymeter google.com --config=qualitymeter.json', '   qualitymeter google.com', '   qualitymeter google.com --config=qualitymeter.json -v', '  \n Example config file structure: ', '  {\n    "urls":[ "url" ],\n    "output_to_screen": true,\n    "whitelist": ["property"]\n  }'].join('\n'));
    }
};