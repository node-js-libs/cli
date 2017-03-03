var proxyquire = require('proxyquire');

/** exit code called from cli by using exit package */
var exitCode = undefined;

/**
 * create cli mock using stub of exit package
 */
function createCliMock() {
  exitCode = undefined;
  return proxyquire('../cli', {
    exit: function(code) {
      exitCode = code;
    }
  });
}

module.exports = {
  createCliMock: createCliMock,
  exitCode: exitCode
}
