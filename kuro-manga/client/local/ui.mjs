import {prepareImport} from './importer.mjs';
import {importError,cleanTitle} from './model.mjs';
const accept='.cbz,.zip,.cbr,.rar,.cb7,.7z,.cbt,.tar,.tgz,.tar.gz,.tar.bz2,.tar.xz,.epub,.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif';
export function libraryExtension(React,Original,runtime){
 const h=React.createElement;
 const size=n=>n<1024*1024?(n/1024).toFixed(0)+' KiB':(n/1024/1024).toFixed(1)+' MiB';
 function ImportDialog({onClose}){
  React.useSyncExternalStore(runtime.subscribe,runtime.getSnapshot);
  const ref=React.useRef(),fileRef=React.useRef(),folderRef=React.useRef(),controller=React.useRef();
  const [draft,setDraft]=React.useState(),[title,setTitle]=React.useState(''),[busy,setBusy]=React.useState(''),[progress,setProgress]=React.useState(''),[error,setError]=React.useState(''),[result,setResult]=React.useState(),[confirm,setConfirm]=React.useState(''),[drag,setDrag]=React.useState(false),[reverse,setReverse]=React.useState(false),[cover,setCover]=React.useState('');
  React.useEffect(()=>{const previous=document.activeElement;ref.current.showModal?.();if(!ref.current.open)ref.current.setAttribute('open','');fileRef.current?.parentElement.querySelector('button')?.focus();
   return()=>{controller.current?.abort();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
  React.useEffect(()=>{if(!draft)return;const url=URL.createObjectURL(reverse?draft.pages[draft.pages.length-1].blob:draft.cover);setCover(url);return()=>URL.revokeObjectURL(url);},[draft,reverse]);
  const close=()=>{if(busy==='save')return;controller.current?.abort();onClose();};
  async function choose(files){
   if(busy||!files?.length)return;const current=new AbortController();controller.current?.abort();controller.current=current;
   setBusy('prepare');setProgress('Opening your comic…');setError('');setDraft(undefined);setResult(undefined);setReverse(false);
   try{const prepared=await prepareImport(files,{signal:current.signal,onProgress:setProgress});if(current.signal.aborted)return;setDraft(prepared);setTitle(prepared.title);}
   catch(e){if(!current.signal.aborted)setError(importError(e));}finally{if(controller.current===current)setBusy('');}
  }
  async function save(){
   if(!draft||busy)return;setBusy('save');setError('');setProgress('Saving to this device…');const current=new AbortController();controller.current=current;
   try{const prepared=reverse?{...draft,pages:[...draft.pages].reverse(),cover:await (await import('./images.mjs')).coverFor(draft.pages[draft.pages.length-1],current.signal)}:draft;
    const saved=await runtime.save(prepared,{title,signal:current.signal});setResult(saved);setDraft(undefined);setProgress('');}
   catch(e){setError(importError(e));}finally{setBusy('');}
  }
  async function action(fn){setError('');try{await fn();}catch(e){setError(importError(e));}}
  const button=(text,props={})=>h('button',{type:'button',...props},text);
  const bookRows=runtime.books.map(book=>h('li',{key:book.id,className:'kuro-local-book'},
   h('img',{src:runtime.cover(book),alt:'',width:42,height:60}),
   h('div',{className:'kuro-local-book-info'},h('strong',{},book.title),h('small',{},book.pageCount+' pages · '+book.format+' · '+size(book.size))),
   h('div',{className:'kuro-local-book-actions'},confirm===book.id?h(React.Fragment,{},h('span',{},'Delete browser copy and progress?'),button('Delete copy',{className:'kuro-local-danger',onClick:()=>action(async()=>{await runtime.delete(book.id);setConfirm('');})}),button('Keep',{onClick:()=>setConfirm('')})):
    h(React.Fragment,{},button('Read',{disabled:!!busy,onClick:()=>action(async()=>{await runtime.read(book.id);onClose();})}),!runtime.inLibrary(book.id)?button('Add to library',{disabled:!!busy,'aria-label':'Add '+book.title+' to library',onClick:()=>action(()=>runtime.add(book.id))}):null,button('Delete files',{disabled:!!busy,'aria-label':'Delete device files for '+book.title,onClick:()=>setConfirm(book.id)})))
  ));
  return h('dialog',{ref,id:'kuro-local-dialog','aria-labelledby':'kuro-local-dialog-title','aria-describedby':'kuro-local-note',className:'kuro-local-dialog',onCancel:e=>{e.preventDefault();close();},onClose:close},
   h('header',{className:'kuro-local-dialog-header'},h('div',{},h('p',{className:'kuro-local-eyebrow'},'YOUR FILES / YOUR STORIES'),h('h2',{id:'kuro-local-dialog-title'},'Import manga')),button('×',{className:'kuro-local-close','aria-label':'Close import',disabled:busy==='save',onClick:close})),
   h('p',{id:'kuro-local-note',className:'kuro-local-note'},'Only reviewed comics can be imported under KURO’s strict content rules. Unreviewed files are refused before preview. Files stay on this browser/device and are never uploaded.'),
   h('section',{className:'kuro-local-drop'+(drag?' is-dragging':''),'aria-label':'Choose manga files',onDragOver:e=>{e.preventDefault();if(!busy)setDrag(true);},onDragLeave:()=>setDrag(false),onDrop:e=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files);}},
    h('span',{className:'kuro-local-file-icon','aria-hidden':true},'↥'),h('strong',{},'A new story, from your device.'),h('p',{},'Drop one comic or PDF here, or choose image pages.'),
    h('input',{ref:fileRef,id:'kuro-local-files',type:'file',accept,multiple:true,hidden:true,onChange:e=>{choose(e.target.files);e.target.value='';},'aria-label':'Manga files'}),
    h('input',{ref:folderRef,id:'kuro-local-folder',type:'file',accept,multiple:true,webkitdirectory:'',hidden:true,onChange:e=>{const files=Array.from(e.target.files).filter(f=>/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name)&&!(f.webkitRelativePath||f.name).split('/').some(s=>s.startsWith('.')||s==='__MACOSX'));choose(files);e.target.value='';},'aria-label':'Manga image folder'}),
    h('div',{className:'kuro-local-choices'},button('Choose files',{className:'kuro-local-primary',disabled:!!busy||runtime.loading||!!runtime.error,onClick:()=>fileRef.current.click()}),button('Choose image folder',{disabled:!!busy||runtime.loading||!!runtime.error,onClick:()=>folderRef.current.click()})),
    h('small',{},'CBZ / ZIP · CBR / RAR · CB7 / 7z · CBT / TAR · PDF · image EPUB · image pages'),
    h('small',{},'150 MiB input · 600 pages · 12 MiB per image. One comic per import.')
   ),
   busy?h('div',{className:'kuro-local-progress',role:'status','aria-live':'polite'},h('span',{className:'kuro-local-spinner','aria-hidden':true}),h('span',{},progress),busy==='prepare'?button('Cancel import',{onClick:()=>{controller.current?.abort();setBusy('');setProgress('');setError('Import cancelled. No book was added.');}}):null):null,
   (error||runtime.error)?h('p',{className:'kuro-local-error',role:'alert'},error||runtime.error):null,
   draft?h('section',{className:'kuro-local-draft','aria-label':'Comic preview'},h('img',{src:cover,alt:'First page preview'}),
    h('div',{},h('label',{htmlFor:'kuro-local-title'},'Manga title'),h('input',{id:'kuro-local-title',value:title,maxLength:120,disabled:!!busy,onChange:e=>setTitle(e.target.value),'aria-label':'Manga title'}),h('p',{},draft.pages.length+' pages · '+draft.format+' · '+size(draft.size)),
     h('label',{className:'kuro-local-order'},h('input',{type:'checkbox',checked:reverse,disabled:!!busy,onChange:e=>setReverse(e.target.checked)}),'Reverse page order'),
     h('small',{},'Page order: '+(reverse?[...draft.pages].reverse():draft.pages).slice(0,3).map(p=>p.name).join(' → ')),
     button('Add to library',{className:'kuro-local-primary',disabled:!!busy||!title.trim(),onClick:save}))) :null,
   result?h('section',{id:'kuro-local-result',className:'kuro-local-result',role:'status'},h('strong',{},result.duplicate?'Already imported — ready in your library.':'Added to your library.'),h('p',{},result.book.title+' · '+result.book.pageCount+' pages. Your progress is saved on this device.'),h('div',{className:'kuro-local-choices'},button('Read now',{className:'kuro-local-primary',onClick:()=>action(async()=>{await runtime.read(result.book.id);onClose();})}),button('Back to library',{onClick:close}))) :null,
   h('section',{className:'kuro-local-device-files','aria-label':'Manga stored on this device'},h('div',{className:'kuro-local-section-heading'},h('h3',{},'On this device'),h('span',{},runtime.books.length+' comics')),
    runtime.loading?h('p',{role:'status'},'Opening device storage…'):bookRows.length?h('ul',{},bookRows):h('p',{},'Approved device manga will appear here and in your Library.'),
    runtime.hiddenCount?h('p',{className:'kuro-content-notice'},runtime.hiddenCount+' unverified device comic'+(runtime.hiddenCount===1?' is':'s are')+' hidden. Stored files are preserved.'):null,
    h('small',{},'Deleting files removes KURO’s browser copy and reading progress. Your original file on the device stays intact. Clearing website data also deletes these copies.'))
  );
 }
 function Controls(){
  React.useSyncExternalStore(runtime.subscribe,runtime.getSnapshot);const [open,setOpen]=React.useState(false);
  return h('div',{className:'kuro-local-toolbar',id:'kuro-local-toolbar'},h('button',{type:'button',className:'kuro-local-import-button',onClick:()=>setOpen(true)},h('span',{'aria-hidden':true},'＋'),'Import manga'),
   runtime.books.length?h('button',{type:'button',className:'kuro-local-files-button',onClick:()=>setOpen(true)},'Device files · '+runtime.books.length):h('span',{className:'kuro-local-device-caption'},'Reviewed files only'),
   open?h(ImportDialog,{onClose:()=>setOpen(false)}):null);
 }
 return function LibraryWithImport(props){
  const tree=Original(props);if(!React.isValidElement(tree))return tree;
  const children=React.Children.toArray(tree.props.children),header=children[0];if(!React.isValidElement(header))return tree;
  const inside=React.Children.toArray(header.props.children);inside.splice(2,0,h(Controls,{key:'kuro-local-controls'}));
  inside.push(h('p',{key:'strict-content-rule',className:'kuro-content-notice'},'Strict content rules: adult, suggestive and unverified titles are hidden. Saved entries and files are preserved.'));
  children[0]=React.cloneElement(header,{},inside);return React.cloneElement(tree,{},children);
 };
}
