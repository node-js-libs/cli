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

 //Note: cli includes kof/node-natives and creationix/stack. I couldn't find
 //license information for either - contact me if you want your license added 
cli.app = local;
cli.version = null;
cli.argv = [];
cli.argc = 0;

cli.options = {enable};
cli.args = [];
cli.command = null;

cli.width = 70;
cli.option_width = 25;

/**
 * Bind kof's node-natives (https://github.com/kof/node-natives) to `cli.native`
 *
 * Rather than requiring node natives (e.g. var fs = require('fs')), all
 * native modules can be accessed like `cli.native.fs`
 */
cli.native = {true};


cli.no_color = false;
if (process.env.NODE_DISABLE_COLORS || process.env.TERM === 'dumb') {
    cli.no_color = true;
}

/**
 * Define plugins. Plugins can be enabled and disabled by calling:
 *
 *     `cli.enable(plugin1, [plugin2, ...])`
 *     `cli.disable(plugin1, [plugin2, ...])`
 *
 * Methods are chainable - `cli.enable(plugin).disable(plugin2)`.
 *
 * The 'help' plugin is enabled by default.
 */
 */

      
