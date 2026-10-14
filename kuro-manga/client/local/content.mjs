import {reviewedDeviceBooks} from './reviewed-content.mjs';
import {CONTENT_MESSAGE,forbiddenText} from '../content-policy.mjs';
import {digest,bookIdentity,abortCheck,LIMITS} from './model.mjs';
export function reviewedHashes(hashes){
 if(!Array.isArray(hashes)||hashes.some(h=>typeof h!=='string'||!/^[a-f0-9]{64}$/.test(h)))return undefined;
 return reviewedDeviceBooks.find(book=>book.pageHashes.length===hashes.length&&[book.pageHashes,[...book.pageHashes].reverse()].some(list=>list.every((hash,i)=>hash===hashes[i])));
}
export async function reviewedIdentity(id){
 for(const book of reviewedDeviceBooks)for(const list of [book.pageHashes,[...book.pageHashes].reverse()])if(id===await bookIdentity(list))return true;return false;
}
export async function admitDevicePages(pages,{signal}={}){
 if(!Array.isArray(pages)||!pages.length||pages.length>LIMITS.pages)throw new Error(CONTENT_MESSAGE);
 const hashes=[];
 for(const page of pages){abortCheck(signal);if(!(page?.blob instanceof Blob)||!page.blob.size||page.blob.size>LIMITS.pageBytes)throw new Error(CONTENT_MESSAGE);
  const hash=await digest(await page.blob.arrayBuffer());if(page.hash!==undefined&&page.hash!==hash)throw new Error('These device files no longer match their reviewed content.');hashes.push(hash);
 }
 const reviewed=reviewedHashes(hashes);if(!reviewed)throw new Error('Strict content rules: this device comic has not been reviewed. No preview or book was added.');
 abortCheck(signal);return {reviewed,hashes,id:await bookIdentity(hashes)};
}
export function approvedTitle(title,fallback){if(forbiddenText(title))throw new Error('Choose a title that follows KURO’s strict content rules.');return title||fallback;}
