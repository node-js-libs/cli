#!/usr/bin/env node

var cli = require('cli');

// Pipe a command that takes a while to finish into cat and see the difference
// that forEachStdinLine makes.
// Try running each with "lsof | cat.js" and see what happens.

// Before: waits for Stdin to finish before outputting anything.
//cli.withStdinLines(function (lines, newline) {
//    lines.forEach(function (line) {
//        this.output(line);
//    });
//});

// After: outputs each line as they come in.
cli.forEachStdinLine(function (line, newline) {
    this.output(line);
});
