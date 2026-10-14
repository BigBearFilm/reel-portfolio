import {filterFilms, facetValues, videoSource, safeURL} from './portfolio.js';
const ENDPOINT='https://ltyafffwvirfvmjrkzwj.supabase.co/functions/v1/reel-portfolio';
const PUBLIC_KEY='sb_publishable_iFo9WnFVlvo85S5_DpzKkQ_s8oSS05E';
const STORAGE='reel-portfolio-session-v1';
const $=id=>document.getElementById(id);
const paths={search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',lock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4','arrow-right':'M4 12h16m-6-6 6 6-6 6',refresh:'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M18 17a7 7 0 0 1-12 1l-2-6',logout:'M9 4H4v16h5m5-13 5 5-5 5m-6-5h11',building:'M5 21V3h14v18M2 21h20M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3',calendar:'M4 5h16v16H4zM8 2v6m8-6v6M4 10h16',tag:'M3 3h8l10 10-8 8L3 11zM7 7h.01',reset:'M4 10V4m0 0h6M4 4a9 9 0 1 1-1 12',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',list:'M9 5h12M9 12h12M9 19h12M3 5h1m-1 7h1m-1 7h1',play:'M8 4l13 8-13 8z',close:'M5 5l14 14M19 5 5 19',external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',link:'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2m3 4a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]??paths.play);svg.append(path);return svg;}
document.querySelectorAll('[data-icon]').forEach(node=>node.replaceChildren(icon(node.dataset.icon)));
let session=null,films=[],current=null,visibleCount=30,loadGeneration=0;
let filters={query:'',category:'',brand:'',year:'',tag:''};
const collator=new Intl.Collator('pl',{numeric:true,sensitivity:'base'});
const text=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value??'';if(className)node.className=className;return node;};
const errorMessage=(node,message)=>{node.textContent=message??'';node.hidden=!message;};
function saveSession(value){session=value;try{if(value)sessionStorage.setItem(STORAGE,JSON.stringify(value));else sessionStorage.removeItem(STORAGE);}catch{}}
async function api(action,body={},authenticated=true){
  const headers={'Content-Type':'application/json',apikey:PUBLIC_KEY};
  if(authenticated&&session){if(session.type==='isolated')headers['x-reel-session']=session.token;else headers.Authorization=`Bearer ${session.token}`;}
  let response;
  try{response=await fetch(ENDPOINT,{method:'POST',headers,body:JSON.stringify({action,...body}),cache:'no-store',credentials:'omit'});}catch{throw new Error('Nie udało się połączyć z Reel. Sprawdź połączenie z internetem.');}
  const data=await response.json().catch(()=>({error:'Serwer nie odpowiedział poprawnie.'}));
  if(!response.ok){const error=new Error(data.error??'Połączenie jest chwilowo niedostępne.');error.status=response.status;throw error;}
  return data;
}
function showLogin(message=''){
  loadGeneration++;saveSession(null);films=[];current=null;$('films').replaceChildren();$('categories').replaceChildren();$('library').hidden=true;$('login').hidden=false;$('loading').hidden=true;
  if($('player').open)$('player').close();$('video-frame').replaceChildren();errorMessage($('login-error'),message);
}
async function validSession(){
  if(!session)return false;
  const original=session;
  if(new Date(session.expiresAt).getTime()<=Date.now()+30000){
    if(session.type==='legacy'&&session.refreshToken){const renewed=await api('refresh',{refreshToken:original.refreshToken},false);if(session!==original)return false;saveSession(renewed);}
    else {showLogin('Sesja wygasła. Zaloguj się ponownie.');return false;}
  }
  return true;
}
async function loadLibrary(){
  try{
    const generation=++loadGeneration;
    if(!await validSession()||generation!==loadGeneration)return;
    $('library').hidden=false;$('login').hidden=true;$('loading').hidden=films.length>0;$('refresh').disabled=true;errorMessage($('library-error'),'');
    const result=await api('library');if(generation!==loadGeneration)return;
    films=result.items.map(item=>({...item,tags:Array.isArray(item.tags)?item.tags.filter(tag=>typeof tag==='string'):[],year:typeof item.year==='number'?item.year:null,description:item.description??'',client:item.client??'',category:item.category??'Pozostałe',title:item.title??'Bez tytułu'}));
    $('total').textContent=films.length;$('workspace-name').textContent=result.workspace?.name??'Big Bear Film';$('account-name').textContent=session.email;
    $('synced').textContent='odświeżono '+new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
    render();
  }catch(error){if(error.status===401||error.status===403){showLogin(error.message);}else{errorMessage($('library-error'),error.message);}}
  finally{$('loading').hidden=true;$('refresh').disabled=false;}
}
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();$('sign-in').disabled=true;$('sign-in').firstElementChild.textContent='Łączę z Reel…';errorMessage($('login-error'),'');
  try{const result=await api('login',{email:$('email').value.trim(),password:$('password').value},false);saveSession(result);$('password').value='';await loadLibrary();}
  catch(error){errorMessage($('login-error'),error.message);}
  finally{$('sign-in').disabled=false;$('sign-in').firstElementChild.textContent='Zaloguj się do portfolio';}
});
$('show-password').addEventListener('click',()=>{const visible=$('password').type==='password';$('password').type=visible?'text':'password';$('show-password').setAttribute('aria-label',visible?'Ukryj hasło':'Pokaż hasło');$('show-password').title=visible?'Ukryj hasło':'Pokaż hasło';});
$('logout').addEventListener('click',async()=>{const logout=api('logout').catch(()=>{});showLogin();await logout;});
$('refresh').addEventListener('click',loadLibrary);
function populate(select,values,allLabel,selected){select.replaceChildren(new Option(allLabel,''));if(selected&&!values.includes(selected))values=[selected,...values];for(const value of values)select.append(new Option(value,value));select.value=selected;}
function render(){
  const values=filterFilms(films,filters);
  populate($('brand'),facetValues(films,filters,'brand').sort(collator.compare),'Wszystkie marki',filters.brand);
  populate($('year'),facetValues(films,filters,'year').sort((a,b)=>Number(b)-Number(a)),'Wszystkie lata',filters.year);
  populate($('tag'),facetValues(films,filters,'tag').sort(collator.compare),'Wszystkie tagi',filters.tag);
  const categoryValues=facetValues(films,filters,'category').sort(collator.compare);
  if(filters.category&&!categoryValues.includes(filters.category))categoryValues.unshift(filters.category);
  $('categories').replaceChildren(...['',...categoryValues].map(value=>{const button=text('button',value||'Wszystkie filmy');button.className=value===filters.category?'active':'';button.setAttribute('aria-pressed',String(value===filters.category));const count=filterFilms(films,{...filters,category:value}).length;button.append(text('small',count));button.addEventListener('click',()=>{filters.category=value;visibleCount=30;render();});return button;}));
  values.sort((a,b)=>$('sort').value==='title'?collator.compare(a.title,b.title):$('sort').value==='brand'?collator.compare(a.client,b.client)||collator.compare(a.title,b.title):(b.year??0)-(a.year??0)||collator.compare(a.client,b.client)||collator.compare(a.title,b.title));
  $('result-count').textContent=`${values.length} ${values.length===1?'materiał':'materiałów'}${filters.category?' · '+filters.category:''}`;
  $('films').replaceChildren(...values.slice(0,visibleCount).map(card));$('empty').hidden=values.length>0;$('load-more').hidden=values.length<=visibleCount;
}
function card(film){
  const article=document.createElement('article');article.className='film-card';
  const cover=document.createElement('button');cover.className='film-cover';cover.setAttribute('aria-label','Odtwórz: '+film.client+' — '+film.title);cover.addEventListener('click',()=>openFilm(film));
  const source=videoSource(film.url);const thumbnail=safeURL(film.thumbnail)||(source?.type==='youtube'?`https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`:null);
  if(thumbnail){const img=new Image();img.alt='';img.loading='lazy';img.decoding='async';img.width=480;img.height=270;img.src=thumbnail;img.addEventListener('error',()=>{if(source?.type==='youtube'&&!img.src.startsWith('https://i.ytimg.com/'))img.src=`https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`;else img.remove();});cover.append(img);}
  const play=text('span','','play-circle');play.append(icon('play'));cover.append(play);if(film.year)cover.append(text('span',film.year,'year-pill'));
  const info=text('div','','film-info');info.append(text('p',film.client||'BIG BEAR FILM','film-client'),text('h2',film.title,'film-title'),text('p',film.description||'Realizacja Big Bear Film.','film-description'));
  const bottom=text('div','','film-bottom');bottom.append(text('span',film.category,'film-category'));
  const actions=text('div','','card-actions');const copy=text('button','','icon-button');copy.append(icon('link'));copy.title='Kopiuj link do filmu';copy.setAttribute('aria-label','Kopiuj link: '+film.title);copy.addEventListener('click',()=>copyFilm(film));actions.append(copy);bottom.append(actions);info.append(bottom);article.append(cover,info);return article;
}
function resetFilters(){filters={query:'',category:'',brand:'',year:'',tag:''};$('search').value='';visibleCount=30;render();}
$('clear').addEventListener('click',resetFilters);$('empty-clear').addEventListener('click',resetFilters);
let searchTimer;$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{filters.query=$('search').value;visibleCount=30;render();},140);});
for(const key of ['brand','year','tag'])$(key).addEventListener('change',()=>{filters[key]=$(key).value;visibleCount=30;render();});
$('sort').addEventListener('change',render);$('load-more').addEventListener('click',()=>{visibleCount+=30;render();});
function changeView(list){$('films').classList.toggle('list-view',list);$('grid-view').setAttribute('aria-pressed',String(!list));$('list-view').setAttribute('aria-pressed',String(list));}
$('grid-view').addEventListener('click',()=>changeView(false));$('list-view').addEventListener('click',()=>changeView(true));
function openFilm(film){
  current=film;const source=videoSource(film.url);$('video-frame').replaceChildren();
  if(source){const iframe=document.createElement('iframe');iframe.title=film.title;iframe.src=source.embed;iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;$('video-frame').append(iframe);}else{$('video-frame').append(text('p','Ten materiał możesz otworzyć w oryginalnym serwisie.'));}
  $('player-eyebrow').textContent=[film.client,film.year].filter(Boolean).join(' · ');$('player-title').textContent=film.title;$('player-category').textContent=film.category;$('player-description').textContent=film.description||'Realizacja Big Bear Film.';$('player-tags').replaceChildren(...film.tags.map(tag=>text('span',tag)));
  const url=safeURL(film.url);$('open-source').hidden=!url;if(url)$('open-source').href=url;
  $('player').showModal();
}
$('close-player').addEventListener('click',()=>$('player').close());$('player').addEventListener('close',()=>{$('video-frame').replaceChildren();current=null;});$('player').addEventListener('click',event=>{if(event.target===$('player')){const box=$('player').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)$('player').close();}});
$('copy-link').addEventListener('click',()=>{if(current)copyFilm(current);});
function escaped(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
async function copyFilm(film){
  const url=safeURL(film.url);if(!url)return toast('Ten film nie ma poprawnego linku.');
  const label=[film.client,film.title].filter(Boolean).join(' — ');
  try{if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined'){await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([`${label}\n${url}`],{type:'text/plain'}),'text/html':new Blob([`<a href="${escaped(url)}" style="color:#235b55;text-decoration:none;font-weight:600">▶&nbsp; ${escaped(label)}</a>`],{type:'text/html'})})]);}else{await navigator.clipboard.writeText(`${label}\n${url}`);}toast('Link do filmu skopiowany.');}catch{toast('Nie udało się skopiować. Otwórz film i skopiuj adres.');}
}
let toastTimer;function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
try{const saved=JSON.parse(sessionStorage.getItem(STORAGE)||'null');if(saved&&['isolated','legacy'].includes(saved.type)&&typeof saved.token==='string'&&saved.expiresAt){session=saved;loadLibrary();}}catch{showLogin();}
