var util = require('./util');

var cli = util.createCliMock();
cli.output = function() {}
cli.withStdinLines(function(lines) {
  process.stdout.write('withStdinLines return: ' + lines.join(':'));
});
