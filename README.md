**cli is a tool for rapidly building NodeJS or CoffeeScript command line apps**

It includes:

- A full featured opts/args parser
- Support for plugins, such as daemon (see below)
- Automatically build usage details with `-h,--help`
- Auto-detect the app version from a nearby *package.json* when using `-v,--version`

## Example

*echo.js* - similiar to *echo(1)*

    #!/usr/bin/env node

    //Enable the status plugin / disable the version plugin
    var cli = require('cli').enable('status').disable('version');
    
    cli.parse({
        //long_opt: [short_opt, description, value_type, default_value]
        newline: ['n', 'Do not output the trailing newline'],
        escapes: ['e', 'Enable interpretation of backslash escapes'],
        separator: ['s', 'Separate arguments using this value', 'string', ' '],
        output: [false, 'Write to FILE rather than the console', 'file']
    });
    
    cli.main(function (args, options) {
        var output = '', i, l, output_stream;
        
        if (this.argc) {
            if (options.escape) {
                for (i = 0, l = this.argc; i < l; i++) {
                    args[i].replace('\\n','\n')
                           .replace('\\r','\r')
                           .replace('\\t','\t');
                }
            }
            output += args.join(options.separator);
        }
        
        if (!options.newline) {
            output += '\n';
        }
        
        try {
            if (options.output) {
                output_stream = this.native.fs.createWriteStream(options.output)
            } else {
                output_stream = process.stdout;
            }
            output_stream.write(output);
        } catch (e) {
            this.fatal('Could not write to output stream');
        }
    });
    
To output usage information

    $ ./echo.js --help
    
All of the following commands are equivalent and write `foo\tbar` to *out.txt*

    $ ./echo.js -n -e --output=out.txt "foo\tbar"
    $ ./echo.js --newline --escape --output "out.txt" "foo\tbar"
    $ ./echo.js -ne --output=out.txt "foo\tbar"
    $ ./echo.js -en --output=out.txt "foo\tbar"

For those interested, [here is the same app written in CoffeeScript](https://gist.github.com/762999)

## Installation

[cli.js](https://github.com/chriso/cli/raw/master/cli.js) is self-contained so that you can easily bundle the file with your app.

Alternatively, you can install cli with [npm](http://npmjs.org/)

    $ npm install cli

## Plugins

Plugins can be enabled using `cli.enable(plugin1, [plugin2, ...]);`, and disabled using the equivalent `disable()`, e.g.

    cli.enable('daemon', 'status');
   
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

**Other bundled goodies**

cli comes bundled with kof's [node-natives](https://github.com/kof/node-natives) and creationix' [stack](https://github.com/creationix/stack)

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