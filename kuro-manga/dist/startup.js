// Metro must never start without the mandatory content boundary. Keep the
// original export immutable and wait for the companion bootstrap to succeed.
(() => {
 const core=window.KuroCatalogueCore;
 if(!core?.safety||typeof core.safety.verify!=='function'||typeof core.initialize!=='function'){
  const root=document.getElementById('root');
  if(root){const view=document.createElement('main');view.className='kuro-content-state';view.setAttribute('role','alert');
   const title=document.createElement('h1');title.textContent='KURO could not start safely';
   const message=document.createElement('p');message.textContent='The strict content filter did not load. Reconnect and reload KURO.';
   const button=document.createElement('button');button.type='button';button.textContent='Reload KURO';button.addEventListener('click',()=>location.reload());view.append(title,message,button);root.replaceChildren(view);
  }return;
 }
 const script=document.createElement('script');script.src='/_expo/static/js/web/entry-4ca7ae590a4065290203fe34e743fcb9.js';script.async=false;document.head.append(script);
})();
