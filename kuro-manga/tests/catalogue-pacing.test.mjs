import test from 'node:test';import assert from 'node:assert/strict';import {createCatalogueService} from '../server/catalogue/service.mjs';import {createMemoryCoordinator} from '../server/catalogue/cache.mjs';
test('concurrent cold public requests are paced before the shared source budget',async()=>{
 const times=[],fetcher=async()=>{times.push(Date.now());return {body:Buffer.from(JSON.stringify({data:[]})),headers:{'content-type':'application/json'}};};
 const service=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,4),fetcher});
 await Promise.all([service.mangaDexMetadata('/manga?title=Hero'),service.mangaDexMetadata('/manga?order[createdAt]=desc')]);assert.equal(times.length,2);assert.ok(times[1]-times[0]>=250);
});
