// Run only against the local development server with WHATSAPP_IDENTITY_ENABLED=true.
// These rejected requests neither create accounts nor send messages.
const base=process.env.WHATSAPP_TEST_BASE_URL||'http://localhost:3005'
const url=new URL(base)
if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new Error('Local server required')
const post={method:'POST',headers:{'content-type':'application/json'},body:'{}'}
const cases=[
  ['/api/whatsapp/link/start',{...post,headers:{...post.headers,origin:'https://foreign.invalid'}},403],
  ['/api/whatsapp/link/status',{},401],
  ...['resolve','send','operation'].map(p=>['/api/internal/whatsapp/'+p,post,401]),
]
for(const [path,init,expected] of cases){
  const response=await fetch(base+path,{...init,redirect:'error'})
  if(response.status!==expected) throw new Error(`${path}: expected ${expected}, got ${response.status}`)
  console.log(`${path}: ${response.status} PASS`)
}
