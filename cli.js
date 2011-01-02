/**
 * Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    daemon = require('daemon'),
    childp = require('child_process'),
    cwd = process.cwd();

var app, argv, curr_opt, curr_val, full_opt, is_long,
    short_tags = [], opt_list, parsed = {},
    version, usage, eq, len, argv_parsed;

var enable_daemon, daemon_arg, lock_file, log_file;

//Inherit from `console`
for (var i in console) {
    exports[i] = console[i];
}

//Provide easy access to some built-in node methods
exports.exec = function (cmd, callback) {
    childp.exec(cmd, function (err, stdout, stderr) {
        if (err || stderr) {
            exports.fatal('exec() failed\n' + (err || stderr));
        }
        callback(stdout.split('\n'));
    });
}

exports.options = {};
exports.args = [];

exports.enableDaemon = function () {
    enable_daemon = true;
    return exports;
}

exports.setArgv = function (arr, keep_arg0) {
    if (!(arr instanceof Array)) {
        arr = arr.split(' ');
    }
    app = arr.shift();
    //Strip off argv[0] if it's 'node'
    if (!keep_arg0 && 'node' === app) {
        app = arr.shift();
    }
    app = path.basename(app);
    exports.args = argv = arr;
    argv_parsed = false;
};

exports.setArgv(process.argv);

exports.next = function () {
    if (!argv_parsed) {
        exports.args = [];
        argv_parsed = true;
    }
    
    curr_val = null;
    
    //If we're currently in a group of short opts (e.g. -abc), return the next opt
    if (short_tags.length) {
        curr_opt = short_tags.shift();
        full_opt = '-' + curr_opt;
        return curr_opt;
    }
    
    if (!argv.length) {
        return false;
    }
    
    curr_opt = argv.shift();
    
    //If an escape sequence is found (- or --), subsequent opts are assumed to be args
    if (curr_opt === '-' || curr_opt === '--') {
        while (argv.length) {
            exports.args.push(argv.shift());
        }
        return false;
    }
    
    //If the next element in argv isn't an opt, add it to the list of args
    if (curr_opt[0] !== '-') {
        exports.args.push(curr_opt);
        return exports.next();
    } else {
        //Check if the opt is short/long
        is_long = curr_opt[1] === '-';
        curr_opt = curr_opt.substr(is_long ? 2 : 1);
    }
    
    //Accept grouped short opts, e.g. -abc => -a -b -c
    if (!is_long && curr_opt.length > 1) {
        short_tags = curr_opt.split('');
        return exports.next();
    }
    
    //Check if the long opt is in the form --option=VALUE
    if (is_long && (eq = curr_opt.indexOf('=')) >= 0) {
        curr_val = curr_opt.substr(eq + 1);
        curr_opt = curr_opt.substr(0, eq);
        len = curr_val.length;
        //Allow values to be quoted
        if ((curr_val[0] === '"' && curr_val[len - 1] === '"') ||
            (curr_val[0] === "'" && curr_val[len - 1] === "'"))
        {
            curr_val = curr_val.substr(1, len-2);
        }
    }
    
    //Save the opt representation for later
    full_opt = (is_long ? '--' : '-') + curr_opt;
    
    return curr_opt;
};

exports.parse = function (opts) {
    var default_val, i, parsed = exports.options;
    opt_list = opts;
    while (o = exports.next()) {
        for (opt in opt_list) {
            if (o === opt || o === opt_list[opt][0]) {
                if (opt_list[opt].length === 2) {
                    parsed[opt] = true;
                    break;
                }
                default_val = null;
                if (opt_list[opt].length === 4) {
                    default_val = opt_list[opt][3];
                }
                if (opt_list[opt][2] instanceof Array) {
                    for (i = 0, l = opt_list[opt][2].length; i < l; i++) {
                        if (typeof opt_list[opt][2][i] === 'number') {
                            opt_list[opt][2][i] += '';
                        }
                    }
                    parsed[opt] = exports.getValueFromArr(is_long ? null : default_val, opt_list[opt][2]);
                    break;
                }
                if (opt_list[opt][2].toLowerCase) {
                    opt_list[opt][2] = opt_list[opt][2].toLowerCase();
                }
                switch (opt_list[opt][2]) {
                case 'string':
                case 1:
                case true:
                    parsed[opt] = exports.getValue(default_val);
                    break;
                case 'int':
                case 'number':
                case 'num':
                    parsed[opt] = exports.getInt(default_val);
                    break;
                case 'float':
                case 'decimal':
                    parsed[opt] = exports.getFloat(default_val);
                    break;
                case 'path':
                case 'file':
                case 'directory':
                case 'dir':
                    parsed[opt] = exports.getPath(default_val, opt_list[opt][2]);
                    break;
                case 'email':
                    parsed[opt] = exports.getEmail(default_val);
                    break;
                case 'url':
                case 'uri':
                case 'domain':
                    parsed[opt] = exports.getUrl(default_val, opt_list[opt][2]);
                    break;
                case 'ip':
                    parsed[opt] = exports.getIp(default_val);
                    break;
                case 'bool':
                case 'boolean':
                case 'on':
                    parsed[opt] = true;
                case 'false':
                case 'off':
                case false:
                case 0:
                    parsed[opt] = false;
                default:
                     exports.fatal('Unknown opt type "' + opt_list[opt][2] + '"');
                }
                break;
            }
        }
        if (typeof parsed[opt] === 'undefined') {
            if (o === 'v' || o === 'version') {
                exports.getVersion();
            } else if (o === 'h' || o === 'help') {
                exports.getUsage();
            } else if (enable_daemon && (o === 'd' || o === 'daemon')) {
                daemon_arg = exports.getValueFromArr(is_long ? null : 'start', ['start','stop','restart','pid','log']);
            } else {
                exports.fatal('Unknown option ' + full_opt);
            }
        }
        
    }
    return parsed;
};

/**
 * Outputs a styled message to the console.
 *
 * @param {String} msg
 * @param {String} type (optional)
 * @api public
 */
