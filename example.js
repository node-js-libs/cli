#!/usr/bin/env node

var cli = require('cli');

var opts = {
    create: ['c', 'Create a new path'],
    email: ['e', 'The email you want to send to. This is a very long description which will still play nice when you use the -h or --help switch', 'EMAIL'],
    fork: ['f', 'Fork this many workers', 'FLOAT', 4],
    input: ['i', 'Read lines from this file', 'FILE']
};

var options = cli.parse(opts), args = cli.args;

console.log(options);
console.log(args);

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