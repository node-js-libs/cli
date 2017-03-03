var util = require('./util');

var cli = util.createCliMock();
cli.output = function() {}
cli.withStdin(function(lines) {
  process.stdout.write('withStdin return: ' + lines);
});
