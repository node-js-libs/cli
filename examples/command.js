#!/usr/bin/env node

var cli = require('cli');

//The second argument of cli.parse is an optional list of commands. 
//Type `./command.js --help` for usage info

//cli enables auto-completion of commands (similiar to npm), e.g. typing
//"inst", "install", or even just "i" as a command will match "install"

cli.parse(null, ['install', 'test', 'edit', 'remove', 'uninstall', 'ls']);

console.log('Command is: ' + cli.command);