#!/usr/bin/env coffee

{parse, main} = require './cli'

parse {
    create: ['c', 'Create a new path']
    email: ['e', 'The email you want to send to. This is a very long description which will go over multiple lines (without breaking words) so that the output is <= 80 characters', 'EMAIL']
    fork: ['f', 'Fork this many workers', 'FLOAT', 4]
    input: ['i', 'Read lines from this file', 'FILE']
}

main (args, options) ->
    @log options
    @log args