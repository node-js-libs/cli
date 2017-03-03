var assert = require('power-assert');
var util = require('./util');
var spawn = require('child_process').spawn;
var stream = require('stream');

/**
 * test of parsing options
 */
describe('options', function() {
  it('example options', function() {
    process.argv = ['node', 'test.js', '--file=access.log', '--time=42', '--work=awake' ];
    var cli = util.createCliMock();
    cli.parse({
      file: [ 'f', 'A file to process', 'file', 'temp.log' ],
      time: [ 't', 'An access time', 'time', false ],
      work: [ false, 'What kind of work to do', 'string', 'sleep' ]
    });
    assert(cli.options.file === 'access.log');
    assert(cli.options.time === 42);
    assert(cli.options.work === 'awake');
  });

  it('full name', function() {
    process.argv = ['node', 'test.js', '--hoge=hogeoption1' ];
    var cli = util.createCliMock();
    cli.parse({
      hoge: [ 'o', '', 'string' ]
    });
    assert(cli.options.hoge === 'hogeoption1');
  });

  it('short name', function() {
    process.argv = ['node', 'test.js', '-o', 'hogeoption2' ];
    var cli = util.createCliMock();
    cli.parse({
      hoge: [ 'o', '', 'string' ]
    });
    assert(cli.options.hoge === 'hogeoption2');
  });

  it('default option', function() {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    cli.parse({
      hoge: [ 'h', '', 'string', 'hogeoption3' ]
    });
    assert(cli.options.hoge === 'hogeoption3');
  });

  it('as-is', function() {
    process.argv = ['node', 'test.js', '--string=x123x', '--int=123', '--boolean=true' ];
    var cli = util.createCliMock();
    cli.parse({
      string: [ false, '', 'string' ],
      int: [ false, '', 'string' ],
      boolean: [ false, '', 'string' ]
    });
    assert(cli.options.string === 'x123x');
    assert(cli.options.int === 123);
    assert(cli.options.boolean);
  });

  it('valid int', function() {
    process.argv = ['node', 'test.js', '--int=123', '--number=0123', '--num=-42', '--time=-1', '--seconds=65536', '--secs=-65536', '--minutes=1', '--mins=3', '--x=110', '--n=119' ];
    var cli = util.createCliMock();
    cli.parse({
      int: [ false, '', 'int' ],
      number: [ false, '', 'number' ],
      num: [ false, '', 'num' ],
      time: [ false, '', 'time' ],
      seconds: [ false, '', 'seconds' ],
      secs: [ false, '', 'secs' ],
      minutes: [ false, '', 'minutes' ],
      mins: [ false, '', 'mins' ],
      x: [ false, '', 'x' ],
      n: [ false, '', 'n' ],
    });
    assert(cli.options.int === 123);
    assert(cli.options.number === 123);
    assert(cli.options.num === -42);
    assert(cli.options.time === -1);
    assert(cli.options.seconds === 65536);
    assert(cli.options.secs === -65536);
    assert(cli.options.minutes === 1);
    assert(cli.options.mins === 3);
    assert(cli.options.x === 110);
    assert(cli.options.n === 119);
  });

  it('invalid int', function() {
    process.argv = ['node', 'test.js', '--int', 'x123x' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      int: [ false, '', 'int' ]
    });
    assert(util.exitCode !== 0);
  });

  it('valid date', function() {
    process.argv = ['node', 'test.js', '--date=2017-03-01', '--datetime="2017-02-28T15:42:43"', '--date_time="Mar 2 2018 16:44:45 UTC"' ];
    var cli = util.createCliMock();
    cli.parse({
      date: [ false, '', 'date' ],
      datetime: [ false, '', 'datetime' ],
      date_time: [ false, '', 'date_time' ]
    });
    assert(cli.options.date.getTime() === 1488326400000);
    assert(cli.options.datetime.getTime() === 1488296563000);
    assert(cli.options.date_time.getTime() === 1520009085000);
  });

  it('invalid date', function() {
    process.argv = ['node', 'test.js', '--date', 'this is invalid date string' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      date: [ false, '', 'date' ]
    });
    assert(util.exitCode !== 0);
  });

  it('valid float', function() {
    process.argv = ['node', 'test.js', '--float=1.23', '--decimal=-9.99999' ];
    var cli = util.createCliMock();
    cli.parse({
      float: [ false, '', 'float' ],
      decimal: [ false, '', 'decimal' ]
    });
    assert(cli.options.float === 1.23);
    assert(cli.options.decimal === -9.99999);
  });

  it('invalid float', function() {
    process.argv = ['node', 'test.js', '--float', '--++**' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      float: [ false, '', 'float' ]
    });
    assert(util.exitCode !== 0);
  });

  it('valid file', function() {
    process.argv = ['node', 'test.js', '--file=/absolute/path/to/file', '--path=./relative/path/to/file', '--directory=somedirectory/sub', '--dir=../parent/sub' ];
    var cli = util.createCliMock();
    cli.parse({
      file: [ false, '', 'file' ],
      path: [ false, '', 'path' ],
      directory: [ false, '', 'directory' ],
      dir: [ false, '', 'dir' ],
    });
    assert(cli.options.file === '/absolute/path/to/file');
    assert(cli.options.path === './relative/path/to/file');
    assert(cli.options.directory === 'somedirectory/sub');
    assert(cli.options.dir === '../parent/sub');
  });

  it('invalid file', function() {
    process.argv = ['node', 'test.js', '--file', 'path:with*invalid*%token' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      file: [ false, '', 'path' ]
    });
    assert(util.exitCode !== 0);
  });

  it('valid email', function() {
    process.argv = ['node', 'test.js', '--email="sample@sample.com"' ];
    var cli = util.createCliMock();
    cli.parse({
      email: [ false, '', 'email' ]
    });
    assert(cli.options.email === 'sample@sample.com');
  });

  it('invalid email', function() {
    process.argv = ['node', 'test.js', '--email', 'invaid@email@format/xyz.com$invalid' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      email: [ false, '', 'email' ]
    });
    assert(util.exitCode !== 0);
  });

  it('valid url', function() {
    process.argv = ['node', 'test.js', '--url="http://sample.com/"', '--uri="ftp://user:password@sample.com/path"', '--domain=subdomain.domain.biz', '--host=hostname.local' ];
    var cli = util.createCliMock();
    cli.parse({
      url: [ false, '', 'url' ],
      uri: [ false, '', 'uri' ],
      domain: [ false, '', 'domain' ],
      host: [ false, '', 'host' ]
    });
    assert(cli.options.url === 'http://sample.com/');
    assert(cli.options.uri === 'ftp://user:password@sample.com/path');
    assert(cli.options.domain === 'subdomain.domain.biz');
    assert(cli.options.host === 'hostname.local');
  });

  it('invalid url', function() {
    process.argv = ['node', 'test.js', '--url', ':-)' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      url: [ false, '', 'url' ]
    });
    assert(util.exitCode !== 0);
  });

  it('valid ip', function() {
    process.argv = ['node', 'test.js', '--ip=192.168.0.1' ];
    var cli = util.createCliMock();
    cli.parse({
      ip: [ false, '', 'ip' ]
    });
    assert(cli.options.ip === '192.168.0.1');
  });

  it('invalid ip', function() {
    process.argv = ['node', 'test.js', '--ip', '00:ff:00:ff:00:ff' ];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({
      ip: [ false, '', 'ip' ]
    });
    assert(util.exitCode !== 0);
  });

  it('true presented', function() {
    process.argv = ['node', 'test.js', '--bool=true', '--boolean=0', '--on=yes' ];
    var cli = util.createCliMock();
    cli.parse({
      bool: [ false, '', 'bool' ],
      boolean: [ false, '', 'boolean' ],
      on: [ false, '', 'on' ]
    });
    assert(cli.options.bool);
    assert(cli.options.boolean);
    assert(cli.options.on);
  });

  it('true not presented', function() {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    cli.parse({
      bool: [ false, '', 'bool' ],
      boolean: [ false, '', 'boolean' ],
      on: [ false, '', 'on' ]
    });
    assert(cli.options.bool === null);
    assert(cli.options.boolean === null);
    assert(cli.options.on === null);
  });

  it('false presented', function() {
    process.argv = ['node', 'test.js', '--false=true', '--off=0', '--false_opt', '--0_opt' ];
    var cli = util.createCliMock();
    cli.parse({
      'false': [ false, '', 'false' ],
      off: [ false, '', 'off' ],
      false_opt: [ false, '', false ],
      '0_opt': [ false, '', 0 ]
    });
    assert(cli.options.false === false);
    assert(cli.options.off === false);
    assert(cli.options.false_opt === false);
    assert(cli.options['0_opt'] === false);
  });

  it('true not presented', function() {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    cli.parse({
      'false': [ false, '', 'false' ],
      off: [ false, '', 'off' ],
      false_opt: [ false, '', false ],
      '0_opt': [ false, '', 0 ]
    });
    assert(cli.options.false === null);
    assert(cli.options.off === null);
    assert(cli.options.false_opt === null);
    assert(cli.options['0_opt'] === null);
  });
});

