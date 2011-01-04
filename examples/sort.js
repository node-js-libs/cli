#!/usr/bin/env node

require('cli').disable('usage','help').withStdinLines(function (lines, separator) {
    this.output(lines.sort().join(separator));
});