var status = function (msg, type) {
    switch (type) {
    case 'info': 
        msg = '\x1B[33mINFO\x1B[0m: ' + msg; 
        break;
        
    case 'debug':
        msg = '\x1B[36mDEBUG\x1B[0m: ' + msg; 
        break;
        
    case 'error': 
    case 'fatal': 
        msg = '\x1B[31mERROR\x1B[0m: ' + msg;
        break;
        
    case 'ok': 
        msg = '\x1B[32mOK\x1B[0m: ' + msg; 
        break; 
    }
    console.log(msg);
    if (type === 'fatal') {
        process.exit(1);
    }
};
['info', 'error', 'fatal', 'ok', 'debug'].forEach(function (type) {
    exports[type] = function (msg) {
        status(msg, type);
    };
});

exports.setVersion = function (v) {
    if (v.indexOf('package.json')) {
        exports.parsePackageJson(v);
    } else {
        version = v;
    }
};

exports.getVersion = function () {
    if (typeof version === 'undefined') {
        //Look for a package.json
        exports.parsePackageJson();
    }
    console.log(app + ' v' + version);
    process.exit();
};

exports.parsePackageJson = function (path) {
    var parse_packagejson = function (path) {
        var packagejson = JSON.parse(fs.readFileSync(path, 'utf8'));
        version = packagejson.version;
    };
    
    var try_all = function (arr, func, err) {
        for (var i = 0, l = arr.length; i < l; i++) {
            try {
                func(arr[i]);
                return;
            } catch (e) {
                if (i === l-1) {
                    exports.fatal(err);
                }
            }
        }
    };
    
    try {
        if (path) {
            return parse_packagejson(path);
        }
        
        try_all([
            __dirname + '/package.json', 
            __dirname + '/../package.json',
            __dirname + '/../../package.json'
        ], parse_packagejson);
    } catch (e) {
        exports.fatal('Could not detect ' + app + ' version');
    }
};

exports.setUsage = function (u) {
    usage = u;
};

