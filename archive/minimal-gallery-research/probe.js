
const fs=require('fs');
const css=fs.readFileSync('a1.css','utf8');
const uniq=a=>[...new Set(a)];
function rules(pattern,label){
  const re=new RegExp(pattern,'g'); const out=[]; let m;
  while((m=re.exec(css))) out.push(m[0]);
  console.log('=== '+label+' ===');
  uniq(out).slice(0,25).forEach(r=>console.log(r));
}
rules('[^{}@]*data-fade[^{}]*\\{[^}]*\\}','DATA-FADE');
rules('[^{}@]*\\.grid[^{}]*\\{[^}]*\\}','GRID CLASSES');
rules('[^{}@]*\\.container[^{}]*\\{[^}]*\\}','CONTAINER');
rules('[^{}@]*\\.padding-global[^{}]*\\{[^}]*\\}','PADDING GLOBAL');
// body/html font
const html=fs.readFileSync('a1-home.html','utf8');
const bodyRule = css.match(/[^{}@]*body[^{}@]*\{[^}]*\}/g)||[];
console.log('=== BODY-LIKE RULES ===');
uniq(bodyRule.filter(r=>/font-size|line-height|background|color/.test(r))).slice(0,12).forEach(r=>console.log(r));
// find the card container class in home html
const idx = html.indexOf('website_item');
console.log('=== HOME HTML around website_item ===');
console.log(html.slice(Math.max(0,idx-1200), idx+900).replace(/></g,'>\n<').slice(0,3500));
