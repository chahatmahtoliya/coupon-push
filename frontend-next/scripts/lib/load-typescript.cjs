const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const cache = new Map();
function load(relative) {
    let file = path.resolve(root, relative);
    if (!path.extname(file)) file = ['.ts', '.tsx', '.json'].map(extension => file + extension).find(candidate => fs.existsSync(candidate));
    if (!file) throw new Error(`Module not found: ${relative}`);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { module: mod, exports: mod.exports, console, URL, Date, process, require: name => name.startsWith('@/') ? load('src/' + name.slice(2)) : name.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(file), name))) : require(name) });
    return mod.exports;
}
module.exports = { load };
