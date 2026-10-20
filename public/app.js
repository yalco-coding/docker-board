const $ = selector => document.querySelector(selector);
const date = value => new Intl.DateTimeFormat('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'}).format(new Date(value));
function element(tag, className, text) { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; }
async function load() {
  try {
    const [configResponse, notesResponse] = await Promise.all([fetch('/api/config'), fetch('/api/notes')]);
    if (!configResponse.ok || !notesResponse.ok) throw new Error('load');
    const config = await configResponse.json(), notes = await notesResponse.json();
    document.title = config.title; $('#brand-name').textContent = config.title; $('#version').textContent = `v${config.version}`;
    $('#count').textContent = notes.length; $('#notes').replaceChildren(); $('#empty').hidden = notes.length > 0;
    for (const note of notes) {
      const card = element('button','card',''); card.type = 'button'; card.append(element('span','tag',`NOTE ${String(note.id).padStart(2,'0')}`), element('h3','',note.title), element('p','excerpt',note.body));
      const meta = element('div','meta',''); meta.append(element('span','dot',note.author.slice(0,1)),element('span','',note.author),element('span','',date(note.createdAt))); card.append(meta);
      card.addEventListener('click', () => { $('#detail-title').textContent=note.title; $('#detail-meta').textContent=`${note.author} · ${date(note.createdAt)} · #${note.id}`; $('#detail-body').textContent=note.body; $('#detail').showModal(); });
      $('#notes').append(card);
    }
  } catch { $('#status').textContent='이야기를 불러오지 못했어요, 잠시 후 새로고침해주세요.'; }
}
$('#open-form').addEventListener('click',()=>$('#compose').showModal());
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.close).close()));
$('#note-form').addEventListener('submit', async event => {
  event.preventDefault(); const button=event.currentTarget.querySelector('button[type=submit]'); button.disabled=true; $('#form-error').textContent='';
  try {
    const response=await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))});
    if (!response.ok) throw new Error((await response.json()).message);
    $('#note-form').reset(); $('#compose').close(); await load(); $('#status').textContent='새로운 이야기를 등록했어요.';
  } catch(error) { $('#form-error').textContent=error.message === 'Failed to fetch' ? '연결을 확인하고 다시 등록해주세요.' : error.message; }
  finally { button.disabled=false; }
});
load();