exports.getUsage = function () {
    var short, desc, optional, line, seen_opts = [],
        switch_pad = 25;
    
    var pad = function (str, len) {
        if (typeof len === 'undefined') {
            len = str;
            str = '';
        }
        if (str.length < len) {
            len -= str.length;
            while (len--) str += ' ';
        }
        return str;
    };

    var trunc_desc = function (prefix, desc, len) {
        var pref_len = prefix.length,
            desc_len = 80 - pref_len, 
            truncated = '';
        
        if (desc.length <= desc_len) {
            return desc;
        }
        
        var desc_words = desc.split(' '), chars = 0, word;
        
        while (desc_words.length) {
            truncated += (word = desc_words.shift()) + ' ';
            chars += word.length;
            if (desc_words.length 
                && chars + desc_words[0].length > desc_len) {
                truncated += '\n' + pad(pref_len);
                chars = 0;
            }
        }
        
        return truncated;
    };
        
    usage = usage || app + ' [OPTIONS] [ARGS]';
    console.log('\x1b[1mUsage\x1b[0m:\n  ' + usage);
    console.log('\n\x1b[1mOptions\x1b[0m: ');
    for (opt in opt_list) {
        
        if (opt.length === 1) {
            long = opt_list[opt][0];
            short = opt;
        } else {
            long = opt;
            short = opt_list[opt][0];
        }
        
        //Parse opt_list
        desc = opt_list[opt][1].trim();
        type = opt_list[opt].length >= 3 ? opt_list[opt][2] : null;
        optional = opt_list[opt].length === 4 ? opt_list[opt][3] : null;
        
        //Build usage line
        if (short === long) {
            if (short.length === 1) {
                line = '  -' + short;
            } else {
                line = '      --' + long;
            }
        } else {
            line = '  -' + short + ', --' + long;
        }
        line += ' ';
        
        if (type) {
            if (type instanceof Array) {
                desc += '. VALUE must be either [' + type.join('|') + ']';
                type = 'VALUE';
            }
            if (type === true || type === 1) {
                type = long.toUpperCase();
            }
            type = type.toUpperCase();
            if (type === 'FLOAT' || type === 'INT') {
                type = 'NUMBER';
            }
            line += optional ? '[' + type + ']' : type;
        }
        line = pad(line, switch_pad);
        line += trunc_desc(line, desc);
        line += optional ? ' (Default is ' + optional + ')' : '';
        console.log(line);
        
        seen_opts.push(short);
        seen_opts.push(long);
    }
    if (enable_daemon && seen_opts.indexOf('d') === -1 && seen_opts.indexOf('daemon') === -1) {
        console.log(pad('  -d, --daemon [ARG]', switch_pad) + 'Daemonize the process. Control the daemon using [start|stop|restart|log|pid]');
    }
    if (seen_opts.indexOf('v') === -1 && seen_opts.indexOf('version') === -1) {
        console.log(pad('  -v, --version', switch_pad) + 'Display the current version');
    }
    if (seen_opts.indexOf('h') === -1 && seen_opts.indexOf('help') === -1) {
        console.log(pad('  -h, --help', switch_pad) + 'Display help and usage details');
    }
    process.exit();
};

exports.getOptError = function (expects, type) {
    var err = full_opt + ' expects ' + expects 
            + '. Use `' + app + ' ' + full_opt + (is_long ? '=' : ' ') + type + '`';
    return err;
};

exports.getValue = function (default_val, validate_func, err_msg) {
    
    err_msg = err_msg || exports.getOptError('a value', 'VALUE');
    
    var value;
    
    try {
    
        if (curr_val) {
            if (validate_func) {
                curr_val = validate_func(curr_val);
            }
            return curr_val;
        }
    
        //Grouped short opts aren't allowed to have values
        if (short_tags.length) {
            throw 'Short tags';
        }
    
        //If there's no args left or the next arg is an opt, return the 
        //default value (if specified) - otherwise fail
        if (!argv.length || argv[0][0] === '-') {
            throw 'No value';
        }
        
        value = argv.shift();
        
        //Run the value through a validation/transformation function if specified
        if (validate_func) {
            value = validate_func(value);
        }
        
    } catch (e) {
        
        //The value didn't pass the validation/transformation. Unshift the value and
        //return the default value (if specified)
        if (value) {
            argv.unshift(value);
        }
        return default_val || exports.fatal(err_msg);
        
    }
    
    return value;
};

exports.getInt = function (default_val) {
    return exports.getValue(default_val, function (value) {
        if (!value.match(/^(?:-?(?:0|[1-9][0-9]*))$/)) {
            throw 'Invalid int';
        }
        return parseInt(value, 10);
    }, exports.getOptError('a number', 'NUMBER'));
}

exports.getFloat = function (default_val) {
    return exports.getValue(default_val, function (value) {
        if (!value.match(/^(?:-?(?:0|[1-9][0-9]*))?(?:\.[0-9]*)?$/)) {
            throw 'Invalid float';
        }
        return parseFloat(value, 10);
    }, exports.getOptError('a number', 'NUMBER'));
}

exports.getUrl = function (default_val, identifier) {
    identifier = identifier || 'url';
    return exports.getValue(default_val, function (value) {
        if (!value.match(/^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2})?)|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/)) {
            throw 'Invalid URL';
        }
        return value;
    }, exports.getOptError('a ' + identifier, identifier.toUpperCase()));
}

