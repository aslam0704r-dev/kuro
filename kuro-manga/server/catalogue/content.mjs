import {CONTENT_POLICY_VERSION,CONTENT_MESSAGE,UUID,classifyMangaDex,classifyAniList,providerContentPolicy,forbiddenText,ANILIST_FIELDS,blockedIdentity} from '../../client/content-policy.mjs';
import {sourceError} from './transport.mjs';
import {mapMetadata} from './adapters/metadata.mjs';
import {editionAliases} from '../../client/edition-aliases.mjs';

const text=object=>object?.en||object?.['ja-ro']||Object.values(object||{}).find(x=>typeof x==='string')||'';
const plain=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,20000);
export function requireContentProvider(provider){if(providerContentPolicy(provider).state!=='eligible')throw sourceError(CONTENT_MESSAGE+' This provider has no approved rating contract.',403);}
function mdId(id){const value=String(id||'').replace(/^mangadex-/,'');if(!UUID.test(value))throw sourceError('Invalid manga identity',400);return value.toLowerCase();}
function chapterId(id){const value=String(id||'').replace(/^mangadex:/,'');if(!UUID.test(value))throw sourceError('Invalid chapter identity',400);return value.toLowerCase();}
export function coverRoute(provider,id){return '/api/catalogue/cover?provider='+encodeURIComponent(provider)+'&id='+encodeURIComponent(id);}
function mdManga(raw){
 const a=raw.attributes,relationships=raw.relationships||[],id='mangadex-'+raw.id;
 return {id,sourceId:'mangadex',title:plain(text(a.title)),altTitles:(a.altTitles||[]).flatMap(x=>Object.values(x)).filter(x=>typeof x==='string').map(plain),description:plain(text(a.description)),coverUrl:coverRoute('mangadex',id),status:({ongoing:'ONGOING',completed:'COMPLETED',hiatus:'HIATUS',cancelled:'CANCELLED'})[a.status]||'UNKNOWN',genres:a.tags.map(t=>text(t.attributes.name)).filter(Boolean).slice(0,30),
  author:relationships.filter(x=>x.type==='author').map(x=>plain(x.attributes?.name)).filter(Boolean).join(', '),artist:relationships.filter(x=>x.type==='artist').map(x=>plain(x.attributes?.name)).filter(Boolean).join(', '),identityKeys:['mdx:'+(editionAliases[raw.id]||raw.id),...relationships.filter(x=>x.type==='manga'&&['colored','monochrome'].includes(x.related)&&UUID.test(x.id)).map(x=>'mdx:'+(editionAliases[x.id]||x.id)),.../^\d+$/.test(a.links?.mal||'')?['mal:'+a.links.mal]:[]],year:a.year||undefined,contentApproval:{version:CONTENT_POLICY_VERSION,evidence:'mangadex:contentRating=safe'}};
}
export function createContentService({read,clock=Date.now,onReject=async()=>{}}){
 const approved=new Map();
 function seed(raw,checkedAt){
  if(!classifyMangaDex(raw).allowed||!Number.isFinite(checkedAt)||checkedAt+30000<=clock())return undefined;
  const uuid=raw.id.toLowerCase(),cover=raw.relationships?.find(x=>x.type==='cover_art')?.attributes?.fileName,mapped=mdManga(raw);
  const row={raw:{...raw,kuroContentApproval:{version:CONTENT_POLICY_VERSION,checkedAt}},manga:{...mapped,contentApproval:{...mapped.contentApproval,checkedAt}},coverUrl:typeof cover==='string'&&/^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(cover)?'https://uploads.mangadex.org/covers/'+uuid+'/'+cover:null,coverPolicy:{hosts:['uploads.mangadex.org'],paths:['/covers/'+uuid+'/']}};
  approved.set(uuid,row);while(approved.size>2000)approved.delete(approved.keys().next().value);return row;
 }
 async function manga(provider,id){try{return await loadManga(provider,id);}catch(error){if(provider==='mangadex'&&[403,404,410].includes(error.status)&&UUID.test(String(id).replace(/^mangadex-/,'')))await onReject('mangadex-'+String(id).replace(/^mangadex-/,'').toLowerCase());throw error;}}
 async function loadManga(provider,id){
  requireContentProvider({id:provider});
  if(provider==='mangadex'){
   const uuid=mdId(id),hit=approved.get(uuid);if(hit?.manga.contentApproval.checkedAt+30000>clock())return hit;approved.delete(uuid);
   const reply=await read(provider,'https://api.mangadex.org/manga/'+uuid+'?includes%5B%5D=cover_art&includes%5B%5D=author&includes%5B%5D=artist',{json:true,contentEvidence:true}),raw=reply?.data;
   if(raw?.id?.toLowerCase()!==uuid||!classifyMangaDex(raw).allowed)throw sourceError(CONTENT_MESSAGE,403);
   return seed(raw,reply.kuroContentCheckedAt);
  }
  const match=/^anilist-(\d{1,9})$/.exec(id||'');if(!match)throw sourceError('Invalid manga identity',400);
  const reply=await read('anilist','https://graphql.anilist.co',{json:true,contentEvidence:true,method:'POST',body:JSON.stringify({query:`query($id:Int){Media(id:$id,type:MANGA,isAdult:false){${ANILIST_FIELDS}}}`,variables:{id:Number(match[1])}})}),raw=reply?.data?.Media;
  if(reply.errors?.length||raw?.id!==Number(match[1])||!classifyAniList(raw).allowed)throw sourceError(CONTENT_MESSAGE,403);
  const mapped=mapMetadata('anilist',raw);return {raw,manga:{...mapped,coverUrl:coverRoute(provider,mapped.id),contentApproval:{version:CONTENT_POLICY_VERSION,evidence:'anilist:isAdult=false',checkedAt:reply.kuroContentCheckedAt}},coverUrl:mapped.coverUrl,coverPolicy:{hosts:['s4.anilist.co'],paths:['/file/anilistcdn/media/manga/cover/']}};
 }
 async function chapter(id,expectedManga){
  const uuid=chapterId(id);if(blockedIdentity('mangadex',expectedManga,'mangadex:'+uuid))throw sourceError(CONTENT_MESSAGE,403);
  const reply=await read('mangadex','https://api.mangadex.org/chapter/'+uuid+'?includes%5B%5D=scanlation_group',{json:true,contentEvidence:true}),raw=reply?.data;
  const parents=raw?.relationships?.filter(x=>x.type==='manga')||[];
  if(raw?.id?.toLowerCase()!==uuid||raw.type!=='chapter'||parents.length!==1||!UUID.test(parents[0].id)||raw.attributes?.externalUrl||raw.attributes?.contentRating&&raw.attributes.contentRating!=='safe'||forbiddenText(raw.attributes?.title)){if(parents.length===1&&UUID.test(parents[0].id))await onReject('mangadex-'+parents[0].id.toLowerCase(),'mangadex:'+uuid);throw sourceError(CONTENT_MESSAGE,403);}
  const parent='mangadex-'+parents[0].id.toLowerCase();if(expectedManga&&parent!=='mangadex-'+mdId(expectedManga))throw sourceError('Chapter does not belong to the approved manga.',403);
  const approval=await manga('mangadex',parent),a=raw.attributes||{},number=Number(a.chapter),volume=Number(a.volume);
  return {...approval,rawChapter:raw,chapter:{id:'mangadex:'+uuid,mangaId:parent,sourceId:'mangadex',title:plain(a.title),chapterNumber:Number.isFinite(number)?number:0,volumeNumber:a.volume&&Number.isFinite(volume)?volume:undefined,publishDate:Date.parse(a.readableAt||a.publishAt)||0,pages:a.pages}};
 }
 return {manga,chapter,seed,async check(provider,id,chapterIdentity){
  const row=chapterIdentity?(provider==='mangadex'?await chapter(chapterIdentity,id):(()=>{throw sourceError(CONTENT_MESSAGE,403);})()):await manga(provider,id);
  return {allowed:true,policyVersion:CONTENT_POLICY_VERSION,manga:row.manga,...row.chapter?{chapter:row.chapter}:{}};
 }};
}
