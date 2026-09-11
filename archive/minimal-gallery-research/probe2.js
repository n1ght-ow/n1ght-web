
const fs=require('fs');
const css=fs.readFileSync('a1.css','utf8');
const uniq=a=>[...new Set(a)];
function rules(pattern,label,max){
  const re=new RegExp(pattern,'g'); const out=[]; let m;
  while((m=re.exec(css))) out.push(m[0]);
  console.log('=== '+label+' ===');
  uniq(out).slice(0,max||20).forEach(r=>console.log(r));
}
rules('[^{}@]*\\.websites_list[^{}]*\\{[^}]*\\}','WEBSITES LIST');
rules('[^{}@]*\\.websites_feed[^{}]*\\{[^}]*\\}','WEBSITES FEED');
rules('[^{}@]*\\.websites_item-link[^{}]*\\{[^}]*\\}','ITEM LINK');
rules('[^{}@]*\\.website-detail[^{}]*\\{[^}]*\\}','WEBSITE DETAIL',25);
rules('[^{}@]*\\.tag[^{}]*\\{[^}]*\\}','TAGS',18);
// page-gutter context
const gi=css.indexOf('--page-gutter');
console.log('=== PAGE GUTTER CONTEXT ===');
let i=0; while((i=css.indexOf('--page-gutter',i))!==-1 && i<css.length){ console.log(css.slice(Math.max(0,i-260), i+80).replace(/^.*[{}]/,'')); i+=20; }
