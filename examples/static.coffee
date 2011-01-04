#!/usr/bin/env coffee

{parse, main, enable, disable} = require 'cli'

parse {
    log:     ['l', 'Enable logging']
    port:    ['p', 'Listen on this port', 'number', 8080]
    serve:   [false, 'Serve static files from PATH', 'path', './public']
}

main (args, options) ->

    middleware = []
    
    if options.log
        @debug 'Enabling logging'
        middleware.push require('creationix/log')()

    if options.serve
        @debug 'Serving files from ' + options.serve
        middleware.push require('creationix/static')('/', options.serve, 'index.html')
    
    server = @createServer(middleware).listen(options.port)
    
    @ok 'Listening on port ' + options.port