import { unknownManga, strip, statusOf, pageNumber, httpsURL, applyPageFilters } from './common.mjs';
import { sourceError } from '../transport.mjs';
import {CONTENT_POLICY_VERSION,CONTENT_MESSAGE,ANILIST_FIELDS,classifyAniList} from '../../../client/content-policy.mjs';

export function mapMetadata(provider,data){
 let id,title,cover,status,description,genres=[],author,alt=[],rating,keys=[],url;
 if(provider==='anilist'){
  id=data.id;title=data.title?.english||data.title?.romaji||data.title?.native;cover=data.coverImage?.large;status=data.status;description=data.description;genres=data.genres||[];rating=data.averageScore/10;
  alt=Object.values(data.title||{}).filter(Boolean);author=data.staff?.edges?.find(x=>/story|original/i.test(x.role))?.node?.name?.full;
  keys=['anilist:'+id,...data.idMal?['mal:'+data.idMal]:[]];url='https://anilist.co/manga/'+id;
 }else if(provider==='jikan'){
  id=data.mal_id;title=data.title_english||data.title;cover=data.images?.jpg?.large_image_url||data.images?.jpg?.image_url;status=data.status;description=data.synopsis;genres=(data.genres||[]).map(x=>x.name);author=data.authors?.[0]?.name;alt=[data.title,...data.title_synonyms||[]].filter(Boolean);rating=data.score;keys=['mal:'+id];url='https://myanimelist.net/manga/'+id;
 }else if(provider==='shikimori'){
  id=data.id;title=data.name||data.russian;cover=httpsURL(data.image?.original,'https://shikimori.io/');status=data.status;description=data.description;genres=(data.genres||[]).map(x=>x.name);alt=[data.russian,data.japanese].flat().filter(Boolean);rating=Number(data.score)||undefined;keys=['mal:'+id];url='https://shikimori.io/mangas/'+id;
 }else if(provider==='mangabaka'){
  id=data.id;title=data.title;cover=data.cover?.x250?.x1||data.cover?.raw?.url;status=data.status;description=data.description;genres=data.genres||[];author=data.authors?.join(', ');rating=Number(data.rating)/10;
  alt=[data.native_title,data.romanized_title,...Object.values(data.secondary_titles||{}).flat().map(x=>x.title)].filter(Boolean);
  const mapping={my_anime_list:'mal',anilist:'anilist',kitsu:'kitsu',manga_updates:'mu',shikimori:'mal'};
  keys=['mangabaka:'+id,...Object.entries(data.source||{}).flatMap(([name,row])=>mapping[name]&&row?.id?[mapping[name]+':'+row.id]:[])];url='https://mangabaka.org/manga/'+id;
 }else throw sourceError('Unknown metadata provider',400);
 if(!/^\d+$/.test(String(id))||!title)throw sourceError('Invalid metadata record');
 return {...unknownManga({id:provider},provider+'-'+id,title),coverUrl:httpsURL(cover),description:strip(description),status:statusOf(status),genres:genres.filter(x=>typeof x==='string').slice(0,30),author:author||undefined,altTitles:alt.slice(0,30),rating:Number.isFinite(rating)?rating:undefined,identityKeys:[...new Set(keys)],catalogueOnly:true,metadataUrl:url};
}
export function createMetadataAdapter(provider,read){return {async call(action,params={}){
 const id=provider.id;
 if(action==='chapters')return [];if(action==='pages')throw sourceError('This metadata provider supplies no reading pages',400);
 if(!['search','details','latest','popular'].includes(action))throw sourceError('Unsupported metadata operation',400);
 const page=pageNumber(params.page),q=String(params.q||'').trim();let original;
 if(action==='details'){const match=new RegExp('^'+id+'-(\\d{1,14})$').exec(params.id||'');if(!match)throw sourceError('Invalid metadata identity',400);original=Number(match[1]);}
 if(action!=='details'&&!q)return {items:[],notice:'Enter a title to search this metadata provider.'};
 if(id==='anilist'){
  const fields=ANILIST_FIELDS;
  const query=original?`query($id:Int) { Media(id:$id,type:MANGA,isAdult:false) { ${fields} } }`:
   `query($q:String,$page:Int) { Page(page:$page,perPage:24) { pageInfo { hasNextPage total } media(type:MANGA,isAdult:false,format_in:[MANGA,ONE_SHOT],search:$q) { ${fields} } } }`;
  const reply=await read('https://graphql.anilist.co',{json:true,contentEvidence:true,method:'POST',body:JSON.stringify({query,variables:original?{id:original}:{q,page}})});
  const safeMap=raw=>{const row=mapMetadata(id,raw);return {...row,coverUrl:'/api/catalogue/cover?provider=anilist&id='+row.id,contentApproval:{version:CONTENT_POLICY_VERSION,evidence:'anilist:isAdult=false',checkedAt:reply.kuroContentCheckedAt}};};
  if(reply.errors?.length||!reply.data)throw sourceError('AniList query unavailable');if(original){if(!classifyAniList(reply.data.Media).allowed)throw sourceError(CONTENT_MESSAGE,403);return safeMap(reply.data.Media);}
  const result={items:(reply.data.Page?.media||[]).filter(raw=>classifyAniList(raw).allowed).map(safeMap)};if(reply.data.Page?.pageInfo?.hasNextPage)result.nextPage=page+1;return applyPageFilters(result,params.filters);
 }
 let url;
 if(id==='jikan'){url=new URL(original?'https://api.jikan.moe/v4/manga/'+original+'/full':'https://api.jikan.moe/v4/manga');if(!original){url.searchParams.set('q',q);url.searchParams.set('page',page);url.searchParams.set('limit','24');url.searchParams.set('sfw','true');}}
 if(id==='shikimori'){url=new URL(original?'https://shikimori.io/api/mangas/'+original:'https://shikimori.io/api/mangas');if(!original){url.searchParams.set('search',q);url.searchParams.set('page',page);url.searchParams.set('limit','24');}}
 if(id==='mangabaka'){url=new URL(original?'https://api.mangabaka.org/v1/series/'+original:'https://api.mangabaka.org/v1/series/search');if(!original){url.searchParams.set('q',q);url.searchParams.set('page',page);}}
 if(!url)throw sourceError('Unknown metadata provider',400);const reply=await read(url.href,{json:true});
 if(original)return mapMetadata(id,reply.data||reply);
 const rows=id==='shikimori'?reply:reply.data;if(!Array.isArray(rows))throw sourceError('Invalid metadata response');const result={items:rows.map(x=>mapMetadata(id,x))};
 const next=id==='jikan'?reply.pagination?.has_next_page:id==='mangabaka'?!!reply.pagination?.next:rows.length>=24;
 if(next&&rows.length)result.nextPage=page+1;if(id==='jikan')result.total=reply.pagination?.items?.total;if(id==='mangabaka')result.total=reply.pagination?.count;return applyPageFilters(result,params.filters);
}};}
