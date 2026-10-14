import {catalogueRoute} from '../server/catalogue/routes.mjs';
// Separate public-catalogue job: the auth/profile function retains its 30s
// duration and existing account-storage lock assumptions.
export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 const url=new URL('https://localhost/api/catalogue/refresh');
 try{await catalogueRoute(req,res,url);}catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Catalogue refresh is temporarily unavailable.'}));}
}
