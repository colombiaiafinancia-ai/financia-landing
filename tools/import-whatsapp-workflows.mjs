import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'

// Only creates/updates inactive v3 copies. There is intentionally no activation operation.
const origin='https://n8n.financiaia.com', key=process.env.N8N_API_KEY
if(!key) throw new Error('Set N8N_API_KEY in the current process only')
const directory='n8n/generated', statePath='n8n/import-state.json'
const originalIds=['ME1Bja8SRYLJVsf7','mpwuLhBmIYDfd4fm','GmeQZiQXlEVQx1qN','0tNGQyAJJu8hh3as']
const originals=new Map()
async function api(route,method='GET',body){
  const response=await fetch(origin+'/api/v1'+route,{method,headers:{'X-N8N-API-KEY':key,'Content-Type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(30000)})
  if(!response.ok) { const e=await response.json().catch(()=>({}));throw new Error(`${method} ${route}: HTTP ${response.status}: ${e.message||'request failed'}`) }
  return response.json()
}
const privateDir='n8n/private';fs.mkdirSync(privateDir,{recursive:true})
for(const id of originalIds){
  const live=await api('/workflows/'+id)
  const backup=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'financia-n8n-identity-audit',id+'.json'),'utf8').replace(/^\uFEFF/,''))
  assert.deepEqual(live.nodes,backup.nodes,`Original ${id} changed since inspection; rebase copies first`)
  assert.deepEqual(live.connections,backup.connections)
  originals.set(id,live);fs.writeFileSync(path.join(privateDir,id+'.json'),JSON.stringify(live,null,2))
}
const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{}
for(const name of ['yes','no','main']){
  let payload=JSON.parse(fs.readFileSync(path.join(directory,name+'.json'),'utf8'))
  if(name==='main') payload=JSON.parse(JSON.stringify(payload).replaceAll('__YES_WORKFLOW_ID__',state.yes).replaceAll('__NO_WORKFLOW_ID__',state.no))
  if(!state[name]){
    const list=await api('/workflows?name='+encodeURIComponent(payload.name))
    const matching=list.data.filter(w=>w.name===payload.name)
    if(matching.length) throw new Error(`A copy named ${payload.name} already exists. Inspect before adopting its ID.`)
    const saved=await api('/workflows','POST',payload)
    assert.equal(saved.active,false);state[name]=saved.id
    fs.writeFileSync(statePath,JSON.stringify(state,null,2)+'\n')
  } else {
    assert.ok(!originalIds.includes(state[name]))
    const live=await api('/workflows/'+state[name]);assert.equal(live.active,false,'Never update active workflow')
    assert.equal(live.name,payload.name)
    await api('/workflows/'+state[name],'PUT',payload)
  }
  const saved=await api('/workflows/'+state[name]);assert.equal(saved.active,false)
  assert.deepEqual(saved.connections,payload.connections)
  assert.deepEqual(saved.nodes,payload.nodes)
  console.log(JSON.stringify({name:saved.name,id:saved.id,active:saved.active,nodes:saved.nodes.length}))
}
for(const [id,original] of originals){
  const live=await api('/workflows/'+id)
  assert.deepEqual(live.nodes,original.nodes);assert.deepEqual(live.connections,original.connections);assert.equal(live.active,original.active)
}
console.log('All four originals unchanged. Copies inactive. Folder placement must be verified in n8n UI.')
