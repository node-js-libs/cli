var fs = require('fs'),
    path = require('path'),
    util = require('util');

var app, argv, curr_opt, curr_val, full_opt, is_long,
    short_tags = [], opt_list, parsed = {},
    version, usage, eq, len;

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
        if (desc_words.length && chars + desc_words[0].length > desc_len) {
            truncated += '\n' + pad(pref_len);
            chars = 0;
        }
    }
    
    return truncated;
};

var try_all = function (arr, func, err) {
    for (var i = 0, l = arr.length; i < l; i++) {
        try {
            func(arr[i]);
            return;
        } catch (e) {
            if (i === l-1) {
                exports.error(err);
            }
        }
    }
};

exports.options = {};
exports.args = [];

exports.error = function (msg) {
    console.log('\x1B[31mERROR\x1B[0m: ' + msg);
    process.exit(1);
};

exports.getUsage = function () {
    var short, desc, optional, line, seen_opts = [],
        switch_pad = 25;
    usage = usage || app + ' [OPTIONS] [ARGS]';
    console.log('\x1b[1mUsage\x1b[0m:\n  ' + usage);
    console.log('\n\x1b[1mOptions\x1b[0m: ');
    for (opt in opt_list) {
        
        //Parse opt_list
        short = opt_list[opt][0];
        desc = opt_list[opt][1].trim();
        type = opt_list[opt].length >= 3 ? opt_list[opt][2] : null;
        optional = opt_list[opt].length === 4 ? opt_list[opt][3] : null;
        
        //Build usage line
        line = '  -' + short;
        if (short !== opt) {
            line += ', --' + opt;
        }
        line += ' ';
        if (type) {
            if (type === true || type === 1) {
                type = opt.toUpperCase();
            }
            type = type.toUpperCase();
            if (type === 'FLOAT' || type === 'INT') {
                type = 'NUMBER';
            }
            line += optional ? '[' + type + ']' : type;
        }
        line = pad(line, switch_pad);
        line += trunc_desc(line, desc);
        line += optional ? '. Default is ' + optional : '';
        console.log(line);
        
        seen_opts.push(short);
        seen_opts.push(opt);
    }
    if (seen_opts.indexOf('v') === -1 && seen_opts.indexOf('version') === -1) {
        console.log(pad('  -v, --version', switch_pad) + 'Display the current version');
    }
    if (seen_opts.indexOf('h') === -1 && seen_opts.indexOf('help') === -1) {
        console.log(pad('  -h, --help', switch_pad) + 'Display help and usage details');
    }
    process.exit();
};

exports.setUsage = function (u) {
    usage = u;
};

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
    
    if (path) {
        parse_packagejson(path);
        return;
    }
    
    try_all([
        __dirname + '/package.json', 
        __dirname + '/../package.json',
        __dirname + '/../../package.json'
    ], parse_packagejson, 'Could not detect ' + app + ' version');
};

exports.parse = function (opts) {
    var default_val, parsed = exports.options;
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
                switch (opt_list[opt][2].toLowerCase ? opt_list[opt][2].toLowerCase() : opt_list[opt][2]) {
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
                     parsed[opt] = exports.getPath(default_val);
                     break;
                case 'email':
                     parsed[opt] = exports.getEmail(default_val);
                     break;
                case 'url':
                case 'domain':
                     parsed[opt] = exports.getUrl(default_val);
                     break;
                case 'ip':
                     parsed[opt] = exports.getIp(default_val);
                     break;
                default:
                     exports.error('Unknown opt type "' + opt_list[opt][2] + '"');
                }
                break;
            }
        }
        if (o === 'v' || o === 'version') {
            exports.getVersion();
        } else if (o === 'h' || o === 'help') {
            exports.getUsage();
        } else if (typeof parsed[opt] === 'undefined') {
            exports.error('Unknown option ' + full_opt);
        }
    }
    return parsed;
};

exports.next = function () {
    curr_val = null;
    
    if (short_tags.length) {
        curr_opt = short_tags.shift();
        full_opt = '-' + curr_opt;
        return curr_opt;
    }
    
    if (!argv.length) {
        return false;
    }
    
    curr_opt = argv.shift();
    
    if (curr_opt === '-' || curr_opt === '--') {
        while (argv.length) {
            exports.args.push(argv.shift());
        }
        return false;
    }
    
    if (curr_opt[0] !== '-') {
        exports.args.push(curr_opt);
        return exports.next();
    } else {
        is_long = curr_opt[1] === '-';
        curr_opt = curr_opt.substr(is_long ? 2 : 1);
    }
    
    if (!is_long && curr_opt.length > 1) {
        short_tags = curr_opt.split('');
        return exports.next();
    }
    
    if ((eq = curr_opt.indexOf('=')) >= 0) {
        curr_val = curr_opt.substr(eq + 1);
        curr_opt = curr_opt.substr(0, eq);
        len = curr_val.length;
        if ((curr_val[0] === '"' && curr_val[len - 1] === '"') ||
            (curr_val[0] === "'" && curr_val[len - 1] === "'"))
        {
            curr_val = curr_val.substr(1, len-2);
        }
    }
    
    full_opt = (is_long ? '--' : '-') + curr_opt;
    
    return curr_opt;
};

