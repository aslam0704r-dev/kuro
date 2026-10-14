import { createHmac, timingSafeEqual } from 'node:crypto';
import { permittedURL, sourceError } from './transport.mjs';
import {tileTransform} from './images.mjs';
import {CONTENT_POLICY_VERSION} from '../../client/content-policy.mjs';

export function createTickets(key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw new Error('Page ticket key must contain 32 bytes');
 const mac=value=>createHmac('sha256',key).update('kuro:public-page:v3:complete-chapter-1:'+CONTENT_POLICY_VERSION+'\0'+value).digest();
 return {
  issue(page,now,policy){if(!/^[a-z0-9]{1,40}$/.test(page.provider)||!permittedURL(page.url,policy))throw sourceError('Invalid page URL',400);
   const proofAt=page.proofCheckedAt??now,expires=Math.min(now+86400000,page.proofExpiresAt??now+86400000);
   if(!Number.isSafeInteger(proofAt)||proofAt>now||!Number.isSafeInteger(expires)||expires<=now)throw sourceError('Complete chapter proof expired',409);
   const value=Buffer.from(JSON.stringify({p:page.provider,u:page.url,e:expires,q:proofAt,c:page.chapterId||'',m:page.mangaId||'',v:CONTENT_POLICY_VERSION,g:page.groups||[],h:new URL(page.url).hostname,t:tileTransform(page.transform)})).toString('base64url');return value+'.'+mac(value).toString('base64url');},
  verify(ticket,now,policyFor){
   if(typeof ticket!=='string'||ticket.length>6000||!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]{43}$/.test(ticket))throw sourceError('Invalid page ticket',403);
   const [value,sig]=ticket.split('.');const supplied=Buffer.from(sig,'base64url');if(!timingSafeEqual(mac(value),supplied))throw sourceError('Invalid page ticket',403);
   let data;try{data=JSON.parse(Buffer.from(value,'base64url').toString());}catch{throw sourceError('Invalid page ticket',403);}
   if(data.v!==CONTENT_POLICY_VERSION||typeof data.m!=='string'||data.m.length>100||!Number.isSafeInteger(data.e)||data.e<=now||data.e>now+86400000||!Number.isSafeInteger(data.q)||data.q>now)throw sourceError('Page ticket expired or has an obsolete content policy',403);
   if(!/^[a-z0-9]{1,40}$/.test(data.p)||!Array.isArray(data.g)||data.g.length>20||data.g.some(x=>!/^[0-9a-f-]{36}$/i.test(x))||typeof data.c!=='string'||data.c.length>1400||!permittedURL(data.u,policyFor(data.p,data)))throw sourceError('Invalid page ticket URL',403);
   return {provider:data.p,url:data.u,expiresAt:data.e,proofCheckedAt:data.q,chapterId:data.c,mangaId:data.m,groups:data.g,host:data.h,transform:tileTransform(data.t)};
  }
 };
}
