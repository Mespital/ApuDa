import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync(new URL('../lib/notebook.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
writeFileSync(new URL('../../../public-site/netlify/lib/nonsul-notebook.mjs',import.meta.url),output);
console.log('Updated server notebook schema.');
