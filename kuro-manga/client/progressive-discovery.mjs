// The exported screen consumes a discovery hook. Keep its existing return
// shape, but query each provider/page separately so a slow source cannot hold
// back another source's already completed results.
export function progressiveDiscovery(require){
 const React=require(15),{useQueries,useQueryClient}=require(1548),{sourceManager}=require(789),{mergePages}=require(870),{fetchDiscoveryPage}=require(1598),{relevanceScore}=require(791),{useEnabledSources}=require(1595);
 return function useDiscovery(query,filters,enabled=true){
  const chosen=useEnabledSources(),client=useQueryClient(),ids=chosen.filter(id=>{const source=sourceManager.get(id);return !!source&&(!filters.sourceId||filters.sourceId===id)&&(!filters.readableOnly||source.capabilities.readable!==false)&&(!filters.publisherOnly||source.capabilities.publisher)&&(!filters.kind||filters.kind==='ALL'||source.capabilities.originFilter!==false)&&(!filters.kind||!source.capabilities.supportedKinds||source.capabilities.supportedKinds.includes(filters.kind));});
  const text=query.trim(),filterKey=JSON.stringify(filters),key=JSON.stringify([text,ids,filterKey]),initial=ids.map(sourceId=>({sourceId,page:1}));
  const [state,setState]=React.useState(()=>({key,cursors:initial})),cursors=state.key===key?state.cursors:initial;
  const queries=useQueries({queries:cursors.map(cursor=>({queryKey:['discovery-v2',text,filterKey,cursor.sourceId,cursor.page,cursor.token||''],enabled:enabled&&ids.length>0,staleTime:300000,retry:false,queryFn:()=>fetchDiscoveryPage(query,filters,[cursor])}))});
  const fingerprint=queries.map(row=>[row.dataUpdatedAt,row.status,row.fetchStatus].join(':')).join('|');
  const pages=React.useMemo(()=>queries.flatMap(row=>row.data?[row.data]:[]),[fingerprint,key]);
  const items=React.useMemo(()=>{const rows=mergePages(pages);if(text&&filters.sort==='RELEVANCE'){const score=row=>Math.max(...[row.title,...row.altTitles||[]].map(title=>relevanceScore(text,title)));rows.sort((a,b)=>score(b)-score(a)||relevanceScore(text,b.title)-relevanceScore(text,a.title)||Number(!!a.catalogueOnly)-Number(!!b.catalogueOnly));}return rows;},[pages,key]);
  const reports=React.useMemo(()=>[...new Map(pages.flatMap(page=>page.reports||[]).map(row=>[row.sourceId,row])).values()],[pages]);
  const planned=new Set(cursors.map(cursor=>cursor.sourceId+'|'+cursor.page+'|'+(cursor.token||''))),latest=new Map();
  cursors.forEach((cursor,index)=>{if(queries[index]?.data)latest.set(cursor.sourceId,queries[index].data);});
  const next=[...latest.values()].flatMap(page=>page.next||[]).filter(cursor=>cursor.page<=25&&!planned.has(cursor.sourceId+'|'+cursor.page+'|'+(cursor.token||'')));
  const isFetching=queries.some(row=>row.isFetching),isPending=enabled&&queries.some(row=>row.isPending),isError=queries.length>0&&queries.every(row=>row.isError);
  const refetch=()=>Promise.all(queries.map(row=>row.refetch()));
  return {items,reports,sourceCount:ids.length,data:pages.length?{pages,pageParams:cursors}:undefined,isLoading:!pages.length&&isPending,isPending:!pages.length&&isPending,isFetching,isRefetching:isFetching&&pages.length>0,isError,error:queries.find(row=>row.error)?.error,isSuccess:pages.length>0,status:pages.length?'success':isError?'error':'pending',hasNextPage:next.length>0,isFetchingNextPage:queries.some((row,index)=>cursors[index].page>1&&row.isFetching),
   fetchNextPage:()=>{setState(previous=>{const current=previous.key===key?previous.cursors:initial;const seen=new Set(current.map(cursor=>cursor.sourceId+'|'+cursor.page+'|'+(cursor.token||'')));return {key,cursors:[...current,...next.filter(cursor=>!seen.has(cursor.sourceId+'|'+cursor.page+'|'+(cursor.token||'')))]};});return Promise.resolve();},
   refetch,retrySources:()=>{setState({key,cursors:initial});return client.resetQueries({queryKey:['discovery-v2',text,filterKey]});}};
 };
}
