import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import { verifyInternal } from '../../lib/whatsapp/security.ts'
const require = createRequire(import.meta.url)
const workflows = ['main','yes','no'].map(k=>JSON.parse(fs.readFileSync(`n8n/generated/${k}.json`,'utf8')))
test('every generated Code node is valid JavaScript; all edges have destinations',()=>{
  for(const w of workflows){
    const names=new Set(w.nodes.map(n=>n.name));assert.equal(names.size,w.nodes.length)
    for(const n of w.nodes) if(n.type==='n8n-nodes-base.code') assert.doesNotThrow(()=>new Function(n.parameters.jsCode),`${w.name}: ${n.name}`)
    for(const [source,types] of Object.entries(w.connections)){
      assert.ok(names.has(source),source)
      for(const outputs of Object.values(types)) for(const edges of outputs) for(const e of edges) assert.ok(names.has(e.node),e.node)
    }
  }
})
test('financial writes and messages only use authenticated backend; no original subflow calls',()=>{
  for(const w of workflows) for(const n of w.nodes){
    assert.ok(!(n.type==='n8n-nodes-base.supabase' && !['get','getAll'].includes(n.parameters.operation)),n.name)
    assert.ok(!(n.type==='n8n-nodes-base.whatsApp' && n.parameters.operation==='send'),n.name)
    assert.doesNotMatch(JSON.stringify(n.parameters),/messages\[0\]|metadata\.display_phone_number|mpwuLhBmIYDfd4fm|GmeQZiQXlEVQx1qN/)
    if(n.type==='n8n-nodes-base.httpRequest' && n.parameters.method==='POST') assert.equal(n.parameters.body,'={{ $json.body }}')
  }
})
test('generated HMAC code agrees with backend; body escaping roundtrips',()=>{
  const n=workflows[0].nodes.find(n=>n.name==='Normalizar y resolver · firmar')
  const payload={text:'"quoted"\nline',messages:[]},secret='test-only-secret'
  const result=new Function('$env','$input','require',n.parameters.jsCode)({WHATSAPP_INTERNAL_SECRET:secret,FINANCIA_BACKEND_URL:'https://financiaia.com/'},{all:()=>[{json:payload}]},require)[0].json
  assert.equal(result.url,'https://financiaia.com/api/internal/whatsapp/resolve')
  assert.deepEqual(JSON.parse(result.body),{payload})
  const headers=new Headers({'x-financia-timestamp':result.timestamp,'x-financia-nonce':result.nonce,'x-financia-signature':result.signature})
  assert.equal(verifyInternal(secret,'/api/internal/whatsapp/resolve',headers,result.body),result.nonce)
})
test('message batches execute separately and original image branch remains disconnected',()=>{
  const w=workflows[0]
  assert.equal(w.nodes.find(n=>n.name==='Procesar cada mensaje').parameters.mode,'each')
  assert.equal(w.connections['Contexto WhatsApp'].main[0][0].node,'If')
  const incoming=Object.values(w.connections).flatMap(c=>Object.values(c).flat(2)).map(e=>e.node)
  assert.ok(!incoming.includes('Get_image'));assert.ok(!incoming.includes('HTTP Request2'))
})
