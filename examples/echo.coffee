#!/usr/bin/env coffee

{parse, main, enable, disable} = require 'cli'

enable 'status'
disable 'version'

parse {
    newline: ['n', 'Do not output the trailing newline']
    escape: ['e', 'Enable interpretation of backslash escapes']
    separator: ['s', 'Separate arguments using this value', 'string', ' ']
    output: [false, 'Write to FILE rather than the console', 'file']
}

main ->
    output = ''
    
    if @argc
        if @options.escape
            @args[i] = @escape arg for arg, i in @args
            @options.separator = @escape @options.separator
        output += @args.join @options.separator
    
    output += '\n' if not @options.newline
    
    try
        if @options.output
            output_stream = @native.fs.createWriteStream @options.output
        else
            output_stream = process.stdout
        output_stream.write output
    catch err
        @fatal 'Could not write to output stream'