#!/usr/bin/env node

//Enable the status plugin / disable the version plugin
var cli = require('../cli').enable('status').disable('version');

cli.parse({
    newline: ['n', 'Do not output the trailing newline'],
    escape: ['e', 'Enable interpretation of backslash escapes'],
    separator: ['s', 'Separate arguments using this value', 'string', ' '],
    output: [false, 'Write to FILE rather than the console', 'file']
});

cli.main(function (args, options) {
    var output = '', i, l, output_stream;
    
    if (this.argc) {
        if (options.escape) {
            for (i = 0, l = this.argc; i < l; i++) {
                args[i] = this.escape(args[i]);
            }
            options.separator = this.escape(options.separator);
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