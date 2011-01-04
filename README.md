**cli is a tool for rapidly building NodeJS command line apps**

It includes a full featured opts/args parser + plugin support to add commonly used options.

## Examples

**sort.js**

    #!/usr/bin/env node
    
    require('cli').withStdinLines(function (lines, newline) {
        this.output(lines.sort().join(newline));
    });
    
Try it out

    ./sort.js < input.txt

**static.js** - a static file server with daemon support (requires `npm install creationix daemon`)

    #!/usr/bin/env node

    var cli = require('cli').enable('status','daemon');

    var options = cli.parse({
        log:     ['l', 'Enable logging'],
        port:    ['p', 'Listen on this port', 'number', 8080],
        serve:   [false, 'Serve static files from PATH', 'path', './public']
    });

    cli.main(function () {
        var server, middleware = [];
        
        if (options.log) {
            this.debug('Enabling logging');
            middleware.push(require('creationix/log')());
        }

        this.debug('Serving files from ' + options.serve);
        middleware.push(require('creationix/static')('/', options.serve, 'index.html'));
        
        server = this.createServer(middleware).listen(options.port);
        
        this.ok('Listening on port ' + options.port);
    });
    
To output usage information

    $ ./static.js --help
    
To create a daemon that serves files from /tmp, run

    $ ./static.js -ld --serve=/tmp

Need to view the log? `$ ./static.js -d log`. Need to stop the daemon? `$ ./static.js -d stop`. 

For those interested, [here is the same app written in CoffeeScript](https://github.com/chriso/cli/blob/master/examples/static.coffee).
    
For more examples, see [./examples](https://github.com/chriso/cli/tree/master/examples).

## Installation

[cli.js](https://github.com/chriso/cli/raw/master/cli.js) is self-contained module so that you can easily bundle it with your app.

Alternatively, you can install cli with [npm](http://npmjs.org/)

    $ npm install cli

## Plugins

Plugins are a way of adding common opts and can be enabled using `cli.enable(plugin1, [plugin2, ...]);`, and disabled using the equivalent `disable()`, e.g.

    cli.enable('daemon','status');
   
Available plugins are:

**help** - *enabled by default*

Adds `-h,--help` to output auto-generated usage information

**version** - *enabled by default*

Adds `-v,--version` to output version information for the app.

Set the version using

    cli.setVersion(version) //OR
    cli.setVersion(path_to_packagejson);
    
If setVersion isn't called, cli will attempt to locate *package.json* in `./`, `../`, or `../../`

**status**

Adds methods to output stylized/colored status messages to the console `cli.info(msg)`, `cli.debug(msg)`, `cli.ok(msg)`, `cli.error(msg)`, `cli.fatal(msg)`

`--debug` is required to show any messages output with `cli.debug(msg)`

`-s,--silent` will omit all status messages (except for fatal)

**daemon**  - *requires* `npm install daemon`
    
Adds `-d,--daemon ARG` for daemonizing the process and controlling the resulting daemon

`ARG` can be either start (default), stop, restart, pid (outputs the daemon's pid if it's running), or log (output the daemon's stdout+stderr)

**timeout**

Adds `-t,--timeout N` to exit the process after N seconds with an error

**catchall**

Adds `-c,--catch` to catch and output uncaughtExceptions and resume execution

## Other helpers

cli has helper methods for working with input (stdin). *callback* receives stdin either a string, or an array of input lines (where \n or \r\n is detected automatically)

    cli.withStdin(callback)
    cli.withStdinLines(callback)
    
To spawn a child process, use

    cli.exec(cmd, callback)

*callback* receives the output of the process (split into lines)
 
cli also comes bundled with kof's [node-natives](https://github.com/kof/node-natives) and creationix' [stack](https://github.com/creationix/stack)

To access any native node module, use

    cli.native[module] //e.g. cli.native.path
    
To create a basic middleware stack, use

    cli.createServer(middleware).listen(port)

## LICENSE

(MIT license)

Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.