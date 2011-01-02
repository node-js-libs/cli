#!/usr/bin/env node

var cli = require('./cli').enableDaemon();

cli.parse({
    create: ['c', 'Create a new path'],
    email: ['e', 'The email you want to send to. This is a very long description which will go over multiple lines (without breaking words) so that the output is <= 80 characters', 'EMAIL'],
    fork: ['fork', 'Fork this many workers', [2,4,6,8], 4],
    input: ['input', 'Read lines from this file', 'FILE']
});

cli.main(function (args, options) {
    
    this.ok('App started successfully');
    
    this.log(options);
    this.log(args);
    
});

// OR..

/*
while (option = cli.next()) {
    switch (option) {
    case 'c':
    case 'create':
        var create = cli.getPath();
        break;
    case 'e':
    case 'email':
        var create = cli.getEmail();
        break;
    case 'f':
    case 'float':
        var create = cli.getFloat(4);
        break;
    default:
        cli.error('Unknown option ' + option);
        break;
    }
}
*/