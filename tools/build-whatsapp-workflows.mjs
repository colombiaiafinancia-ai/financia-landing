import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID, createHash } from 'node:crypto'

// Reads private exports; generated files contain credential references, never tokens.
export const originals = { main: 'ME1Bja8SRYLJVsf7', yes: 'mpwuLhBmIYDfd4fm', no: 'GmeQZiQXlEVQx1qN' }
const backup = process.env.N8N_BACKUP_DIR || path.join(os.tmpdir(), 'financia-n8n-identity-audit')
const out = path.resolve('n8n/generated')
const context = "$('Contexto WhatsApp').first().json"
const edge = (node, index = 0) => ({ node, type: 'main', index })
const node = (name, type, parameters, position = [0, 0], typeVersion = 2) => ({ id: randomUUID(), name, type: `n8n-nodes-base.${type}`, typeVersion, parameters, position })
const code = (name, jsCode, position) => node(name, 'code', { jsCode }, position)
function get(w, name) { const n = w.nodes.find(n => n.name === name); if (!n) throw new Error(`Missing ${name}`); return n }
function connect(w, from, ...to) { w.connections[from] = { main: [to.map(n => edge(n))] } }
function redirect(w, old, target) { for (const c of Object.values(w.connections)) for (const outputs of Object.values(c)) for (const es of outputs) for (const e of es) if (e.node === old) e.node = target }
function replaceCode(w, name, jsCode) {
  const old = get(w, name), fresh = code(name, jsCode, old.position)
  Object.keys(old).forEach(k => delete old[k]); Object.assign(old, fresh)
}
function request(w, name, endpoint, payloadExpression, unwrap = 'return $input.all();') {
  const old = get(w, name), signName = `${name} · firmar`, httpName = `${name} · API`
  const [x,y] = old.position
  redirect(w, name, signName)
  const sign = code(signName, `const crypto = require('crypto');
const secret = $env.WHATSAPP_INTERNAL_SECRET;
const base = $env.FINANCIA_BACKEND_URL;
if (!secret || !base || !base.startsWith('https://')) throw new Error('Configure verified WhatsApp backend first');
const path = '/api/internal/whatsapp/${endpoint}';
return $input.all().map((item, index) => {
  const $json = item.json;
  const payload = ${payloadExpression};
  const body = JSON.stringify(payload), timestamp = String(Date.now()), nonce = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', secret).update(timestamp+'\\n'+nonce+'\\nPOST\\n'+path+'\\n'+body).digest('hex');
  return {json:{url:base.replace(/\\/$/,'')+path,body,timestamp,nonce,signature},pairedItem:{item:index}};
});`, [x-420,y])
  const http = node(httpName, 'httpRequest', { method: 'POST', url: '={{ $json.url }}', sendHeaders: true,
    headerParameters: { parameters: [
      { name: 'x-financia-timestamp', value: '={{ $json.timestamp }}' },
      { name: 'x-financia-nonce', value: '={{ $json.nonce }}' },
      { name: 'x-financia-signature', value: '={{ $json.signature }}' },
    ] }, sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: '={{ $json.body }}',
    options: { timeout: 55000, redirect: { redirect: { followRedirects: false } } },
  }, [x-210,y], 4.2)
  w.nodes.push(sign,http); replaceCode(w,name,unwrap)
  connect(w,signName,httpName); connect(w,httpName,name)
  return signName
}
function newRequest(w,name,endpoint,payload,unwrap,position) {
  w.nodes.push(code(name,'',position)); return request(w,name,endpoint,payload,unwrap)
}
function operation(w,name,kind,payload = '$json', unwrap) {
  return request(w,name,'operation',`({eventKey:${context}.event_key,kind:${JSON.stringify(kind)},index:$json.operation_index??0,payload:${payload}})`,
    unwrap ?? `return $input.all().flatMap((item,i)=>{const r=item.json.result;return (Array.isArray(r)?(r.length?r:[{}]):[r]).map(json=>({json,pairedItem:{item:i}}));});`)
}
function expression(value) {
  if (!value?.startsWith('=')) return JSON.stringify(value || '')
  const text = value.slice(1)
  const parts = []; let last = 0
  for (const m of text.matchAll(/{{([\s\S]*?)}}/g)) {
    if (m.index>last) parts.push(JSON.stringify(text.slice(last,m.index)))
    parts.push(`String((${m[1].trim()})??'')`); last=m.index+m[0].length
  }
  if (last<text.length) parts.push(JSON.stringify(text.slice(last)))
  return parts.join('+') || "''"
}
function allSends(w) {
  for (const n of [...w.nodes]) if (n.type==='n8n-nodes-base.whatsApp' && n.parameters.operation==='send') {
    const body = expression(n.parameters.textBody)
    request(w,n.name,'send',`({eventKey:${context}.event_key,key:${JSON.stringify(n.name)},content:{type:'text',text:${body}}})`)
  }
}
function normalizeReferences(w) {
  const rules = [
    [/\$\('WhatsApp Trigger'\)\.(?:item|first\(\)|all\(\)\[0\])\.json\.messages\[0\]\.text\.body/g,`${context}.message`],
    [/\$\('WhatsApp Trigger'\)\.(?:item|first\(\)|all\(\)\[0\])\.json\.messages\[0\]\.type/g,`${context}.message_type`],
    [/\$\('WhatsApp Trigger'\)\.(?:item|first\(\)|all\(\)\[0\])\.json\.messages\[0\]\./g,`${context}.`],
  ]
  for (const n of w.nodes) if (n.type!=='n8n-nodes-base.whatsAppTrigger') {
    let s = JSON.stringify(n.parameters); for (const [re,value] of rules) s=s.replace(re,value)
    n.parameters=JSON.parse(s)
  }
}
function base(key) {
  const raw=JSON.parse(fs.readFileSync(path.join(backup,`${originals[key]}.json`),'utf8').replace(/^\uFEFF/,''))
  const w={name:`${raw.name} - WhatsApp identidad v3`,nodes:structuredClone(raw.nodes),connections:structuredClone(raw.connections),
    settings:{executionOrder:'v1',saveDataErrorExecution:'none',saveDataSuccessExecution:'none',saveManualExecutions:false}}
  for (const n of w.nodes) {
    n.id=randomUUID(); if (n.webhookId) n.webhookId=randomUUID()
    // All plaintext headers are removed. Media downloads already use encrypted credentials.
    if (n.parameters.headerParameters) delete n.parameters.headerParameters
  }
  return {w,manifest:{id:raw.id,name:raw.name,active:raw.active,
    sha256:createHash('sha256').update(JSON.stringify({nodes:raw.nodes,connections:raw.connections})).digest('hex')}}
}
export function buildWorkflows() {
  const m=base('main'), y=base('yes'), n=base('no'), w=m.w
  // A sub-execution per inbound message keeps legacy first()/all()[0] scoped to one sender.
  w.nodes.push(node('Contexto WhatsApp','executeWorkflowTrigger',{inputSource:'passthrough'},[-300,1400],1.1))
  const resolve=newRequest(w,'Normalizar y resolver','resolve','({payload:$json})',
    "return $input.all().flatMap((item,i)=>(item.json.items??[]).map(json=>({json,pairedItem:{item:i}})));",[-400,900])
  w.nodes.push(node('Procesar cada mensaje','executeWorkflow',{source:'database',workflowId:{__rl:true,value:'={{ $workflow.id }}',mode:'id'},
    mode:'each',workflowInputs:{mappingMode:'passthrough',value:{},schema:[],matchingColumns:[]},options:{waitForSubWorkflow:true}},[0,900],1.2))
  connect(w,'WhatsApp Trigger',resolve); connect(w,'Normalizar y resolver','Procesar cada mensaje')
  connect(w,'Contexto WhatsApp','If');
  get(w,'If').parameters.conditions.conditions=[{id:randomUUID(),leftValue:'={{ $json.process_financial === true }}',rightValue:true,operator:{type:'boolean',operation:'equals'}}]
  replaceCode(w,'Datos whtas',`const c=${context};return [{json:{...c,instance:{name:c.name},message:{content_type:c.message_type},audio:c.audio??{},image:c.image??{},Número_telefono:c.phone,id_tel:c.phone,id_usuario:c.user_id,numero_usuario:c.phone}}];`)
  for (const name of ['HTTP Request2','HTTP Request4','If4']) {
    replaceCode(w,name,"throw new Error('Legacy phone lookup is disabled in identity v3');"); get(w,name).disabled=true; delete w.connections[name]
  }
  get(w,'Get a row').parameters.filters.conditions=[{keyName:'user_id',keyValue:`={{ ${context}.user_id }}`}]
  get(w,'Code').parameters.jsCode=get(w,'Code').parameters.jsCode.replace('items.map(item => {','items.map((item, operation_index) => {').replace('...item,','...item,\n      operation_index,')
  operation(w,'Edit Fields1','interpretation',`({output:$json.output})`)
  const stage=newRequest(w,'Guardar movimientos del mensaje','operation',`({eventKey:${context}.event_key,kind:'stage',payload:$input.all().map(i=>i.json)})`,
    "return $input.first().json.result.map((json,i)=>({json,pairedItem:{item:0}}));",[1600,900])
  // Exactly one request stages the whole message; original routing continues on the saved items.
  get(w,'Guardar movimientos del mensaje · firmar').parameters.jsCode=get(w,'Guardar movimientos del mensaje · firmar').parameters.jsCode.replace('$input.all().map((item, index)', '$input.all().slice(0,1).map((item, index)')
  connect(w,'Code',stage);connect(w,'Guardar movimientos del mensaje','If1')
  operation(w,'Create a row','transaction'); operation(w,'Create a row2','budget'); operation(w,'Update a row','budget')
  // The batch has already validated/persisted all items. Do not branch on a DB error.
  w.connections['Create a row2']={main:[[edge('No Operation, do nothing')]]}
  request(w,'HTTP Request3','send',`({eventKey:${context}.event_key,key:'confirmation-summary',content:{type:'interactive',interactive:{type:'button',body:{text:$('Natural languague').first().json.resumen},action:{buttons:[{type:'reply',reply:{id:'Aceptar',title:'Si'}},{type:'reply',reply:{id:'Rechazar',title:'No'}}]}}}})`)
  for (const [name,key] of [['msj_si','yes'],['msj_no','no']]) {
    const pass=`Contexto para ${name}`;w.nodes.push(code(pass,`return [{json:${context}}];`,get(w,name).position.map((v,i)=>v-(i===0?220:0))))
    redirect(w,name,pass);connect(w,pass,name)
    get(w,name).parameters.workflowId={__rl:true,value:`__${key.toUpperCase()}_WORKFLOW_ID__`,mode:'id'}
    get(w,name).parameters.workflowInputs={mappingMode:'passthrough',value:{},schema:[],matchingColumns:[]}
  }
  normalizeReferences(w); allSends(w)
  // Known button IDs are independent of translated display titles.
  for (const [i,id] of ['Aceptar','Rechazar'].entries()) {
    const c=get(w,'Switch3').parameters.rules.values[i].conditions.conditions[0]
    c.leftValue=`={{ ${context}.interactive?.button_reply?.id }}`;c.rightValue=id
  }
  for (const entry of [y,n]) {
    const sw=entry.w,t=get(sw,'When Executed by Another Workflow')
    t.name='Contexto WhatsApp';sw.connections[t.name]=sw.connections['When Executed by Another Workflow'];delete sw.connections['When Executed by Another Workflow']
    const data=entry===y?'Datos whtas1':'Datos whtas'
    replaceCode(sw,data,`return [{json:${context}}];`)
    if(entry===y){
      const confirm=newRequest(sw,'Confirmar conjunto pendiente','operation',`({eventKey:${context}.event_key,kind:'confirm_all'})`,"return [{json:$input.first().json.result}];",[0,800])
      const prior=sw.connections[data];connect(sw,data,confirm);sw.connections['Confirmar conjunto pendiente']=prior
      for(const [name,kind] of [['Confirmation transacciones ingresos','ingreso'],['Confirmation transacciones gastos','gasto']])
        replaceCode(sw,name,`const rows=$('Confirmar conjunto pendiente').first().json.${kind};return (rows.length?rows:[{}]).map(json=>({json}));`)
    } else operation(sw,'Delete a row1','cancel','{}')
    allSends(sw)
  }
  for(const entry of [m,y,n]) {
    // Disabled/disconnected legacy code stays disconnected; private exports retain the originals.
    for(const node of entry.w.nodes) if(node.name==='Fechas1') node.parameters.jsCode=node.parameters.jsCode.replace(/\$vars\.[^;]+;/g,'')
    const text=JSON.stringify(entry.w)
    if(/eyJ[A-Za-z0-9_-]{15,}\.|Bearer [A-Za-z0-9]/.test(text)) throw new Error('Secret found in generated workflow')
  }
  return {main:w,yes:y.w,no:n.w,manifest:[m.manifest,y.manifest,n.manifest]}
}
if(process.argv[1]===new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1') || process.argv[1]?.endsWith('build-whatsapp-workflows.mjs')) {
  fs.mkdirSync(out,{recursive:true});const built=buildWorkflows()
  for(const key of ['main','yes','no','manifest']) fs.writeFileSync(path.join(out,`${key}.json`),JSON.stringify(built[key],null,2)+'\n')
  console.log(JSON.stringify({generated:['main','yes','no'],nodes:Object.fromEntries(['main','yes','no'].map(k=>[k,built[k].nodes.length]))}))
}
