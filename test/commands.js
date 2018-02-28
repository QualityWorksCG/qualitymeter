import rewire from 'rewire';
import chai from 'chai';
import should from 'should';

var index = rewire('../src/index.js');
var parseCommands = index.__get__('_parseCommandArgs');

describe('Testing parsing of command line args', function () {

  it('should return default configurations when there are no arguments.', function () {
    var _process = {};
    _process.argv = [];

    parseCommands(_process).should.eql({
      isHelp: false,
      fileData: {
        cookies: null,
        output_to_screen: true,
        save_to_file: null,
        screenshot: false,
        timeout: 15,
        urls: [],
        whitleist: null
      },
      verbose: false,
      report: false,
      url: []
    });
  })
});