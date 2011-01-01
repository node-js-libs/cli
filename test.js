#!/usr/bin/env node

var cli = require('./');

var opts = {
    create: ['c', 'Create a new path'],
    email: ['e', 'The email you want to send to. This is a very long description so lets see what happens when it breaks words up oh shit i hope it doesnt wtf', true],
    fork: ['f', 'Fork this many workers', 'FLOAT', 4],
    input: ['i', 'Read lines from this file', 'FILE']   
};

var options = cli.parse(opts), args = cli.args;

console.log(options);
console.log(args);

/*
cli.withInput(function (data) {



});
*/

//console.log(cli);

/*
while (option = cli.next()) {
    switch (option) {
    case 'c':
    case 'create':
        var create = cli.getPath();
        break;
    }
}

cli.withInput(function (data) {
    var lines = data.split('\n');
});

cli.setArgv(argv || arg_string);
cli.next();
cli.get(default);
cli.args();
cli.parse(opt_list);

*/