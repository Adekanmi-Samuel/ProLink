const https = require('https');
const B = 'prolink-backend.vercel.app', F = 'prolink-eight.vercel.app';
let PASS=0,FAIL=0;
const ok=m=>{console.log('  ✅ '+m);PASS++};
const no=(m,d)=>{console.log('  ❌ '+m+(d?' — '+d:''));FAIL++};
const sec=t=>console.log('\n═══ '+t+' ═══');

function c(method,path,data,token,host){
  host=host||B;
  return new Promise(r=>{
    const o={hostname:host,port:443,path,method,headers:{'Content-Type':'application/json'},timeout:20000};
    if(token)o.headers['Authorization']='Bearer '+token;
    const q=https.request(o,s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{let d;try{d=JSON.parse(b)}catch{d=null}r({s:s.statusCode,d,body:b.substring(0,200)})});});
    q.on('error',e=>r({s:0,d:null,body:e.message}));
    q.on('timeout',()=>{q.destroy();r({s:0,d:null,body:'TIMEOUT'})});
    if(data)q.write(JSON.stringify(data));
    q.end();
  });
}

function chk(label,test,detail){test?ok(label):no(label,detail||'')}

(async()=>{
console.log('═══════════════════════════════════════════════');
console.log('   PROLINK FULL WEBSITE TEST');
console.log('═══════════════════════════════════════════════\n');

sec('1. HEALTH');
{let r=await c('GET','/health/liveness');chk('liveness',r.d?.status==='ok',r.body)}
{let r=await c('GET','/health/readiness');chk('readiness (DB+cache)',r.d?.checks?.database&&r.d?.checks?.cache,JSON.stringify(r.d?.checks||{}))}
{let r=await c('GET','/health/metrics');chk('metrics',!!r.d?.uptime,'')}

sec('2. AUTH');
let tok=null,uid=null;
{const em='ft_'+Date.now()+'@t.com';let r=await c('POST','/api/auth/register',{email:em,password:'TestPass123!',full_name:'FT User',user_type:'client'});tok=r.d?.token;uid=r.d?.user?.id;chk('register',!!tok,r.s+' '+r.body.substring(0,80))}
{let r=await c('POST','/api/auth/login',{email:'ft_'+Date.now()+'@t.com',password:'TestPass123!'});chk('login',!!r.d?.token,r.s+' '+r.body.substring(0,80))}
{let r=await c('GET','/api/auth/verify?token=x');chk('verify (400)',r.s===400,r.s)}
{let r=await c('POST','/api/auth/verify-otp',{token:'x'});chk('verify-otp POST (400)',r.s===400,r.s)}

sec('3. TAXONOMY');
{let r=await c('GET','/api/taxonomy/skills');let n=Array.isArray(r.d)?r.d.length:0;chk('skills ('+n+')',n>=200,n+' found (need 200+)')}
{let r=await c('GET','/api/taxonomy/categories');let n=Array.isArray(r.d)?r.d.length:0;chk('categories ('+n+')',n>=15,n+' found (need 15+)')}

sec('4. JOBS');
{let r=await c('GET','/api/jobs?limit=3');chk('public jobs list',r.d?.jobs!==undefined,r.s+' '+r.body.substring(0,80))}

sec('5. SEARCH');
{let r=await c('GET','/api/search/jobs?q=test');chk('search jobs',r.d?.jobs!==undefined,r.s+' '+r.body.substring(0,80))}
{let r=await c('GET','/api/search/providers?q=test');chk('search providers',r.d?.providers!==undefined,r.s+' '+r.body.substring(0,80))}

sec('6. AUTHENTICATED ENDPOINTS');
if(!tok){no('NO TOKEN — all auth tests skipped')}
else{
{let r=await c('GET','/api/profiles/me',null,tok);chk('GET /profiles/me',!!r.d?.full_name,r.s+' '+r.body.substring(0,80))}
{let r=await c('PUT','/api/profiles/me',{full_name:'TestUser',bio:'Bio',state:'Lagos',city:'Ikeja',gender:'male',hourlyRate:10000,ratePeriod:'weekly',availability:'full_time'},tok);chk('PUT /profiles/me',!!r.d?.msg,r.s+' '+r.body.substring(0,80))}
{let r=await c('GET','/api/profiles/me',null,tok);chk('name persisted',r.d?.full_name==='TestUser',r.d?.full_name);chk('city persisted',r.d?.city==='Ikeja',r.d?.city);chk('rate persisted',r.d?.hourly_rate==10000,String(r.d?.hourly_rate));chk('rate_period persisted',r.d?.rate_period==='weekly',r.d?.rate_period)}
{let r=await c('PATCH','/api/profiles/me',{availability:'open'},tok);chk('PATCH /profiles/me',r.s===200,r.s+' '+r.body.substring(0,80))}
{let r=await c('GET','/api/profiles/me/earnings',null,tok);chk('earnings',r.d?.gross_earned!==undefined,r.s)}
{let r=await c('GET','/api/profiles/me/earnings-chart',null,tok);chk('earnings chart',Array.isArray(r.d),r.s)}
{let r=await c('GET','/api/profiles/me/bank',null,tok);chk('bank account',r.s<500,r.s)}
{let r=await c('GET','/api/notifications?limit=3',null,tok);chk('notifications',r.s<500,r.s)}
{let r=await c('GET','/api/notifications/unread-count',null,tok);chk('unread count',r.s===200,r.s)}
{let r=await c('GET','/api/saved_jobs',null,tok);chk('saved jobs',r.s<500,r.s)}
{let r=await c('GET','/api/saved_searches',null,tok);chk('saved searches',r.s<500,r.s)}
{let r=await c('GET','/api/recommendations',null,tok);chk('recommendations',r.s<500,r.s)}
{let r=await c('GET','/api/chats',null,tok);chk('chats',r.s<500,r.s)}
{let r=await c('GET','/api/portfolio',null,tok);chk('portfolio',r.s<500,r.s)}
{let r=await c('POST','/api/verification/verify-nin',{nin_number:'12345678901'},tok);chk('NIN verification',r.s<500,r.s)}
{let r=await c('POST','/api/verification/verify-cac',{cac_number:'CAC-12345'},tok);chk('CAC verification',r.s<500,r.s)}
if(uid){
{let r=await c('GET','/api/profiles/'+uid);chk('public profile',!!r.d?.full_name,r.s);chk('  location',!!r.d?.location,r.d?.location);chk('  user_type',!!r.d?.user_type,r.d?.user_type);chk('  skills',Array.isArray(r.d?.skills),r.d?.skills?.length+' skills')}
{let r=await c('GET','/api/profiles/'+uid+'/reviews');chk('profile reviews',r.d?.reviews!==undefined,r.s)}
}
{let sk=await c('GET','/api/taxonomy/skills');if(sk.d?.length>0){let r=await c('PUT','/api/profiles/me',{skills:[sk.d[0].id]},tok);chk('save skills',r.s===200,r.s)}}
{let r=await c('PUT','/api/profiles/me/picture',{profile_picture_url:'https://example.com/test.jpg'},tok);chk('update picture',r.s<500,r.s)}
}

sec('7. PUBLIC');
{let r=await c('GET','/api/stats');chk('public stats',!!r.d,r.s)}
{let r=await c('GET','/api/reviews?limit=3');chk('public reviews',r.s<500,r.s)}

sec('8. FRONTEND PAGES');
const pages=['/','/jobs','/jobs/new','/login','/signup','/dashboard','/profile','/profile/edit','/admin','/admin/users','/admin/jobs','/admin/disputes','/terms','/privacy','/verify','/forgot-password','/sitemap.xml','/robots.txt'];
for(const p of pages){let r=await c('GET',p,null,null,F);chk(p,r.s===200||r.s===307||r.s===308,r.s)}

sec('9. CORS');
await new Promise(resolve=>{
const o={hostname:B,port:443,path:'/health/liveness',method:'OPTIONS',headers:{'Origin':'https://'+F,'Access-Control-Request-Method':'GET'},timeout:10000};
const q=https.request(o,s=>{s.headers['access-control-allow-origin']==='https://'+F?ok('CORS allows frontend'):no('CORS',s.headers['access-control-allow-origin']||'none');resolve()});
q.on('error',e=>{no('CORS',e.message);resolve()});
q.end();
});

console.log('\n═══════════════════════════════════════════════');
console.log('  RESULTS: ✅ '+PASS+' PASS | ❌ '+FAIL+' FAIL | 📊 '+(PASS+FAIL)+' TOTAL | 🎯 '+Math.round(PASS/(PASS+FAIL)*100)+'%');
console.log('═══════════════════════════════════════════════');
})();
