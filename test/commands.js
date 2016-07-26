import rewire from 'rewire';
import chai from 'chai';
import should from 'should';

var index = rewire('../src/index.js');
var parseCommands = index.__get__('_parseCommandArgs');

describe("Testing parsing of command line args", function () {

    it("should return default configurations when there are no arguments.", function () {
        var _process = {};
        _process.argv = [];

        parseCommands(_process).should.eql({
            isHelp: false,
            fileData: {},
            verbose: false,
            report: false,
            url: []
        });
    })
})