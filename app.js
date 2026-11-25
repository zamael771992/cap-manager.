'use strict';
const storageKey = 'cap-manager:v1';
const $ = selector => document.querySelector(selector);
const notice = message => { $('#notice').textContent = message; };
const id = () => crypto.randomUUID();
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const token = () => 'CAP-' + id().replaceAll('-', '').slice(0, 16).toUpperCase();
const dateLabel = date => Intl.DateTimeFormat('es-MX', {dateStyle:'long'}).format(new Date(date+'T12:00:00'));

function readEvents(){
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [{
    id:id(), title:'Taller de RCP · Demostración', date:today(), speaker:'Equipo CAP',
    token:token(), attendees:[], demo:true
  }];
}

let events;
try { events = readEvents(); }
catch { notice('No se pudieron abrir los datos locales. Revisa los permisos de almacenamiento del navegador.'); }

function persist(next, onError = notice){
  try { localStorage.setItem(storageKey, JSON.stringify(next)); }
  catch { onError('No se guardó el cambio. Revisa el almacenamiento del navegador e inténtalo de nuevo.'); return false; }
  events = next;
  return true;
}

let selected = events?.[0]?.id;
const editor = $('#editor');
const eventForm = $('#event-form');
const certificate = $('#certificate');

function drawQR(canvas, code){
  const qr = new CAPQRCode(2, 0);
  qr.addData(code);
  qr.make();
  const scale = 8;
  const size = qr.getModuleCount();
  canvas.width = canvas.height = (size + 8) * scale;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0,0,canvas.width,canvas.height);
  context.fillStyle = '#102744';
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    if(qr.isDark(y,x)) context.fillRect((x+4)*scale,(y+4)*scale,scale,scale);
  }
}

function text(tag, value){
  const element = document.createElement(tag);
  element.textContent = value;
  return element;
}

function printCertificate(event, person){
  certificate.replaceChildren(
    text('p','Universidad Autónoma de Sinaloa · Facultad de Medicina'),
    text('p','Comité de Asesores Par'),
    text('h1',event.demo ? 'Constancia de demostración' : 'Constancia de asistencia'),
    text('p','Se hace constar la asistencia de'),
    text('h2',person.name),
    text('p','a la actividad «'+event.title+'», el '+dateLabel(event.date)+'.'),
    text('p','Folio local '+person.id)
  );
  certificate.hidden = false;
  try { window.print(); }
  finally { certificate.hidden = true; }
}

function register(event, form){
  const fields = new FormData(form);
  const name = fields.get('name').trim();
  const student = fields.get('student').trim().toUpperCase();
  const code = fields.get('token').trim().toUpperCase();
  if(!name || !student){ notice('Escribe el nombre completo y la matrícula.'); return; }
  if(code !== event.token){ notice('El código corresponde a otro evento o está incompleto.'); return; }
  if(event.attendees.some(person => person.student === student)){
    notice('Esta matrícula ya tiene asistencia registrada.'); return;
  }
  const {answers, error} = readAnswers(event.questions ?? [], fields);
  if(error){ form.querySelector('.attendance-error').textContent = error; return; }
  const updated = {...event, attendees:[...event.attendees,{id:id(),name,student,time:new Date().toISOString(),answers}]};
  if(persist(events.map(item => item.id === event.id ? updated : item))){
    render();
    notice('Asistencia registrada para '+name+'.');
  }
}

async function configureScanner(form, event){
  if(!('BarcodeDetector' in window) || !('createImageBitmap' in window)) return;
  try {
    if(!(await BarcodeDetector.getSupportedFormats()).includes('qr_code')) return;
    const detector = new BarcodeDetector({formats:['qr_code']});
    const input = form.querySelector('.scan');
    input.parentElement.hidden = false;
    input.addEventListener('change',async ()=>{
      if(!input.files.length) return;
      let bitmap;
      try {
        bitmap = await createImageBitmap(input.files[0]);
        const codes = await detector.detect(bitmap);
        const code = codes.map(result=>result.rawValue.trim().toUpperCase()).find(value=>value===event.token);
        if(code) form.elements.token.value = code;
        notice(code ? 'Código leído.' : 'La imagen no contiene el QR de este evento.');
      } catch { notice('No se pudo leer la imagen. Puedes escribir el código.'); }
      finally { bitmap?.close(); input.value = ''; }
    });
  } catch { /* Manual event code remains available. */ }
}

function render(){
  const list = $('#events');
  list.replaceChildren();
  for(const e of [...events].sort((a,b)=>b.date.localeCompare(a.date))){
    const button = text('button',e.title);
    button.className = 'event-button';
    button.setAttribute('aria-current',String(e.id===selected));
    button.append(text('small',dateLabel(e.date)));
    button.onclick = ()=>{ selected=e.id; notice(''); render(); };
    list.append(button);
  }
  const event = events.find(item => item.id === selected);
  const detail = $('#detail');
  detail.replaceChildren();
  if(!event){ detail.append(text('p','Selecciona o crea un evento.')); return; }
  detail.append($('#event-view').content.cloneNode(true));
  $('.event-title').textContent = event.title;
  $('.event-date').textContent = dateLabel(event.date);
  $('.speaker').textContent = event.speaker ? 'Ponente · '+event.speaker : '';
  $('.total').textContent = event.attendees.length+' '+(event.attendees.length===1?'asistencia':'asistencias');
  $('.token').textContent = event.token;
  drawQR($('.qr'),event.token);
  const form = $('.attendance');
  renderQuestions(form.querySelector('.custom-fields'), event.questions ?? []);
  $('.edit-schema').onclick = () => openSchemaEditor(event);
  form.oninput = () => { form.querySelector('.attendance-error').textContent = ''; };
  form.onsubmit = e=>{e.preventDefault(); register(event,form);};
  configureScanner(form,event);
  if(!event.attendees.length) $('.attendees').append(text('li','Todavía no hay asistencias.'));
  for(const person of event.attendees){
    const row = document.createElement('li');
    const label = text('div',person.name);
    label.className = 'person';
    label.append(text('small',person.student));
    if(person.answers?.length){
      const details = document.createElement('details');
      details.append(text('summary','Ver respuestas'));
      const responses = document.createElement('dl');
      for(const answer of person.answers){
        responses.append(text('dt',answer.label),text('dd',Array.isArray(answer.value) ? answer.value.join(', ') : answer.value));
      }
      details.append(responses);
      label.append(details);
    }
    const print = text('button','Abrir constancia');
    print.className = 'secondary';
    print.onclick = ()=>printCertificate(event,person);
    row.append(label,print);
    $('.attendees').append(row);
  }
}

if(events){
  if(!localStorage.getItem(storageKey)) persist(events);
  $('#new').onclick = ()=>{eventForm.reset();eventForm.elements.date.value=today();editor.showModal();};
  $('#cancel').onclick = ()=>editor.close();
  eventForm.onsubmit = e=>{
    e.preventDefault();
    const fields = new FormData(eventForm);
    const title = fields.get('title').trim();
    if(!title) { eventForm.elements.title.focus(); return; }
    const event = {id:id(),title,date:fields.get('date'),speaker:fields.get('speaker').trim(),token:token(),attendees:[]};
    if(persist([...events,event])){
      selected=event.id; editor.close(); render(); notice('Evento guardado.');
    }
  };
  render();
}else $('#new').disabled=true;

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