/**
 * test of parsing commands
 */
describe('commands', function() {
  it('defined command', function() {
    process.argv = ['node', 'test.js', 'command2'];
    var cli = util.createCliMock();
    cli.parse({}, ['command1', 'command2']);
    assert(cli.command === 'command2');
  });

  it('undefined command', function() {
    process.argv = ['node', 'test.js', 'command3'];
    var cli = util.createCliMock();
    cli.output = function() {};
    cli.parse({}, ['command1', 'command2']);
    assert(util.exitCode !== 0);
  });

  it('auto-completion', function() {
    process.argv = ['node', 'test.js', 'i'];
    var cli = util.createCliMock();
    cli.parse({}, ['install', 'uninstall']);
    assert(cli.command === 'install');
  });
});

/**
 * test of parsing args
 */
describe('args', function() {
  it('no args', function() {
    process.argv = ['node', 'test.js'];
    var cli = util.createCliMock();
    cli.parse();
    assert(cli.args.length === 0);
  });

  it('2 args', function() {
    process.argv = ['node', 'test.js', 'arg1', 'arg2'];
    var cli = util.createCliMock();
    cli.parse();
    assert.deepEqual(cli.args, ['arg1', 'arg2']);
  });
});


/**
 * test of helpers
 */
describe('helpers', function() {
  it('withStdin', function(done) {
    var child = spawn('node', ['test/withstdin.js']);
    var input = ['this', 'is', 'sample input'];
    child.on('close', function() {
    });
    child.stdout.on('data', function(data) {
      assert(data.toString() === 'withStdin return: ' + input.join('\n'));
      done();
    });
    child.stdin.write(input.join('\n'));
    child.stdin.end();
  });

  it('withStdinLines', function(done) {
    var child = spawn('node', ['test/withstdinlines.js']);
    var input = ['this', 'is', 'sample input'];
    child.on('close', function() {
    });
    child.stdout.on('data', function(data) {
      assert(data.toString() === 'withStdinLines return: ' + input.join(':'));
      done();
    });
    child.stdin.write(input.join('\n'));
    child.stdin.end();
  });

  it('toType', function() {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    function myFunc() {}
    assert(cli.toType(myFunc) === 'function');
    assert(cli.toType([]) === 'array');
    assert(cli.toType(new Date()) === 'date');
    assert(cli.toType(1) === 'integer');
    assert(cli.toType(1.1) === 'float');
    assert(cli.toType(Math) === 'math');
    assert(cli.toType(/a/) === 'regexp');
    assert(cli.toType(JSON) === 'json');
  });

  it('progress', function(done) {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    var outStream = new stream.Writable();
    outStream._write = function (chunk, encoding, w_done) {
      assert(chunk.toString() === '50%...');
      done();
    };
    cli.progress(0.5, 0, outStream);
  });

  it('exec', function(done) {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    cli.exec('echo \"hello\nworld\"', function(lines) {
      assert(lines, ['hello', 'world']);
      done();
    });
  });
});


