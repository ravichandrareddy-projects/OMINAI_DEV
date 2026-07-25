const fs = require('fs');
const cp = require('child_process');
function walk(d) {
  let res = [];
  fs.readdirSync(d).forEach(f => {
    f = d + '/' + f;
    if (fs.statSync(f).isDirectory()) res = res.concat(walk(f));
    else if (f.endsWith('.js')) res.push(f);
  });
  return res;
}
const files = walk('d:/OMINI/out');
let found = false;
for (let f of files) {
  try {
    cp.execSync(`node -c "${f}"`, { stdio: 'pipe' });
  } catch (e) {
    console.log('SyntaxError in:', f);
    found = true;
  }
}
if (!found) console.log('No syntax errors found!');
