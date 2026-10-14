export function safeURL(value){try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
export function videoSource(value){
  try{const url=new URL(value);let id;
    if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(url.hostname))id=url.searchParams.get('v')||url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
    if(url.hostname==='youtu.be')id=url.pathname.slice(1);
    if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))return{type:'youtube',id,embed:`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`};
    if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(url.hostname)){id=url.pathname.match(/(?:^|\/)(\d+)(?:$|\/)/)?.[1];if(id)return{type:'vimeo',id,embed:`https://player.vimeo.com/video/${id}?autoplay=1`};}
  }catch{}return null;
}
const normalize=value=>String(value??'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export function filterFilms(films,filters,omit=''){
  const query=normalize(filters.query).trim();
  return films.filter(film=>(omit==='category'||!filters.category||normalize(film.category)===normalize(filters.category))&&(omit==='brand'||!filters.brand||normalize(film.client)===normalize(filters.brand))&&(omit==='year'||!filters.year||String(film.year)===filters.year)&&(omit==='tag'||!filters.tag||film.tags.some(tag=>normalize(tag)===normalize(filters.tag)))&&(!query||normalize([film.title,film.client,film.description,...film.tags].join(' ')).includes(query)));
}
export function facetValues(films,filters,facet){const available=filterFilms(films,filters,facet);const unique=new Map();for(const value of available.flatMap(film=>facet==='tag'?film.tags:[facet==='brand'?film.client:facet==='year'?film.year&&String(film.year):film.category]).filter(Boolean)){if(!unique.has(normalize(value)))unique.set(normalize(value),value);}return [...unique.values()];}
