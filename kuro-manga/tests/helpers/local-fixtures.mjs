import sharp from 'sharp';import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('work/local-fixtures',{recursive:true});
const svg=`<svg width="1200" height="1800" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="1800" fill="#192b2d"/><circle cx="660" cy="640" r="470" fill="#bd8249"/><path d="M0 1800L760 370 1200 1800Z" fill="#344e53"/><text x="90" y="1650" fill="#f0eee6" font-size="110" font-family="sans-serif">THE QUIET WORLD</text></svg>`;
await writeFile('work/local-fixtures/cover.jpg',await sharp(Buffer.from(svg)).jpeg({quality:98}).toBuffer());
await writeFile('work/local-fixtures/thumb.jpg',await sharp(Buffer.from(svg)).resize(193,278).jpeg({quality:55}).toBuffer());
for(const [n,color]of [[1,'#af713d'],[2,'#345a68'],[10,'#487f63']]){
 const im=sharp({create:{width:800,height:1200,channels:3,background:color}});
 await writeFile('work/local-fixtures/'+n+'.png',await im.png().toBuffer());
}
console.log('Local comic image fixtures generated.');
