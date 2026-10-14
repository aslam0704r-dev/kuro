// This policy is mandatory. Only trusted provider responses or deployment-owned
// reviewed byte fingerprints can supply evidence; browser flags never do.
import {blockedMangaIds,blockedChapterIds,blockedProviderIds} from './content-denylist.mjs';
export const CONTENT_POLICY_VERSION='strict-1';
export const CONTENT_MESSAGE='KURO hides adult, suggestive and unverified manga. This title is not approved under the strict content rules.';
export const RATING_TTL_MS=30000;
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ANILIST_FIELDS='id idMal type isAdult title { english romaji native } description(asHtml:false) coverImage { large } status genres tags { name isAdult } averageScore staff(perPage:3) { edges { role node { name { full } } } }';
const normalize=value=>String(value||'').normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();
export function forbiddenLabel(value){
 const text=normalize(value);
 if(['adult cast','young adult fiction','mature protagonist'].includes(text))return false;
 return /^(?:adult|mature|nsfw|explicit|suggestive|ecchi|hentai|erotica|porn(?:ographic|ography)?|smut|nudity|sexual content|sexual violence|sexual abuse|sexual exploitation|sex|hardcore|softcore|r\s*(?:18|19)\s*\+?|(?:18|19)\s*\+|adults? only)(?:\s|$)/.test(text)||
  /(?:^|\b)(?:hentai|erotica|pornographic|pornography|smut|ecchi|nsfw|explicit sexual content|sexual violence|sexual abuse|sexual exploitation|nudity|18\s*\+|19\s*\+)(?:\b|$)/.test(text)||
  /成人向|成人漫画|成人漫畫|十八禁|18禁|色情|エロ漫画|성인|청소년이용불가|للبالغين|إباحي|اباحي/.test(text);
}
const labelDenied=value=>{
 const text=normalize(value);if(['adult cast','young adult fiction','mature protagonist'].includes(text))return false;return forbiddenLabel(text);
};
// Titles/descriptions are supplementary negative evidence. Ordinary references
// to grown characters or romance are not an age rating.
export function forbiddenText(value){return /(?:\b(?:hentai|pornographic|pornography|erotica|smut|ecchi|nsfw)\b|\b(?:18|19)\s*\+|成人向|十八禁|18禁|色情|청소년이용불가)/.test(normalize(value));}
const decision=(allowed,reason,evidence)=>({allowed,reason,version:CONTENT_POLICY_VERSION,...evidence?{evidence}:{}});
const names=value=>value&&typeof value==='object'&&!Array.isArray(value)?Object.values(value).filter(v=>typeof v==='string'):[];
export const blockedIdentity=(provider,id,chapter)=>blockedProviderIds.includes(provider)||blockedMangaIds.includes(String(id).toLowerCase())||!!chapter&&blockedChapterIds.includes(String(chapter).toLowerCase());
export function classifyMangaDex(raw){
 const a=raw?.attributes;
 if(raw?.type!=='manga'||!UUID.test(raw?.id||'')||!a||a.contentRating!=='safe'||!Array.isArray(a.tags)||!names(a.title).some(x=>normalize(x))||a.altTitles!==undefined&&!Array.isArray(a.altTitles)||raw.relationships!==undefined&&!Array.isArray(raw.relationships))return decision(false,'unverified-or-mature-rating');
 if(blockedIdentity('mangadex','mangadex-'+raw.id.toLowerCase()))return decision(false,'moderation-block');
 if(a.tags.some(tag=>!tag?.attributes||!names(tag.attributes.name).some(name=>normalize(name))||names(tag.attributes.name).some(labelDenied)))return decision(false,'restricted-content-tag');
 if([...names(a.title),...(a.altTitles||[]).flatMap(names),...names(a.description)].some(forbiddenText))return decision(false,'restricted-content-description');
 return decision(true,'safe-rating','mangadex:contentRating=safe');
}
export function classifyAniList(raw){
 if(!Number.isSafeInteger(raw?.id)||raw.id<1||raw.type!=='MANGA'||raw.isAdult!==false||!Array.isArray(raw.genres)||!Array.isArray(raw.tags)||!names(raw.title).some(x=>normalize(x)))return decision(false,'unverified-or-mature-rating');
 if(blockedIdentity('anilist','anilist-'+raw.id))return decision(false,'moderation-block');
 if(raw.genres.some(x=>typeof x!=='string'||!normalize(x)||labelDenied(x))||raw.tags.some(t=>typeof t?.name!=='string'||!normalize(t.name)||t.isAdult!==false||labelDenied(t.name)))return decision(false,'restricted-or-unverified-content-tag');
 if([...names(raw.title),raw.description].some(forbiddenText))return decision(false,'restricted-content-description');
 return decision(true,'non-adult-rating','anilist:isAdult=false; adult/ecchi tags excluded');
}
export function providerContentPolicy(provider){
 if(blockedProviderIds.includes(provider.id))return {state:'blocked',reason:'moderation-block',version:CONTENT_POLICY_VERSION};
 if(normalize(provider.contentWarning)==='nsfw'||forbiddenText(provider.name)||forbiddenText(provider.id))return {state:'blocked',reason:'adult-source',version:CONTENT_POLICY_VERSION};
 if(['mangadex','anilist'].includes(provider.id))return {state:'eligible',reason:'supported-rating-contract',version:CONTENT_POLICY_VERSION};
 return {state:'restricted',reason:'no-supported-positive-rating',version:CONTENT_POLICY_VERSION};
}
export function policyProvider(provider){const contentPolicy=providerContentPolicy(provider);return {...provider,contentPolicy,available:contentPolicy.state==='eligible'&&provider.available!==false};}