exports.getOptError = function (expects, type) {
    var no_val_msg = full_opt + ' expects ' + expects
                   + '. Use `' + app + ' ' + full_opt + ' ' + type + '`';
    return no_val_msg;
};

exports.getValue = function (default_val, throw_on_error) {
    if (curr_val) {
        return curr_val;
    }
    
    var no_val_msg = exports.getOptError('a value', 'VALUE');
    
    var err = !throw_on_error ? exports.error : function (msg) {
        throw msg;
    };
    
    if (short_tags.length) {
        err(no_val_msg);
    }
        
    if (!argv.length || argv[0][0] === '-') {
        return default_val || err(no_val_msg);
    }
    
    return argv.shift();
};

exports.getInt = function (default_val, throw_on_error) {
    try {
        var intstr = exports.getValue(default_val, true),
            int = parseInt(intstr, 10);
        if (int+'' != intstr) throw 'Invalid integer';
        return int;
    } catch (e) {
        if (throw_on_error) {
            throw e;
        } else {
            exports.error(exports.getOptError('a number', 'NUMBER'));
        }
    }
};

exports.getFloat = function (default_val, throw_on_error) {
    try {
        var floatstr = exports.getValue(default_val, true),
            float = parseFloat(floatstr, 10);
        if (float+'' != floatstr) throw 'Invalid float';
        return float;
    } catch (e) {
        if (throw_on_error) {
            throw e;
        } else {
            exports.error(exports.getOptError('a number', 'NUMBER'));
        }
    }
};

exports.getUrl = function (default_val, throw_on_error) {
    try {
        var url = exports.getValue(default_val, true);
        //Excessive? probably.
        if (!url.match(/^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2})?)|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/)) {
            throw 'Invalid URL';
        }
        return url;
    } catch (e) {
        if (throw_on_error) {
            throw e;
        } else {
            exports.error(exports.getOptError('a URL', 'URL'));
        }
    }
};

exports.getEmail = function (default_val, throw_on_error) {
    try {
        var email = exports.getValue(default_val, true);
        if (!email.match(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/)) {
            throw 'Invalid email';
        }
        return email;
    } catch (e) {
        if (throw_on_error) {
            throw e;
        } else {
            exports.error(exports.getOptError('an email', 'EMAIL'));
        }
    }
};

exports.getIp = function (default_val, throw_on_error) {
    try {
        var ip = exports.getValue(default_val, true);
        if (!ip.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) {
            throw 'Invalid IP';
        }
        return ip;
    } catch (e) {
        if (throw_on_error) {
            throw e;
        } else {
            exports.error(exports.getOptError('an IP', 'IP'));
        }
    }
};

exports.getPath = function (default_val, throw_on_error) {
    try {
        var path = exports.getValue(default_val, true);
        if (path.match(/[?*:;{}]/)) {
            throw 'Invalid path';
        }
        return path;
    } catch (e) {
        if (throw_on_error) {
            throw e;
        } else {
            exports.error(exports.getOptError('a path', 'PATH'));
        }
    }
};

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
        var path = exports.args[0], data;
        if (path.indexOf('/') === -1) {
            path = process.cwd() + '/' + path;
        }
        data = fs.readFileSync(path, encoding);
        callback(data);
    } catch (e) {
        //First arg isn't a file, read from STDIN instead
        exports.withStdin.apply(this, arguments);
    }
};

exports.withStdinLines = function (encoding, callback) {
    export.withStdin(encoding, function (data) {
        var sep = data.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
        callback(data.split(sep), sep);
    });
};

exports.withInputLines = function (encoding, callback) {
    export.withInput(encoding, function (data) {
        var sep = data.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
        callback(data.split(sep), sep);
    });
};

exports.setArgv = function (arr, keep_arg0) {
    if (!(arr instanceof Array)) {
        arr = arr.split(' ');
    }
    app = arr.shift();
    if (!keep_arg0 && 'node' === app) {
        app = arr.shift();
    }
    app = path.basename(app);
    argv = arr;
};

exports.setArgv(process.argv);