exports.getEmail = function (default_val) {
    return exports.getValue(default_val, function (value) {
        if (!value.match(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/)) {
            throw 'Invalid email';
        }
        return value;
    }, exports.getOptError('an email', 'EMAIL'));
}

exports.getIp = function (default_val) {
    return exports.getValue(default_val, function (value) {
        if (!value.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) {
            throw 'Invalid IP';
        }
        return value;
    }, exports.getOptError('an IP', 'IP'));
}

exports.getPath = function (default_val, identifier) {
    identifier = identifier || 'path';
    return exports.getValue(default_val, function (value) {
        if (value.match(/[?*:;{}]/)) {
            throw 'Invalid path';
        }
        return value;
    }, exports.getOptError('a ' + identifier, identifier.toUpperCase()));
}

exports.getValueFromArr = function (default_val, arr) {
    return exports.getValue(default_val, function (value) {
        if (arr.indexOf(value) === -1) {
            throw 'Unexpected value';
        }
        return value;
    }, exports.getOptError('either [' + arr.join('|') + ']', 'VALUE'));
}

exports.withStdin = function (encoding, callback) {
    if (typeof encoding === 'function') {
        callback = encoding;
        encoding = 'utf8';
    }
    var stream = process.openStdin(), data = '';
    stream.setEncoding(encoding);
    stream.on('data', function (chunk) {
        data += chunk;
    });
    stream.on('end', function () {
        callback(data);
    });
};

exports.withInput = function (encoding, callback) {
    if (typeof encoding === 'function') {
        callback = encoding;
        encoding = 'utf8';
    }
    try {
        if (!exports.args.length) {
            throw 'No args';
        }
        var path = exports.args[0], data;
        if (path.indexOf('/') === -1) {
            path = cwd + '/' + path;
        }
        if (encoding === 'stream') {
            data = fs.createReadStream(path);
        } else {
            data = fs.readFileSync(path, encoding);
        }
        callback(data);
    } catch (e) {
        //First arg isn't a file, read from STDIN instead
        exports.withStdin.apply(this, arguments);
    }
};

exports.withStdinLines = function (callback) {
    exports.withStdin(function (data) {
        var sep = data.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
        callback(data.split(sep), sep);
    });
};

exports.withInputLines = function (callback) {
    exports.withInput(function (data) {
        var sep = data.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
        callback(data.split(sep), sep);
    });
};

/**
 * A method for creating and controlling a daemon.
 *
 * `arg` can be:
 *      start = daemonizes the process
 *      stop  = stops the daemon if it is running
 *      restart = alias for stop -> start
 *      pid = outputs the daemon's PID if it is running
 *      log = outputs the daemon's log file (stdout + stderr)
 *
 * @param {String} arg
 * @param {Function} callback
 * @api public
 */
exports.daemon = function (arg, callback) {
    if (typeof arg === 'function') {
        callback = arg;
        arg = 'start';
    }
    
    lock_file = '/tmp/' + app + '.pid';
    log_file = '/tmp/' + app + '.log';
    
    var start = function () {
        daemon.run(log_file, lock_file, function (err) {
            if (err) return status('Error starting daemon: ' + err, 'error');
            callback();
        });
    };
    
    var stop = function () {
        try {
            fs.readFileSync(lock_file);
        } catch (e) {
            return status('Daemon is not running', 'error');
        };
        daemon.stop(lock_file, function (err, pid) {
            if (err && err.errno === 3) {
                return status('Daemon is not running', 'error');
            } else if (err) {
                return status('Error stopping daemon: ' + err.errno, 'error');
            }
            status('Successfully stopped daemon with pid: ' + pid, 'ok');
        });
    };
    
    switch(arg) {
	case 'stop':
		stop();
		break;

	case 'restart':
        daemon.stop(lock_file, function () {
            start();
        });
		break;
    
    case 'log':
        try {
            console.log(fs.readFileSync(log_file, 'utf8'));
        } catch (e) {
            return status('No daemon log file', 'error');
        };
        break;
    
    case 'pid':
        try {
            var pid = fs.readFileSync(lock_file, 'utf8');
            fs.statSync('/proc/' + pid);
            status(pid, 'info');
        } catch (e) {
            return status('Daemon is not running', 'error');
        };
        break;
    
	default:
        start();
        break;
    }
}

exports.main = function (callback) {
    var after = function () {
        callback.apply(exports, [exports.args, exports.options]);
    };
    if (enable_daemon && daemon_arg) {
        exports.daemon(daemon_arg, after);
    } else {
        after();
    }
}