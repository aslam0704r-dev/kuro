// PDF.js may warn and skip a broken image instead of rejecting its render.
// Forward image warnings through a separate message namespace; no PDF scripts
// or interactive viewer are loaded by this worker.
const log=console.log.bind(console),warn=console.warn.bind(console);
function report(args){
 const value=args.map(v=>String(v)).join(' ');
 if(/(?:image|jpeg|jpx|jbig2).*(?:error|failed|invalid|corrupt|decode|exceed|removed|missing)|(?:unable|failed).*decode.*image/i.test(value))self.postMessage({targetName:'kuro-pdf-validation',kind:'image-warning'});
}
console.log=(...args)=>{report(args);log(...args);};
console.warn=(...args)=>{report(args);warn(...args);};
await import('/vendor/local/pdf.worker.mjs');
self.postMessage({targetName:'kuro-pdf-validation',kind:'ready'});