/**
 * test of plugins
 */
describe('plugins', function() {
  it('help enabled', function(done) {
    process.argv = ['node', 'test.js', '--help' ];
    var cli = util.createCliMock();
    // this plugin is enabled by default
    //cli.enable('help');
    cli.no_color = true;
    cli.output = function(line) {
      assert(line.indexOf('Usage:') === 0);
      done();
    };
    cli.parse();
  });

  it('help disabled', function() {
    process.argv = ['node', 'test.js', '--help' ];
    var cli = util.createCliMock();
    cli.disable('help');
    cli.parse();
    assert(util.exitCode !== 0);
  });

  it('version enabled', function(done) {
    process.argv = ['node', 'test.js', '--version' ];
    var cli = util.createCliMock();
    cli.enable('version');
    cli.app ='test_app';
    cli.version = '0.1';
    cli.output = function(line) {
      assert(line.indexOf('test_app v0.1') === 0);
      done();
    };
    cli.parse();
  });

  it('verstion disabled', function() {
    process.argv = ['node', 'test.js', '--version' ];
    var cli = util.createCliMock();
    // this plugin is disabled by default
    //cli.disable('version');
    cli.parse();
    assert(util.exitCode !== 0);
  });

  it('status enabled', function() {
    process.argv = ['node', 'test.js', '-k' ];
    var cli = util.createCliMock();
    cli.enable('status');
    cli.parse();
    assert(cli.no_color === true);
  });

  it('status disabled', function() {
    process.argv = ['node', 'test.js', '-k' ];
    var cli = util.createCliMock();
    // this plugin is disabled by default
    //cli.disable('status');
    cli.parse();
    assert(cli.no_color === false);
  });

  // glob plugin is not working??
  // glob module is required in cli.js but is never used

  it('timeout enabled', function(done) {
    process.argv = ['node', 'test.js', '--timeout=1' ];
    var cli = util.createCliMock();
    cli.enable('timeout');
    cli.output = function() {}
    cli.parse();
    setTimeout(function() {
      assert(util.exitCode !== 0);
      done();
    }, 1100);
  });

  it('timeout disabled', function(done) {
    process.argv = ['node', 'test.js' ];
    var cli = util.createCliMock();
    // this plugin is disabled by default
    //cli.disable('timeout');
    cli.parse();
    setTimeout(function() {
      assert(util.exitCode === undefined);
      done();
    }, 1100);
  });

  // test of catchall plugin is difficult in test method
});

