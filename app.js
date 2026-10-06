'use strict';
/* ══ أدوات آمنة ══ */
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
/* دالة الربط الآمنة: لو العنصر مش موجود مبتكسرش — بتتعدّي */
function on(id,ev,fn){var el=(typeof id==='string')?document.getElementById(id):id;if(el)el.addEventListener(ev,fn)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function ar(n){return new Intl.NumberFormat(lang=='ar'?'ar-EG':'en-US').format(Math.round(n))}

/* ══ مساعدات الأمان والتخزين ══ */
var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var SS={get:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem(k,v);return true}catch(e){return false}},del:function(k){try{sessionStorage.removeItem(k)}catch(e){}}};
var REDUCED=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches);
function SB(){return REDUCED?'auto':'smooth'}
/* يسمح بس بوسوم تنسيق بسيطة بدون attributes (b,i,strong,em,br) — أي HTML تاني بيتحوّل لنص */
function san(s){return String(s==null?'':s).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/&lt;(\/?)(b|i|strong|em|br)\s*\/?&gt;/gi,'<$1$2>')}
function safeUrl(u){u=String(u||'').trim();return /^https?:\/\/[^\s<>"'`\\]+$/i.test(u)?u:''}
function safeImg(u){u=String(u||'');return /^(\/uploads\/[a-f0-9]{32}\.(webp|png|jpg)|https:\/\/[^\s"'<>`\\]+|data:image\/(webp|png|jpe?g);base64,[A-Za-z0-9+\/=]+)$/.test(u)?u:''}
function col(c,d){return /^#[0-9a-fA-F]{6}$/.test(c||'')?c:d}
function ytId(v){var m=String(v||'').match(/(?:v=|\.be\/|shorts\/|embed\/)([\w\-]{6,})/);return m?m[1]:''}
function normPhone(p){var s=String(p==null?'':p).replace(/[\s\-().]/g,'').replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)});if(/^(\+?20|0020)?0?1[0125]\d{8}$/.test(s))return '0'+s.replace(/^(\+?20|0020)?0?/,'');if(/^\+\d{8,15}$/.test(s))return s;return ''}
function cairoYMD(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo'}).format(new Date())}catch(e){return new Date().toISOString().slice(0,10)}}
/* حلقة أنيميشن ذكية: مربوطة بالزمن (نفس السرعة على 60/120/144Hz)، بتقف لما العنصر يختفي أو التاب يتخبّى،
   وبتصحى بس لما نناديها. step(dt) بيرجّع false عشان تنام. dt=1 يعادل فريم على 60Hz */
function rafLoop(el,step){
 var run=false,vis=true,last=0;
 function frame(now){
  if(!run)return;
  var dt=last?Math.min(4,(now-last)/16.667):1;last=now;
  var r=step(dt);
  if(r===false||!vis||document.hidden){run=false;last=0;return}
  requestAnimationFrame(frame)}
 function wake(){if(run||!vis||document.hidden)return;run=true;last=0;requestAnimationFrame(frame)}
 if('IntersectionObserver' in window){new IntersectionObserver(function(es){vis=es[es.length-1].isIntersecting;if(vis)wake()}).observe(el)}
 document.addEventListener('visibilitychange',function(){if(!document.hidden)wake()});
 wake();return wake}
var baRect=null;

var LK='kiro_lang',TK='kiro_theme',DK='kiro_db_v6',SK='kiro_season_x';
var lang=LS.get(LK)||'ar';
var theme=LS.get(TK)||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
try{LS.del('kiro_db');LS.del('kiro_db_v2');LS.del('kiro_db_v3');LS.del('kiro_db_v4');LS.del('kiro_db_v5')}catch(e){}

var DEF={phone:'201065222854',fb:'',ig:'',tt:'',logo:null,season:'',
 prices:{pk:[2500,4900,9500],print:{flyer:1.15,poster:60,roll:480,card:2.2,note:14,ban:210}},
 txt:{ar:{},en:{}},
 events:[
  {id:'ev_ramadan',na:'شهر رمضان',ne:'Ramadan',da:'',de:'',start:'',end:'',preset:'ramadan',prio:1,c1:'#580E1A',c2:'#C9A96E',dt:'none',dv:0,on:false},
  {id:'ev_fitr',na:'عيد الفطر',ne:'Eid Al-Fitr',da:'',de:'',start:'',end:'',preset:'eid_fitr',prio:1,c1:'#580E1A',c2:'#C9A96E',dt:'none',dv:0,on:false},
  {id:'ev_adha',na:'عيد الأضحى',ne:'Eid Al-Adha',da:'',de:'',start:'',end:'',preset:'eid_adha',prio:1,c1:'#580E1A',c2:'#C9A96E',dt:'none',dv:0,on:false}
 ],
 teachers:[
 {id:'t_ahmed_elsherif',na:'أ. أحمد الشريف',ne:'Mr. Ahmed El-Sherif',sa:'فيزياء — ثانوية',se:'Physics · Thanaweya',big:'+34K',bca:'متابع جديد خلال ترمين',bce:'new followers in 2 terms',m1:'2.1M',m1a:'مشاهدات أعلى رِيل',m1e:'top reel views',m2:'96%',m2a:'تجديد الطلاب',m2e:'student renewal',fb:'https://facebook.com',yt:''},
 {id:'t_mariam_abdelaal',na:'م/ مريم عبد العال',ne:'Ms. Mariam Abdelaal',sa:'كيمياء — ثانوية',se:'Chemistry · Thanaweya',big:'6.2%',bca:'CTR الثامبنيل بدل ٣٫١٪',bce:'CTR — from 3.1%',m1:'x2.4',m1a:'نمو الوصول',m1e:'reach growth',m2:'318',m2a:'حجز الصيف',m2e:'summer sign-ups',fb:'',yt:''},
 {id:'t_amr_elsayed',na:'مستر عمرو السيد',ne:'Mr. Amr El-Sayed',sa:'إنجليزي — Seniors',se:'English · Seniors',big:'x4',bca:'مشاهدات بعد الهوية',bce:'views after rebrand',m1:'81K',m1a:'مشترك جديد',m1e:'new subscribers',m2:'12',m2a:'ريل +1M',m2e:'reels past 1M',fb:'',yt:''},
 {id:'t_hany_raslan',na:'د. هاني رسلان',ne:'Dr. Hany Raslan',sa:'أحياء — سنترز',se:'Biology · Centers',big:'421',bca:'حجز من حملة واحدة',bce:'bookings — one campaign',m1:'18 EGP',m1a:'تكلفة الحجز',m1e:'cost per booking',m2:'6.4%',m2a:'متوسط CTR',m2e:'avg CTR',fb:'',yt:''}],works:[]};
/* ترقية/تعبئة الحقول الافتراضية — تُطبَّق على أي بيانات جايه من localStorage أو من السيرفر */
function ensureDefaults(db){
 if(!db||!db.teachers)db=JSON.parse(JSON.stringify(DEF));
 if(!db.prices)db.prices=JSON.parse(JSON.stringify(DEF.prices));
 if(!db.prices.pk)db.prices.pk=DEF.prices.pk.slice();
 if(!db.prices.print)db.prices.print={};
 Object.keys(DEF.prices.print).forEach(function(k){if(db.prices.print[k]==null)db.prices.print[k]=DEF.prices.print[k]});
 if(!db.txt)db.txt={ar:{},en:{}};
 if(!db.txt.ar)db.txt.ar={};if(!db.txt.en)db.txt.en={};
 /* تصليح: أي مدرس بدون رقم تعريف فريد (id) — زي بيانات قديمة قبل هذا
    الإصلاح — بناخده رقم دلوقتي عشان زراير التعديل والحذف تشتغل معاه. */
 if(db.teachers)db.teachers.forEach(function(t){if(!t.id)t.id=uid()});
 if(db.works)db.works.forEach(function(w){if(!w.id)w.id=uid()});
 if(db.reviews)db.reviews.forEach(function(r){if(!r.id)r.id=uid()});
 if(!db.events){
  db.events=JSON.parse(JSON.stringify(DEF.events));
  if(db.occasion){var m={ramadan:'ev_ramadan',fitr:'ev_fitr',adha:'ev_adha'}[db.occasion];
   db.events.forEach(function(e){if(e.id==m)e.on=true})}
 }
 delete db.occasion;
 if(!db.finishes)db.finishes=[
  {id:'fn_mat',na:'ورنيش مط',ne:'Matte varnish',price:80,on:true},
  {id:'fn_uv',na:'UV لامع',ne:'Glossy UV',price:120,on:true},
  {id:'fn_smat',na:'سلوفان مط',ne:'Matte cellophane',price:150,on:true},
  {id:'fn_sglo',na:'سلوفان لامع',ne:'Glossy cellophane',price:150,on:true}
 ];
 if(!db.paper)db.paper=[{id:'pp_a4',na:'A4',price:0.75,on:true},{id:'pp_a5',na:'A5',price:0.45,on:true}];
 if(!db.bind)db.bind=[{id:'bd_wire',na:'سلك',ne:'Wire',price:8,on:true},{id:'bd_staple',na:'دبوس',ne:'Staple',price:2,on:true},{id:'bd_glue',na:'لاصق',ne:'Perfect (glue)',price:12,on:true},{id:'bd_heat',na:'تجليد حراري',ne:'Thermal binding',price:15,on:true}];
 if(db.prices.banM2==null)db.prices.banM2=210;
 return db}
var DB;try{DB=JSON.parse(LS.get(DK))}catch(e){DB=null}
DB=ensureDefaults(DB);
var SRV_OK=null; /* null=لسه مامتاكدناش، true=فيه باك اند شغال، false=مفيش */
/* الحفظ: كاش محلي فورًا + دفع للسيرفر (debounce + طابور واحد + إعادة محاولة + optimistic locking _v) */
var SYNC={dirty:false,busy:false,timer:null,retry:0,warned:false};
function saveDB(){
 LS.set(DK,JSON.stringify(DB)); /* كاش محلي بس — فشله مايمنعش الحفظ على السيرفر */
 SYNC.dirty=true;clearTimeout(SYNC.timer);SYNC.timer=setTimeout(pushDB,350);return true}
function retryPush(){
 SYNC.dirty=true;SYNC.retry++;
 if(SYNC.retry<=6){
  if(!SYNC.warned){SYNC.warned=true;toastMsg(lang=='ar'?'مش قادر أحفظ على السيرفر — هعيد المحاولة تلقائيًا…':'Cannot save to server — retrying…')}
  SYNC.timer=setTimeout(pushDB,Math.min(30000,1500*Math.pow(2,SYNC.retry)))}
 else toastMsg(lang=='ar'?'فشل الحفظ على السيرفر. تأكد من الاتصال وعدّل تاني.':'Save failed. Check your connection and try again.')}
function pushDB(){
 if(SYNC.busy||!SYNC.dirty||!window.fetch)return;
 if(!isAdm()){SYNC.dirty=false;return}
 SYNC.busy=true;SYNC.dirty=false;
 fetch('/api/db',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(DB)})
 .then(function(r){return r.json().catch(function(){return {}}).then(function(j){return {s:r.status,ok:r.ok,j:j}})})
 .then(function(x){
  SYNC.busy=false;SRV_OK=x.s>0;
  if(x.ok){
   SYNC.retry=0;SYNC.warned=false;
   if(x.j.db){DB=ensureDefaults(x.j.db);LS.set(DK,JSON.stringify(DB));renderEverything()}
   else{DB._v=x.j._v;LS.set(DK,JSON.stringify(DB))}
   if(SYNC.dirty)SYNC.timer=setTimeout(pushDB,100);else toastMsg(T('saved_srv'))}
  else if(x.s==409){SYNC.dirty=false;toastMsg(lang=='ar'?'حد تاني عدّل الموقع قبلك — حمّلنا أحدث نسخة، أعد تعديلك':'Someone else edited the site — loaded the latest copy; redo your change');hydrateFromServer(true)}
  else if(x.s==401){SYNC.dirty=false;ADM=false;admUI();toastMsg(lang=='ar'?'الجلسة انتهت — سجّل دخول تاني (آخر تعديل مااتحفظش)':'Session expired — log in again (last change not saved)')}
  else if(x.s==400||x.s==413){SYNC.dirty=false;toastMsg((lang=='ar'?'السيرفر رفض البيانات: ':'Server rejected the data: ')+(x.j.field||x.j.message||x.j.error||''));hydrateFromServer(true)}
  else retryPush()})
 .catch(function(){SYNC.busy=false;SRV_OK=false;retryPush()})}
window.addEventListener('beforeunload',function(e){if(isAdm()&&(SYNC.dirty||SYNC.busy)){e.preventDefault();e.returnValue=''}});
function renderEverything(){
 try{applyStatic()}catch(e){}
 try{refreshAll()}catch(e){}
 try{rLocT();rLocP();rDev();rBk()}catch(e){}
 try{rPlat()}catch(e){}
 try{rRv();rvA()}catch(e){}
 try{applyPrices();rCt();rPrB();calcP(false);calcROI()}catch(e){}
 try{paintBrand();applyLinks()}catch(e){}
 try{applyEventTheme()}catch(e){}
 try{if(isAdm())admUI()}catch(e){}}
function hydrateFromServer(force){
 if(!window.fetch)return Promise.resolve();
 return fetch('/api/db',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(serverDB){
  SRV_OK=true;
  if((SYNC.dirty||SYNC.busy)&&!force)return; /* في تعديل لسه ماوصلش السيرفر — ماننسفوش */
  if(serverDB&&typeof serverDB=='object'&&Object.keys(serverDB).length){
   DB=ensureDefaults(serverDB);LS.set(DK,JSON.stringify(DB));renderEverything()}
 }).catch(function(){SRV_OK=false /* مفيش باك اند — نكمل بالنسخة المحلية بصمت */})}

/* ══ i18n ══ */
var D={
ar:{brand_s:'وكالة إبداعية',n_home:'الرئيسية',n_services:'خدماتنا',n_studio:'الاستديو',n_platform:'المنصة',n_works:'أعمالنا',n_print:'المطبعة',n_packs:'الباقات',n_clients:'عملاؤنا',n_contact:'تواصل',
h_kick:'استوديو متخصص في تسويق المدرسين — القاهرة',h_t1:'لما الطالب يسحب الإبهام في فيسبوك…',h_t2:'يقف عندك.',h_t3:'وده بالظبط حرفتنا في «كيرو» —<br>نخلّي اسمك هو اللي يفضل في الذهن.',
h_sub:'<b>«كيرو»</b> شريك المدرِّس: بروفايل يليق بيك، بوستات توقّف الإبهام، ثامبنيل يجيب الضغطات، ريلز بمونتاج لها طعم، وإدارة صفحتك وإعلاناتها بعقل يقيس بالحجوزات — مش باللايكات.',
h_s1:'مدرس بنخدمه',h_s2:'مشاهدة حققها شغلنا',h_s3:'سنوات جنب التعليم',
st_name:'أ. أحمد الشريف',st_subj:'فيزياء — ثانوية عامة',st_m1:'كوفر الترم جاهز',st_m2:'الصفحة منظمة',st_reel:'رِيل — سرّ خطة المذاكرة',st_thumb:'العناصر<br>في ليلة',st_c1:'بروفايل يوقف السكرول',st_c2:'ترند في وقته',
roi_t:'احسب عائدك',roi_t2:'بنفسك',roi_p:'حرّك المؤشرات وشوف الباقة بتتغطى إمتى — والباقي كله فلوس في جيبك.',roi_l1:'سعر الحصة عندك',roi_l2:'طلبة جدد شهريًا',roi_l3:'حصص للطالب شهريًا',roi_net:'صافي مكسبك شهريًا بعد الباقة',roi_c1:'دخل الطلبة الجدد',roi_c2:'تكلفة باقة «وجه المدرس»',roi_c3:'طلبة يغطوا الباقة',roi_cta:'شوف الباقات',roi_wa:'ابعت الأرقام لنفسك',stu_w:'طالب',les_w:'حصص',roi_good:'الباقة اتغطت! كل طالب بعد كده مكسب صافي.',roi_bad:'لسه متغطّيتش — حرّك المؤشرات وشوف نقطة التعادل.',
why_h:'ليه المدرسين بيسيبوا غيرنا وييجوا لنا؟',jr_h:'رحلة الطالب من بوستك… لمجموعتك',sw_h:'لمحة من الشغل',sw_more:'كل الأعمال بالتفصيل',
ba_h:'اسحب وشوف الفرق بعينك',ba_b:'قبل كيرو',ba_a:'بعد كيرو',ba_n0:'اسم المدرس',ba_t0:'صورة عشوائية',ba_n:'أ. أحمد الشريف',ba_th:'العناصر في ليلة',ba_s1:'نسبة الضغط',ba_s2:'رسائل شهريًا',ba_s3:'وصول',ba_hint:'اسحب المقبض — الفرق بيتحرك معايا لحظيًا',
cta_t1:'وشك اللي الطلبة شايفينه…',cta_t2:'يستاهل استديو يحترمه.',cta_p:'٣ مواقع تصوير تحت إيدك — اختار الأقرب وشوف الديكور قبل الحجز.',cta_b:'مواقع الاستديو والأسعار',
sv_h:'كل حاجة المدرس محتاجها يبان',sv_d:'دوس على أي خدمة — هيفتح نموذج التواصل والخدمة متختارة.',sv_bn_t:'وعايز الشغلة تكتمل على ورق؟',sv_bn_p:'بوسترات حيط، فلايرات حجز، رول أب — عندنا مطبعة بتحب التفاصيل.',
stu_h:'٣ مواقع… ديكور مختلف ونفس الاحترافية',stu_d:'اختار الفرع الأقرب ليك، شوف الديكورات، وبعدها احجز يومك ومعادك.',
dv_i_t:'تصوير آيفون محترف',dv_c_t:'كاميرا احترافية + إضاءة سينمائية',rec_badge:'الأكثر طلبًا',egp_se:'ج.م / الجلسة',book_now:'احجز الباكدج ده',
bk_h:'احجز جلستك في ٤٠ ثانية',bk_p:'اختار اليوم والمعاد وشكل التصوير — هنستلم طلبك على الواتساب مظبوط.',bk_loc:'الموقع',bk_day:'اليوم',bk_slot:'المعاد',bk_type:'شكل التصوير',bk_data:'بياناتك',bk_send:'تأكيد الحجز واتساب',
pl_h:'منصة تعليمية باسمك — من غير معاناة مبرمجين',pl_d:'محاضراتك وامتحاناتك ومتابعة طلبتك على منصة بلوجوك ودومينك — انت بس تشرح والباقي علينا.',pl_cta:'شوف خطط الاشتراك',pl_fh:'كل اللي محتاجه كورسك في مكان واحد',pl_ph:'خطط اشتراك واضحة… وحتى مدى الحياة',pl_note:'*أسعار المنصة مستقلة عن خدمات الإنتاج. تفعيل خلال ٢٤ ساعة + تدريب مجاني.',
pf_h:'أعمالنا تتكلم عنا',pr_chip:'خدمة فرعية بتكمّل الدايرة — بنعملها مظبوط',pr_h:'ركن الطباعة في كيرو',pr_d:'اسحب العلبة، وركّب طلبك والسعر يظهر أمامك لحظيًا.',drag_box:'اسحب لتدوير العلبة',
cfg_h:'ركّب طلب طباعتك',cfg_s1:'اختر المنتج',cfg_s2:'نوع التشطيب',edge_l:'حواف مذهّبة + ترقيم',cfg_s3:'الكمية',sm_prod:'المنتج',sm_fin:'التشطيب',sm_total:'التقدير التقريبي',send_wa:'إرسال الطلب على واتساب',copy_sum:'نسخ الملخص',
ban_step:'أبعاد البانر',ban_w:'العرض (سم)',ban_h:'الطول (سم)',nt_step:'بيانات الملزمة',nt_size:'مقاس الورق',nt_bind:'طريقة التقفيل',nt_pages:'عدد الأوراق',nt_copies:'عدد النسخ',fin_none:'بدون تشطيب',
pk_h:'باقات واضحة… من غير «عاوزين نشوف»',pk1_t:'البداية الصح',pk1_f:'لو لسه هتبدأ صفحتك',pk_once:'ج.م · مرة واحدة',pk2_t:'وجه المدرس',pk2_f:'إدارة شهرية كاملة — انت بس بتشرح',pk_bad:'الأكثر طلبًا',pk3_t:'نجم الترم',pk3_f:'للسنترز والمجموعات الكبيرة',pk_monthly:'ج.م / شهريًا',pk_from:'ج.م / شهريًا · يبدأ من',pk_order:'اطلب الباقة',
cl_h:'مدرسين وسنترز اختارونا',cl_s1:'مشاهدة جمعتها شغلنا',cl_s2:'مدرس وشخصية تعليمية',cl_s3:'نسبة تجديد شهري',cl_qh:'كلامهم علينا<br>غالي',cl_qp:'نسيب أهل المهنة يحكون — بعد ترم معانا.',
ct_h:'اختر خدمتك… والباقي علينا فعلًا',ct_t1:'حدّثنا عن هدفك,',ct_t2:'وسيبنا الباقي.',ct_p:'هنرد خلال ٢٤ ساعة بخطة مفصّلة وسعر واضح.',ct_call:'اتصل بينا',ct_wa:'واتساب مباشر',ct_stu:'الاستديو الرئيسي',cf_name:'اسمك *',cf_phone:'رقم التواصل *',cf_type:'الخدمة المطلوبة',cf_msg:'حدثنا عن نفسك ومادتك',cf_send:'إرسال الطلب',cf_hint:'هيفتح واتساب برسالة مكوّنة — دوسة أخيرة وتغط.',
ft_ab:'استوديو متخصص في خلق حضور المدرِّس — وبنقيس بالحجوزات.',ft_links:'اختصار الطريق',ft_touch:'كلمونا',ft_phone:'تليفون / واتساب',ft_hours:'أوقات الاستديو',ft_cr:'© {Y} Kiro Studio — جميع الحقوق محفوظة',ft_made:'صُمِّم ◆ وفُكِّر بشغفٍ في القاهرة',
ad_gate_t:'لوحة تحكم كيرو',ad_gate_p:'للإدارة بس — اكتب كلمة المرور.',ad_enter:'دخول',ad_pw:'كلمة المرور مش صح.',ad_hi:'أهلاً يا مانجر 👋',ad_out:'خروج',ad_t1:'الهوية والإعدادات',ad_t2:'المدرسون',ad_t3:'الأعمال',ad_t4:'المناسبات والخصومات',ad_t5:'الأسعار',ad_t6:'نصوص الموقع',
ad_ev_t:'مدير المناسبات',ad_ev_s:'أي مناسبة مفعّلة وتاريخ النهارده جوّه مدتها بتتحول ليها هوية الموقع كله (بانر + ديكور + أيقونة + خصم تلقائي). لو فيه أكتر من مناسبة سارية في نفس الوقت، اللي أولويتها أعلى هي اللي بتشتغل.',
ad_ev_na:'اسم المناسبة (عربي) *',ad_ev_ne:'Event name (English)',ad_ev_da:'وصف/رسالة البانر (عربي)',ad_ev_de:'Banner message (English)',ad_ev_s1:'تاريخ البداية',ad_ev_e1:'تاريخ النهاية',
ad_ev_pr:'هوية الديكور',ad_ev_pnone:'بدون زخارف — ألوان فقط',ad_ev_pram:'رمضان (هلال وفوانيس)',ad_ev_pfitr:'عيد الفطر (بالونات واحتفال)',ad_ev_padha:'عيد الأضحى (خروف مبهج)',ad_ev_pcust:'تألق عام (لأي مناسبة أخرى)',
ad_ev_pri:'الأولوية (رقم أعلى = يطغى)',ad_ev_c1:'اللون الأساسي',ad_ev_c2:'اللون الثانوي',ad_ev_dt:'نوع الخصم',ad_ev_dnone:'بدون خصم',ad_ev_dpct:'نسبة %',ad_ev_dfix:'مبلغ ثابت',ad_ev_dv:'قيمة الخصم',ad_ev_on:'مفعّلة',
ad_pr_t:'أسعار الباقات',ad_pr_s:'هتتحدث على صفحة الباقات وحسبة العائد فورًا.',ad_pr_pk1:'باقة البداية الصح (ج.م — مرة واحدة)',ad_pr_pk2:'باقة وجه المدرس (ج.م — شهريًا)',ad_pr_pk3:'باقة نجم الترم (ج.م — يبدأ من)',ad_pr_pt:'أسعار المطبعة (للوحدة)',ad_pr_ban:'سعر المتر المربع للبانر (ج.م)',
ad_fn_t:'تشطيبات الكروت',ad_fn_s:'بتظهر بس لما العميل يختار منتج «الكارت».',ad_fn_pr:'السعر الإضافي للوحدة (ج.م)',
ad_pp_t:'مقاسات ورق الملازم',ad_pp_pr:'سعر الورقة الواحدة (ج.م)',
ad_bd_t:'طرق تقفيل الملازم',ad_bd_pr:'السعر للنسخة (ج.م)',
ad_ct_t:'نصوص الصفحة الرئيسية',ad_ct_s:'اكتب بالعربي والإنجليزي — سيبها فاضية عشان يفضل النص الافتراضي.',ad_ct_ft:'نصوص الفوتر والتواصل',
ad_logo_t:'لوجو كيرو',ad_logo_s:'هيتبدل في الهيدر والفوتر فورًا.',up_logo:'رفع اللوجو',rm_logo:'إزالة',ad_set_t:'بيانات التواصل',ad_phone:'واتساب (دولي بدون +)',ad_save:'حفظ',export:'تصدير',import:'استيراد',
ad_te_t:'بطاقات نتائج المدرسين',ad_te_s:'بتظهر في الرئيسية.',ad_add:'إضافة / حفظ',cancel:'إلغاء التعديل',del:'حذف',cfm:'متأكد من الحذف؟',
ad_wo_t:'أعمال البورتفوليو',ad_wo_s:'صورة أو رابط يوتيوب — يظهر فورًا.',ad_addw:'إضافة العمل',clear:'تفريغ',
ad_se_t:'البانر الموسمي',ad_se_s:'افتراضيًا بيتغير لوحده حسب الشهر. نص مخصص بيعرض على كل الموقع.',ad_se_l:'نص مخصص (فاضي = تلقائي)',ad_se_auto:'رجوع للتلقائي',seas_saved:'البانر اتحدّث ✦',seas_auto:'رجعنا للتلقائي ✦',
saved:'تم ✦',saved_srv:'اتحفظ على السيرفر وظاهر للزوار ✔',svc_pick:'جهزنا «$» — كمّل بياناتك.',bk_ok:'الحجز جاهز!',copied:'تم النسخ ✂',sent:'جهزنا رسالتك على واتساب ✦',pick_day:'اختار اليوم والمعاد الأول.',bad_ph:'الرقم مش صحيح — مثال: 01065222854',consult:'استشارة عامة — مش متأكد لسه',sub_now:'اشترك دلوقتي',
pk_msg:'طلب باقة من موقع Kiro',plat_msg:'اشتراك منصة كيرو',plan_l:'الخطة',price_l:'السعر',req_msg:'طلب جديد من موقع Kiro',name_l:'الاسم',phone_l:'رقم',svc_l:'الخدمة',det_l:'(هيكتمل في المكالمة)',ord_msg:'طلب طباعة — Kiro Press',prod_l:'المنتج',fin_l:'التشطيب',qty_l:'الكمية',est_l:'التقدير',bk_msg:'حجز جلسة تصوير — Kiro',day_l:'اليوم',time_l:'الساعة',type_l:'النوع',loc_l:'الموقع',egp:'ج.م',from_portfolio:'من أعمالنا',
budgets:['أقل من ٣ آلاف','٣ – ٦ آلاف','٦ – ١٢ ألف','غير محددة'],
roi_msg:'*حسبة عائد — Kiro*\n• سعر الحصة: {p} ج.م\n• طلبة جدد: {s}\n• دخل شهري: {i} ج.م\n• الباقة: {k} ج.م\n• الصافي: {n} ج.م',
seas:[null,null,null,null,null,null,null,null,'موسم انطلاق الترم الأول — <b>احجز حملتك قبل اكتمال المجموعات</b>','شهر الترم — <b>المحتوى المستمر بيبني الثقة</b>',null,null,'معسكر المراجعات النهائية — <b>صمم ملازمك وجهّز ثامبنيلز ليالي الامتحان</b>','شهر الامتحانات — <b>الطالب بيدور على اللي يطمنه، كن هو</b>','موسم النتايج — <b>احتفل بنجاح طلبتك ووصّل للموسم الجديد</b>','موسم النتايج — <b>احتفل بنجاح طلبتك</b>','صيف الكورسات المكثفة — <b>أقوى موسم للحملات، استعد بدري</b>','صيف الكورسات — <b>أقوى موسم للحملات</b>','موسم انطلاق الترم الأول — <b>احجز حملتك قبل اكتمال المجموعات</b>','شهر الترم — <b>المحتوى المستمر بيبني الثقة</b>','شهر الترم — <b>المحتوى المستمر بيبني الثقة</b>','شهر الترم — <b>المحتوى المستمر بيبني الثقة</b>','شهر الترم — <b>المحتوى المستمر بيبني الثقة</b>','شهر الترم — <b>المحتوى المستمر بيبني الثقة</b>','معسكر المراجعات النهائية — <b>صمم ملازمك وجهّز ثامبنيلز ليالي الامتحان</b>']},
en:{brand_s:'Creative Agency',n_home:'Home',n_services:'Services',n_studio:'Studio',n_platform:'Platform',n_works:'Work',n_print:'Press Room',n_packs:'Packages',n_clients:'Clients',n_contact:'Contact',
h_kick:'A Cairo studio dedicated to teacher branding',h_t1:'When students flick through Facebook…',h_t2:'you are the one they stop for.',h_t3:'That is our craft at Kiro —<br>making sure your name sticks.',
h_sub:'<b>Kiro</b> is a teacher\u2019s media partner: a portrait worthy of you, posts that stop the thumb, thumbnails built for clicks, and page management measured in enrollments — not likes.',
h_s1:'teachers served',h_s2:'views generated',h_s3:'years beside educators',
st_name:'Mr. Ahmed El-Sherif',st_subj:'Physics · Thanaweya Amma',st_m1:'Term cover ready',st_m2:'Feed organized',st_reel:'Reel — study-plan secrets',st_thumb:'Organic<br>in One Night',st_c1:'A profile that stops the scroll',st_c2:'Trends caught on time',
roi_t:'Calculate your',roi_t2:'return',roi_p:'Drag the sliders and watch when the package pays for itself — everything after is yours.',roi_l1:'Your session price',roi_l2:'New students / month',roi_l3:'Sessions per student',roi_net:'Your net monthly profit',roi_c1:'Revenue from new students',roi_c2:'\u201cThe Teacher\u2019s Face\u201d cost',roi_c3:'Students to cover it',roi_cta:'View packages',roi_wa:'Send these numbers to yourself',stu_w:'students',les_w:'sessions',roi_good:'Package covered! Every student beyond is pure profit.',roi_bad:'Not covered yet — move the sliders to find break-even.',
why_h:'Why do teachers leave everyone else for us?',jr_h:'The student journey — from your post to your class',sw_h:'Selected Work',sw_more:'Full portfolio in detail',
ba_h:'Drag and see the difference yourself',ba_b:'BEFORE KIRO',ba_a:'AFTER KIRO',ba_n0:'Teacher name',ba_t0:'Random image',ba_n:'Mr. Ahmed El-Sherif',ba_th:'Organic in One Night',ba_s1:'click rate',ba_s2:'messages / mo',ba_s3:'reach',ba_hint:'Drag the handle — the difference moves live',
cta_t1:'The face students actually see…',cta_t2:'deserves a studio worth respecting.',cta_p:'Three shooting locations ready — browse before you book.',cta_b:'Locations & Pricing',
sv_h:'Everything a teacher needs to stand out',sv_d:'Tap any service — the form opens with it pre-selected.',sv_bn_t:'Want the story finished on paper too?',sv_bn_p:'Wall posters, flyers, roll-ups — our press room loves detail.',
stu_h:'Three locations, different décor, same professionalism',stu_d:'Pick your nearest branch, browse its décors, then lock your slot.',
dv_i_t:'Professional iPhone Shoot',dv_c_t:'Pro Camera + Cinematic Lighting',rec_badge:'Most requested',egp_se:'EGP / session',book_now:'Book this package',
bk_h:'Book your session in 40 seconds',bk_p:'Pick a day, time and setup — your request lands on our WhatsApp.',bk_loc:'Location',bk_day:'Day',bk_slot:'Time',bk_type:'Setup',bk_data:'Your details',bk_send:'Confirm via WhatsApp',
pl_h:'A learning platform in your name — zero developer drama',pl_d:'Your lectures, quizzes and analytics on a branded platform — you just teach.',pl_cta:'View Subscription Plans',pl_fh:'Everything your course needs in one place',pl_ph:'Clear plans… including forever',pl_note:'*Platform fees are separate from production. Activation within 24h + free onboarding.',
pf_h:'Our work does the talking',pr_chip:'A supporting service that completes the loop — done properly',pr_h:'Kiro Press Corner',pr_d:'Drag the box, build your quote live, then send it to WhatsApp.',drag_box:'Drag to spin the box',
cfg_h:'Build your print order',cfg_s1:'Choose a product',cfg_s2:'Choose the finish',edge_l:'Gilded edges + numbering',cfg_s3:'Quantity',sm_prod:'Product',sm_fin:'Finish',sm_total:'Estimated total',send_wa:'Send order via WhatsApp',copy_sum:'Copy summary',
ban_step:'Banner size',ban_w:'Width (cm)',ban_h:'Height (cm)',nt_step:'Booklet details',nt_size:'Paper size',nt_bind:'Binding method',nt_pages:'Sheet count',nt_copies:'Number of copies',fin_none:'No finish',
pk_h:'Clear packages — no guesswork',pk1_t:'Solid Start',pk1_f:'Just launching',pk_once:'EGP · one-time',pk2_t:'The Teacher\u2019s Face',pk2_f:'Full monthly management — you just teach',pk_bad:'Most requested',pk3_t:'Star of the Term',pk3_f:'For centers and large groups',pk_monthly:'EGP / month',pk_from:'EGP / month · from',pk_order:'Request package',
cl_h:'Teachers and centers who chose us',cl_s1:'views generated',cl_s2:'educators served',cl_s3:'monthly renewal',cl_qh:'Their words<br>matter most',cl_qp:'We let professionals speak — after one term together.',
ct_h:'Tell us what you need… we take it from there',ct_t1:'Tell us your goal,',ct_t2:'and take it from there.',ct_p:'Within 24 hours you get a plan and clear pricing.',ct_call:'Call us',ct_wa:'Direct WhatsApp',ct_stu:'Main studio',cf_name:'Your name *',cf_phone:'Contact number *',cf_type:'Service needed',cf_msg:'About you and your subject',cf_send:'Send request',cf_hint:'WhatsApp opens pre-filled — one tap and done.',
ft_ab:'A studio specialized in a teacher\u2019s presence — measured in enrollments.',ft_links:'Shortcuts',ft_touch:'Reach us',ft_phone:'Phone / WhatsApp',ft_hours:'Studio hours',ft_cr:'© {Y} Kiro Studio — All rights reserved',ft_made:'Designed ◆ with passion in Cairo',
ad_gate_t:'Kiro Admin Panel',ad_gate_p:'Staff only — enter the password.',ad_enter:'Enter',ad_pw:'Wrong password.',ad_hi:'Welcome back 👋',ad_out:'Sign out',ad_t1:'Branding & Settings',ad_t2:'Teachers',ad_t3:'Portfolio',ad_t4:'Events & Discounts',ad_t5:'Pricing',ad_t6:'Site Text',
ad_ev_t:'Events Manager',ad_ev_s:'Any enabled event whose date range covers today takes over the whole site — banner, decor, icon and an automatic discount. If several are live at once, the highest priority wins.',
ad_ev_na:'Event name (Arabic) *',ad_ev_ne:'Event name (English)',ad_ev_da:'Banner message (Arabic)',ad_ev_de:'Banner message (English)',ad_ev_s1:'Start date',ad_ev_e1:'End date',
ad_ev_pr:'Decoration style',ad_ev_pnone:'No decorations — colors only',ad_ev_pram:'Ramadan (crescent & lanterns)',ad_ev_pfitr:'Eid Al-Fitr (balloons & confetti)',ad_ev_padha:'Eid Al-Adha (festive sheep)',ad_ev_pcust:'General sparkle (any other event)',
ad_ev_pri:'Priority (higher wins)',ad_ev_c1:'Primary color',ad_ev_c2:'Secondary color',ad_ev_dt:'Discount type',ad_ev_dnone:'No discount',ad_ev_dpct:'Percentage %',ad_ev_dfix:'Fixed amount',ad_ev_dv:'Discount value',ad_ev_on:'Enabled',
ad_pr_t:'Package pricing',ad_pr_s:'Updates the packages page and ROI calculator instantly.',ad_pr_pk1:'Solid Start (EGP — one-time)',ad_pr_pk2:'The Teacher\u2019s Face (EGP — monthly)',ad_pr_pk3:'Star of the Term (EGP — from)',ad_pr_pt:'Print prices (per unit)',ad_pr_ban:'Banner price per m² (EGP)',
ad_fn_t:'Card finishes',ad_fn_s:'Only shown when the customer picks the Card product.',ad_fn_pr:'Extra price per unit (EGP)',
ad_pp_t:'Booklet paper sizes',ad_pp_pr:'Price per sheet (EGP)',
ad_bd_t:'Booklet binding methods',ad_bd_pr:'Price per copy (EGP)',
ad_ct_t:'Homepage text',ad_ct_s:'Fill Arabic and English — leave blank to keep the default text.',ad_ct_ft:'Footer & contact text',
ad_logo_t:'Kiro Logo',ad_logo_s:'Replaces header & footer mark instantly.',up_logo:'Upload logo',rm_logo:'Remove',ad_set_t:'Contact details',ad_phone:'WhatsApp (international, no +)',ad_save:'Save',export:'Export',import:'Import',
ad_te_t:'Teacher result cards',ad_te_s:'Shown on the homepage.',ad_add:'Add / Save',cancel:'Cancel editing',del:'Delete',cfm:'Delete this item?',
ad_wo_t:'Portfolio items',ad_wo_s:'An image or a YouTube link — appears instantly.',ad_addw:'Add item',clear:'Reset',
ad_se_t:'Seasonal Banner',ad_se_s:'Auto-changes by month. Custom text overrides it site-wide.',ad_se_l:'Custom text (empty = auto)',ad_se_auto:'Back to auto',seas_saved:'Banner updated ✦',seas_auto:'Back to automatic ✦',
saved:'Done ✦',saved_srv:'Saved on the server — live for visitors ✔',svc_pick:'Prepared \u201c$\u201d — finish your details.',bk_ok:'Booking ready!',copied:'Copied ✂',sent:'Your WhatsApp message is ready ✦',pick_day:'Pick a day and time first.',bad_ph:'Invalid number — e.g. 01065222854',consult:'General consult — not sure yet',sub_now:'Subscribe now',
pk_msg:'Package request — Kiro',plat_msg:'Kiro Platform subscription',plan_l:'Plan',price_l:'Price',req_msg:'New request via Kiro site',name_l:'Name',phone_l:'Phone',svc_l:'Service',det_l:'(Details on the call)',ord_msg:'Print order — Kiro Press',prod_l:'Product',fin_l:'Finish',qty_l:'Quantity',est_l:'Estimate',bk_msg:'Studio booking — Kiro',day_l:'Day',time_l:'Time',type_l:'Setup',loc_l:'Location',egp:'EGP',from_portfolio:'From the portfolio',
budgets:['Under 3K','3K – 6K','6K – 12K','Flexible'],
roi_msg:'*ROI estimate — Kiro*\n• Session price: {p} EGP\n• New students: {s}\n• Monthly revenue: {i} EGP\n• Package: {k} EGP\n• Net: {n} EGP',
seas:[null,null,null,null,null,null,null,null,'<b>Term-1 launch season</b> — book your campaign before groups fill up','Active term — <b>consistent content builds trust</b>',null,null,'<b>Final-revision bootcamp</b> — design your booklets & exam-night thumbnails','Exams month — <b>students look for reassurance; be it</b>','Results season — <b>celebrate your students and roll into the new term</b>','Results season — <b>celebrate your students</b>','Summer intensive season — <b>the strongest campaign season; prepare early</b>','Summer intensive season — <b>the strongest campaign season</b>','<b>Term-1 launch season</b> — book your campaign before groups fill up','Active term — <b>consistent content builds trust</b>','Active term — <b>consistent content builds trust</b>','Active term — <b>consistent content builds trust</b>','Active term — <b>consistent content builds trust</b>','Active term — <b>consistent content builds trust</b>','<b>Final-revision bootcamp</b> — design your booklets & exam-night thumbnails']}};
function T(k){var o=DB.txt&&DB.txt[lang]&&DB.txt[lang][k];var v=(o!=null&&o!=='')?o:(D[lang][k]!=null?D[lang][k]:k);return typeof v==='string'&&v.indexOf('{Y}')>-1?v.replace(/\{Y\}/g,new Date().getFullYear()):v}
function bi(p){return p[lang=='ar'?0:1]}
function openWa(m,w){
 var u='https://wa.me/'+DB.phone+'?text='+encodeURIComponent(m);
 try{if(navigator.clipboard)navigator.clipboard.writeText(m).catch(function(){})}catch(e){}
 try{if(w&&!w.closed){w.location.href=u;return}}catch(e){}
 var o=null;try{o=window.open(u,'_blank');if(o)o.opener=null}catch(e){}
 if(!o){location.href=u;return} /* popup اتحجب (موبايل/in-app browser) → نفتح في نفس التاب */
 setTimeout(function(){if(!document.hasFocus())return;toastMsg(lang=='ar'?'تم نسخ التفاصيل — لو واتساب مافتحش، الصقها مباشرة 📋':'Copied — if WhatsApp didn\u2019t open, paste it 📋')},1800)}
/* تسجيل الطلب على السيرفر (مش بيمنع واتساب لو السيرفر وقع) */
function lead(type,o){
 try{return fetch('/api/leads',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({type:type,lang:lang},o||{}))})
  .then(function(r){return r.json().catch(function(){return {}}).then(function(j){return {ok:r.ok,status:r.status,data:j}})})
  .catch(function(){return {ok:false,status:0}})}catch(e){return Promise.resolve({ok:false,status:0})}}
function wa(m,lt,lo){
 try{if(window.trackEvent)trackEvent('whatsapp_click',{lang:lang})}catch(e){}
 if(lt)lead(lt,Object.assign({message:m},lo||{}));
 openWa(m)}

/* ══ content data ══ */
var WHY=[
 ['نبني شخصية «مدرس» تشبهك','A persona that feels like you','مش قالب جاهز بنركّب عليه اسمك — بنسمع شرحك وطريقتك وبعدها نصمّم حول شخصيتك أنت.','No template with your name on it. We design around you.'],
 ['نتيجة مرئية في أول ٣٠ يوم','Visible movement in 30 days','من أول أسبوع بنبدّل الغلاف والبروفايل والقالب — الفرق يبان قبل أول فاتورة إعلانات.','New cover, portrait and templates land in week one.'],
 ['التزام مواعيد كأنه عقود','Deadlines treated as contracts','الثامنبيل الصبح، الريل بعد المحاضرة، والتقرير آخر الشهر — على الموعد حتى في نار الامتحانات.','Thumbnail by morning, reel after the lecture — on time.'],
 ['نقيس اللي يفرق: الحجوزات','We measure what matters: bookings','اللايكات حلوة، بس تقريرك الشهري بيفتتح بأرقام مسجّلة فعلًا في مجموعاتك.','Your monthly report opens with confirmed seats booked.']];
var JR=[
 ['fa-regular fa-eye','يبان قدامه','You appear','بروفايل وكوفر وقالب متناسق يقول «مدرس محترم» قبل أول كلمة.','Profile, cover and templates whisper professional.'],
 ['fa-solid fa-hand-pointer','يوقّف عنده','They stop','ريل فيه معلومة مفيدة أو ثامبنيل بعرض واضح — الإبهام يستسلم.','A reel with one crisp insight halts the thumb.'],
 ['fa-regular fa-comment-dots','يكتب رسالة','They message','كلمة واحدة في الإنبوكس — وبنحوّلها لحجز مؤكد.','One message becomes a confirmed seat.'],
 ['fa-solid fa-user-check','ينضم لمجموعتك','They join','وساعتها الكورس بيتحسب بالحجوزات الحقيقية مش بالمشاهدات.','The course grows on real enrollments.']];
var SVC=[
 ['fa-solid fa-fingerprint','هويتك كمدرس وصورتك الشخصية','Teacher identity & portrait','مونوجرام باسمك ولقبك، ألوان معمولة لمادتك، وصورة بروفايل تصمد في أي مقاس.','A monogram, subject-coded palette, portrait surviving every crop.',[['لوجو','Mark'],['بروفايل','Portrait'],['ألوان','Palette']]],
 ['fa-regular fa-images','بوستات وكوفرات سوشيال','Feed posts & covers','قالب شهري يتعرّف عليه قبل ما يقرأ اسمك — وكوفرات المناسبات.','A monthly template recognized before your name is read.',[['قالب شهري','Monthly kit'],['مناسبات','Occasions']]],
 ['fa-brands fa-youtube','ثامبنيل يوتيوب','YouTube thumbnails','وشك واضح + ٣ كلمات + تباين ريّح العين — والضغطات هي اللي تحكم.','Readable face, three words, kind contrast.',[['A/B','A/B tested'],['تباين','Contrast']]],
 ['fa-solid fa-video','تصوير واستديو','Studio shoots','يوم واحد في الاستديو بيلوّن ترم كامل: خلفية بلون هويتك وإضاءة مضبوطة.','One studio day paints a whole term.',[['إضاءة سينمائية','Cine lighting'],['خلفية الهوية','Brand backdrop']]],
 ['fa-solid fa-scissors','مونتاج ريلز','Reels editing','بنقطّ أقوى ٢٠ ثانية من محاضرتك، عنوان تشويقي أول ثانية، وساوند متزامن.','Your sharpest 20 seconds, hook-first.',[['Hook','1-sec hook'],['ساوند','Synced audio']]],
 ['fa-solid fa-layer-group','مونتاج المحاضرات الطويلة','Long-form lecture editing','٩٠ دقيقة بتخرج منظمة: فصول بعناوين، صوت منقى، ورفع مرقّم.','Chapters, clean audio, numbered uploads.',[['فصول','Chapters'],['صوت منقى','Clean audio']]],
 ['fa-solid fa-bullhorn','إدارة الصفحات + الإعلانات الممولة','Page management & ads','جدولة وردود وحملات تستهدف منطقتك وصفوفك — وآخر الشهر بأرقام حجوزات.','Targeted campaigns; months close on enrollments.',[['استهداف','Targeting'],['تقرير شهري','Monthly report']]],
 ['fa-solid fa-fire-flame-curved','مواكبة الترند','Trend adaptation','بنراقب يوميًا الصوت الرايج — ونرشّحلك المناسب قبل يموت.','We pitch trends before they expire.',[['صوتيات','Sounds'],['مناسبات','Dates']]]];
var PF2=[
 ['fa-solid fa-video',['محاضرات برفع غير محدود','Unlimited lectures'],[['HD 1080p','HD 1080p'],['فصول','Chapters']]],
 ['fa-solid fa-file-circle-question',['بنك أسئلة وامتحانات','Quizzes & exams'],[['تصحيح فوري','Instant grading'],['تحليل','Analytics']]],
 ['fa-solid fa-chart-simple',['متابعة لكل طالب','Per-student progress'],[['نقاط الضعف','Weak points'],['شهادات','Badges']]],
 ['fa-regular fa-bell',['إشعارات مجدولة','Scheduled notifications'],[['قبل المحاضرة','Pre-lecture'],['نتايج','Results']]]];
var PLANS=[
 {k:'mo',nm:['شهري','Monthly'],pr:1499,f:['جرّب مريح','Try it comfortably'],save:'',fs:[['كورسات غير محدودة + ٢٥٠ طالب','Unlimited courses + 250 students'],['دعم واتساب','WhatsApp support']],hot:0},
 {k:'q3',nm:['٣ شهور','Quarterly'],pr:3999,f:['ملائم لترم كامل','Perfect for one term'],save:['وفّر ١١٪','SAVE 11%'],fs:[['كل مزايا الشهري','Everything in Monthly'],['حتى ٨٠٠ طالب','Up to 800 students']],hot:0},
 {k:'yr',nm:['سنوي','Yearly'],pr:12999,f:['سنة كاملة رايق','A full year, easy'],save:['وفّر ٢٨٪','SAVE 28%'],fs:[['كل المزايا','Everything'],['طلاب بلا حدود','Unlimited students'],['دومين باسمك','Named subdomain'],['أولوية دعم','Priority support']],hot:1},
 {k:'life',nm:['مدى الحياة','Lifetime'],pr:34999,f:['دفعة واحدة… بتاعك للأبد','One payment — yours forever'],save:['للأبد','FOREVER'],fs:[['مفيش تجديد أبداً','Never renew'],['تحديثات مجانية','Free updates'],['تهيئة VIP','VIP onboarding']],hot:0}];
var STU=[
 {id:'nasr',ic:'fa-city',na:['مدينة نصر — الرئيسي','Nasr City — Main'],area:['٦٠م² · سقف ٣٫٤م','60 sqm'],ad:['٢٢ ش عباس العقاد','22 Abbas El-Akkad St.'],hr:['يوميًا ١٠ص — ٩م','Daily 10AM–9PM'],sd:'kiro-nasr',cl:[['ريل مراجعة','Revision reel','0:24'],['افتتاحية مادة','Subject intro','1:02'],['لقطة قريبة','Close-up','0:18']]},
 {id:'maadi',ic:'fa-sun',na:['المعادي — نور طبيعي','Maadi — Daylight'],area:['٤٥م² · نوافذ واسعة','45 sqm'],ad:['٩ ش المساحة — المعادي','9 El-Masalla St.'],hr:['يوميًا ٩ص — ٥م','Daily 9AM–5PM'],sd:'kiro-maadi',cl:[['إنترودكشن شخصي','Personal intro','0:31'],['كلام للكاميرا','Talking head','0:47']]},
 {id:'tag',ic:'fa-chalkboard-user',na:['التجمع — سبورة تفاعلية','New Cairo — Interactive Board'],area:['٥٠م² · سبورة ٨٥ إنش','50 sqm · 85" board'],ad:['التجمع الخامس','Fifth Settlement'],hr:['يوميًا ١٠ص — ١٠م','Daily 10AM–10PM'],sd:'kiro-tag',cl:[['شرح بالرسم','Drawn explainer','0:56'],['فوق البورد','Over-board','0:22']]}];
var IPHF=[['جلسة حتى ٤٥ دقيقة','Up to 45-min session'],['١٥ صورة معدّلة','15 retouched portraits'],['٣ مقاطع 4K','3 raw 4K clips'],['تسليم ٤٨ ساعة','48h delivery']];
var CMF=[['جلسة ساعتين','Two-hour session'],['٣٠ صورة ريَتش','30 retouched photos'],['٦ مقاطع تدرّج ألوان','6 graded clips'],['مايك لافيليه','Lavalier mic'],['تسليم ٤ أيام','4-day delivery']];
var PKD={pk1:[['لوجو باسمك + ٣ ألوان','Monogram + identity'],['جلسة تصوير بروفايل','Profile photo session'],['كوفر + ٥ بوستات','Cover + 5 posts'],['٣ ثامبنيل','3 thumbnails']],
pk2:[['إدارة كاملة FB + IG','Full FB + IG management'],['١٢ بوست + ٦ ريلز شهريًا','12 posts + 6 reels / mo'],['ثامبنيل لكل محاضرة','Thumbnail per lecture'],['حملة ممولة موجّهة','Guided paid campaign'],['رد على الطلاب والأولياء','Replies handled'],['تقرير شهري بالحجوزات','Monthly bookings report']],
pk3:[['كل مزايا «وجه المدرس»','Everything in Teacher\u2019s Face'],['يوم تصوير كل شهر','Monthly studio day'],['مونتاج ٤ محاضرات','4 long-form edits'],['١٠ ريلز شهريًا','10 reels / mo'],['خصم ٢٠٪ طباعة','20% off print'],['أولوية تنفيذ','Priority queue']]};
var RVS=[
 {na:'أ. أحمد الشريف',ne:'Mr. Ahmed El-Sherif',ra:'فيزياء — ثانوية',re:'Physics · Thanaweya',ba:'قبل كيرو كانت صفحتي بوستات مبعثرة. دلوقتي أي حد يفتح البروفايل يفهم في ثانية إن فيه مدرس بشتغل صح.',be:'Before Kiro my page was scattered. Now anyone knows within a second a serious teacher stands behind it.'},
 {na:'م/ مريم عبد العال',ne:'Ms. Mariam Abdelaal',ra:'كيمياء — ثانوية',re:'Chemistry · Thanaweya',ba:'محدش بيصدق إني مش اللي بيدير صفحتي. ردود الأهالي في وقتها والثامبنيل تقدر تحسب عليها.',be:'Nobody believes I\u2019m not running my own page. Replies on time, thumbnails you can rely on.'},
 {na:'مستر عمرو السيد',ne:'Mr. Amr El-Sayed',ra:'إنجليزي — Seniors',re:'English · Seniors',ba:'محاضرة ساعة ونص بقت فصول بعناوين واضحة — الطلبة بيكمّلوا الفيديو فعلًا.',be:'A ninety-minute lecture became titled chapters — students finish.'},
 {na:'أ. سلمى فؤاد',ne:'Ms. Salma Fouad',ra:'عربي — مدارس دولية',re:'Arabic · Int\u2019l Schools',ba:'أول وكالة تسمع «أسبوع امتحانات» وتفهم عمليًا يعني إيه.',be:'The first agency that hears \u201cexam week\u201d and knows what it means.'}];
var CATS=[['all','الكل','All'],['social','كوفرات وبوستات','Covers & Posts'],['thumb','ثامبنيل','Thumbnails'],['media','ريلز وتصوير','Reels & Shoots'],['ads','حملات','Campaigns'],['print','مطبوعات','Print']];
function plate(k){
 if(!k)return phPlate(lang=='ar'?'الصورة قريبًا':'Photo soon');
 if(k=='cov1')return '<div class="plate" style="background:var(--mr)"><div style="position:absolute;inset:9%;border:1px solid rgba(201,169,110,.5);display:flex;align-items:center;gap:6%;padding-inline:6%"><span style="width:14%;aspect-ratio:1;border-radius:50%;background:var(--gs);color:var(--mk);display:grid;place-items:center;font-family:var(--fh);font-weight:700">م</span><div><div style="font-family:var(--fh);font-weight:700;font-size:clamp(14px,2.2cqw,24px);color:#F9F6F0">م/ مريم عبد العال</div><span style="font-size:clamp(8px,1.1cqw,11px);letter-spacing:.16em;color:var(--gs)">CHEMISTRY · TERM 2</span></div></div></div>';
 if(k=='th1')return '<div class="plate" style="background:#17090D;display:flex;flex-direction:column;justify-content:space-between;padding:8%"><span style="font-size:clamp(8px,1.1cqw,11px);letter-spacing:.2em;color:var(--gs)">ORGANIC CHEMISTRY</span><div style="font-family:var(--fh);font-weight:700;font-size:clamp(20px,3.8cqw,40px);color:#F9F6F0;text-shadow:2px 2px 0 rgba(201,169,110,.4)">العضوية<br>في ليلة</div><div style="display:flex;justify-content:space-between;font-size:clamp(8px,1.1cqw,11px);color:rgba(249,246,240,.6)"><span>م/ مريم</span><span style="background:#CC0000;color:#fff;padding:2px 8px;border-radius:4px;font-weight:700">3:45</span></div></div>';
 if(k=='da1')return '<div class="plate" style="background:#FBF8F2;padding:6%"><div style="width:88%;margin:auto;background:var(--sf);border:1px solid var(--ln);border-radius:10px;padding:7%;text-align:center"><div style="font-size:clamp(9px,1.3cqw,12px);color:var(--gd)">'+(lang=='ar'?'حملة الترم الثاني':'TERM-2 CAMPAIGN')+'</div><div style="font-family:var(--fl);font-weight:600;font-size:clamp(28px,5cqw,52px);color:var(--mr);direction:ltr">421</div><div style="font-size:clamp(9px,1.3cqw,12px);color:var(--so)">'+(lang=='ar'?'حجز مؤكد من إعلان ممول':'confirmed bookings')+'</div><div style="display:flex;align-items:flex-end;gap:4px;height:46px;justify-content:center;direction:ltr"><i style="width:9%;background:rgba(88,14,26,.25);height:25%;border-radius:3px 3px 0 0"></i><i style="width:9%;background:rgba(88,14,26,.25);height:40%;border-radius:3px 3px 0 0"></i><i style="width:9%;background:rgba(88,14,26,.25);height:55%;border-radius:3px 3px 0 0"></i><i style="width:9%;background:rgba(88,14,26,.25);height:72%;border-radius:3px 3px 0 0"></i><i style="width:9%;background:var(--gd);height:100%;border-radius:3px 3px 0 0"></i></div></div></div>';
 if(k.indexOf('ph:')==0)return phPlate(k.slice(3));
 return ''}
/* بديل احترافي بهوية الموقع بدل صور عشوائية من خدمات صور مجانية —
   بيوضح بصراحة إن ده مكان محجوز للصورة الحقيقية لحد ما ترفعها من
   لوحة التحكم (بدل ما نستخدم صور غرباء ملهمش علاقة بشغلك فعليًا). */
function phPlate(label){
 return '<div class="plate" style="background:var(--mr);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8%;color:var(--gs)">'
 +'<i class="fa-solid fa-camera-retro" style="font-size:clamp(20px,4cqw,38px);opacity:.85"></i>'
 +'<span style="font-size:clamp(9px,1.3cqw,13px);letter-spacing:.06em;text-align:center;padding-inline:8%;opacity:.9">'+esc(label)+'</span></div>'}
var WORKS=[
 {pl:'cov1',c:'social',ta:'كوفر م/ مريم — كيمياء',te:'Mariam chemistry cover',da:'كوفر ترم متعرّف عليه — بيتلوّن كل ترم.',de:'A recognizable term cover.'},
 {pl:'th1',c:'thumb',ta:'ثامبنيل العضوية A/B',te:'Organic A/B',da:'نسخة واحدة رفعت الضغط من ٣٫١٪ لـ ٦٫٢٪ في أسبوعين.',de:'One variant lifted CTR to 6.2% in two weeks.'},
 {pl:'ph:رِيل — الصورة قريبًا',c:'media',ta:'رِيل من جلسة مدينة نصر',te:'Reel — Nasr City',da:'٢٤ ثانية من محاضرة ساعة ونص — ٤٨٠ ألف مشاهدة.',de:'24 seconds — 480K views.'},
 {pl:'da1',c:'ads',ta:'نتائج حملة الترم الثاني',te:'Term-2 campaign',da:'استهداف جغرافي حازم — ٤٢١ حجز بـ ١٨ جنيه.',de:'421 bookings at 18 EGP each.'},
 {pl:'ph:يوم تصوير — الصورة قريبًا',c:'media',ta:'يوم تصوير في المعادي',te:'Shoot day — Maadi',da:'جلسة نور طبيعي: ٤٠ صورة و١٢ كليب خام.',de:'Daylight session: 40 portraits.'},
 {pl:'ph:مطبوعات — الصورة قريبًا',c:'print',ta:'مطبوعات موسم الترم',te:'Term print run',da:'فلايرات وبوسترات — ٥٠٠٠ نسخة في أسبوعين.',de:'5,000 copies in two weeks.'}];
function allW(){return WORKS.concat(DB.works||[])}

/* ══ theme / brand / links ══ */
function setTheme(t){document.documentElement.setAttribute('data-theme',t);theme=t;LS.set(TK,t);var b=$('#thB');if(b)b.innerHTML='<i class="fa-solid fa-'+(t=='dark'?'sun':'moon')+'"></i>';paintBrand()}
function paintBrand(){
 $$('[data-bicon]').forEach(function(b){
  var foot=b.closest('footer');
  if(safeImg(DB.logo)){b.innerHTML='<img src="'+esc(safeImg(DB.logo))+'" alt="">'}
  else{var c=foot?'#C9A96E':(theme=='dark'?'#C9A96E':'#580E1A');
   b.innerHTML='<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" transform="rotate(45 50 50)" fill="none" stroke="'+c+'" stroke-width="3"/><text x="50" y="63" text-anchor="middle" font-family="Fraunces,serif" font-style="italic" font-size="34" fill="'+c+'">K</text></svg>'}})}
function applyStatic(){
 $$('[data-i18n]').forEach(function(e){e.textContent=T(e.getAttribute('data-i18n'))});
 $$('[data-i18n-html]').forEach(function(e){e.innerHTML=san(T(e.getAttribute('data-i18n-html')))});
 var lb=$('#lgB');if(lb)lb.textContent=lang=='ar'?'EN':'ع';
 document.documentElement.lang=lang;document.documentElement.dir=lang=='ar'?'rtl':'ltr';
 document.title=lang=='ar'?'KIRO Creative Agency — وكالة إبداعية':'KIRO Creative Agency'}
function applyLinks(){
 var hi=lang=='ar'?'أهلاً كيرو، عايز نبدأ مشروع':'Hi Kiro, I want to start a project';
 $$('[data-wa]').forEach(function(a){a.href='https://wa.me/'+DB.phone+'?text='+encodeURIComponent(hi)});
 $$('[data-tel]').forEach(function(x){x.href='tel:+'+DB.phone});
 $$('[data-phone]').forEach(function(e){var p=String(DB.phone||'');e.textContent=/^20\d{10}$/.test(p)?'0'+p.slice(2):'+'+p});
 /* لو الأدمن ماحطش رابط سوشيال ميديا (أو الرابط مش http/https)، نخفي الأيقونة */
 [['data-fb','fb'],['data-ig','ig'],['data-tt','tt']].forEach(function(x){
  $$('['+x[0]+']').forEach(function(a){var u=safeUrl(DB[x[1]]);if(u){a.href=u;a.hidden=false}else a.hidden=true})})}
/* ══ مدير المناسبات: تفعيل تلقائي حسب التاريخ + خصومات + ديكور ══ */
function todayStr(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function activeEvent(){
 var t=todayStr();
 var cands=(DB.events||[]).filter(function(e){return e.on&&(!e.start||t>=e.start)&&(!e.end||t<=e.end)});
 if(!cands.length)return null;
 cands.sort(function(a,b){return (b.prio||0)-(a.prio||0)});
 return cands[0]}
function activeDiscount(){
 var e=activeEvent();
 if(!e||!e.dt||e.dt=='none'||!e.dv)return null;
 return {type:e.dt,value:+e.dv,evt:e}}
function discountedPrice(base){
 var d=activeDiscount();if(!d)return base;
 var p=d.type=='pct'?base*(1-d.value/100):base-d.value;
 return Math.max(0,Math.round(p))}
var DEF_EVT_TXT={
 ramadan:{ar:'<b>رمضان كريم</b> — كوفرات وريلز بروح الشهر الكريم، احجز مبكرًا قبل الزحمة',en:'<b>Ramadan Kareem</b> — themed covers &amp; reels for the holy month, book early'},
 eid_fitr:{ar:'<b>عيد فطر مبارك</b> — كل سنة وانت وطلابك بكل خير',en:'<b>Eid Mubarak</b> — wishing you and your students a joyful Eid'},
 eid_adha:{ar:'<b>عيد أضحى مبارك</b> — كل سنة وحضرتك طيب',en:'<b>Eid Al-Adha Mubarak</b> — wishing you a blessed Eid'}
};
var PRESET_ICO={ramadan:'🌙',eid_fitr:'✨',eid_adha:'🕌',custom:'✨'};
var SHEEP_SVG="<svg viewBox='0 0 60 50' xmlns='http://www.w3.org/2000/svg'><ellipse cx='30' cy='30' rx='9' ry='8' fill='#F4EFE6'/><circle cx='14' cy='27' r='9' fill='#F4EFE6'/><circle cx='46' cy='27' r='9' fill='#F4EFE6'/><circle cx='30' cy='19' r='9' fill='#F4EFE6'/><ellipse cx='30' cy='31' rx='8' ry='7' fill='#2A1518'/><circle cx='26.5' cy='29' r='1.4' fill='#fff'/><circle cx='33.5' cy='29' r='1.4' fill='#fff'/><path d='M23 40 L23 46 M37 40 L37 46' stroke='#2A1518' stroke-width='3' stroke-linecap='round'/><path d='M23 22 L37 22 L33 12 L27 12 Z' fill='#8B1E2B'/><circle cx='30' cy='12' r='2' fill='#C9A96E'/><path d='M30 12 Q33 8 30 6' stroke='#C9A96E' stroke-width='1.5' fill='none'/></svg>";
/* مواقع ثابتة موزّعة تُعاد استخدامها لأي مناسبة — لتجنّب عشوائية غير موثوقة */
var EVT_SPOTS=[{top:'8%',left:'4%'},{top:'14%',right:'5%'},{top:'42%',left:'2%'},{bottom:'10%',right:'6%'},{bottom:'18%',left:'8%'},{top:'62%',right:'3%'}];
function renderEventDeco(evt){
 var box=$('#evtDeco');if(!box)return;
 if(!evt||evt.preset=='none'){box.innerHTML='';return}
 var items=[];
 if(evt.preset=='ramadan'){items=[['🌙','tw'],['✨','tw'],['🏮','fl'],['⭐','tw'],['🏮','fl'],['✨','tw']]}
 else if(evt.preset=='eid_fitr'){items=[['🎈','fl'],['🎊','tw'],['🎈','fl'],['✨','tw'],['🎉','bn'],['🎈','fl']]}
 else if(evt.preset=='eid_adha'){items=[['SHEEP','bn'],['🎉','tw'],['✨','tw'],['SHEEP','bn'],['🎊','fl'],['✨','tw']]}
 else{items=[['✨','tw'],['✨','fl'],['✨','tw'],['✨','fl'],['✨','tw'],['✨','fl']]}
 box.innerHTML=items.map(function(it,i){
  var pos=EVT_SPOTS[i%EVT_SPOTS.length],st=Object.keys(pos).map(function(k){return k+':'+pos[k]}).join(';');
  var inner=it[0]=='SHEEP'?SHEEP_SVG:it[0];
  return '<span class="evtIc '+it[1]+'" style="'+st+';color:'+col(evt.c2,'#C9A96E')+'">'+inner+'</span>'
 }).join('')}
function applyEventTheme(){
 var e=activeEvent();
 var preset=e?e.preset:'';
 document.documentElement.setAttribute('data-occasion',preset||'');
 document.documentElement.style.setProperty('--evt-p',e?col(e.c1,'#580E1A'):'');
 document.documentElement.style.setProperty('--evt-s',e?col(e.c2,'#C9A96E'):'');
 renderEventDeco(e);
 try{
  var ic=document.querySelector('link[rel="icon"]');
  if(ic){
   var em=e?(PRESET_ICO[e.preset]||'✨'):'K';
   var svg=e?('<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'><rect width=\'64\' height=\'64\' rx=\'10\' fill=\'%23580E1A\'/><text x=\'32\' y=\'42\' font-size=\'30\' text-anchor=\'middle\'>'+em+'</text></svg>')
    :'<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'><rect width=\'64\' height=\'64\' rx=\'10\' fill=\'%23580E1A\'/><text x=\'32\' y=\'45\' font-family=\'Georgia\' font-style=\'italic\' font-size=\'34\' fill=\'%23C9A96E\' text-anchor=\'middle\'>K</text></svg>';
   ic.href='data:image/svg+xml,'+svg;
  }
 }catch(e2){}
 renderSeason()}
function renderSeason(){
 var b=$('#seasonB');if(!b)return;
 if(SS.get(SK)=='1'){b.hidden=true;return}
 var e=activeEvent();
 var evtTxt=e?((lang=='ar'?e.da:e.de)||(DEF_EVT_TXT[e.preset]&&DEF_EVT_TXT[e.preset][lang])||(lang=='ar'?e.na:(e.ne||e.na))):'';
 var d=activeDiscount();
 if(d)evtTxt+=(evtTxt?' — ':'')+(lang=='ar'?('خصم '+ (d.type=='pct'?ar(d.value)+'٪':ar(d.value)+' ج.م')+' على كل الباقات'):('Save '+(d.type=='pct'?d.value+'%':d.value+' EGP')+' on all packages'));
 var txt=DB.season&&DB.season.trim()?DB.season.trim():(evtTxt||D[lang].seas[new Date().getMonth()]||'');
 if(!txt){b.hidden=true;return}
 b.hidden=false;
 var ico=e&&PRESET_ICO[e.preset]?'<span class="sIco">'+PRESET_ICO[e.preset]+'</span>':'';
 b.querySelector('span').innerHTML=ico+san(txt)}
/* ══ ROI ══ */
var PK_COST=4900;
function calcROI(){
 var p=$('#roiPrice');if(!p)return;
 var price=+p.value,stu=+$('#roiStu').value,les=+$('#roiLes').value;
 $('#roiPv').textContent=ar(price)+' '+T('egp');
 $('#roiSv').textContent=ar(stu)+' '+T('stu_w');
 $('#roiLv').textContent=ar(les)+' '+T('les_w');
 var income=price*stu*les,net=income-PK_COST;
 var unit=price*les,cover=unit>0?Math.ceil(PK_COST/unit):0;
 var covPct=stu>0?Math.min(100,(cover/stu)*100):100,prPct=Math.max(0,100-covPct);
 $('#roiCost').style.width=Math.round(covPct)+'%';
 $('#roiProf').style.width=Math.round(prPct)+'%';
 $('#roiCost').textContent=covPct>14?ar(Math.min(income,PK_COST)):'';
 $('#roiProf').textContent=prPct>14?'+ '+ar(Math.max(0,net)):'';
 var el=$('#roiNet'),v=$('#roiVer');
 el.textContent=(net>=0?'+':'\u2212')+ar(Math.abs(net))+' '+T('egp');
 el.className='roiBig'+(net>=0?' profit':'');
 v.textContent=net>=0?T('roi_good'):T('roi_bad');
 v.className='roiVerdict'+(net>=0?' good':'');
 $('#roiInc').textContent=ar(income)+' '+T('egp');
 $('#roiBE').textContent=ar(cover)}
/* ══ renders ══ */
function rRes(){
 var g=$('#resG');if(!g)return;
 g.innerHTML=DB.teachers.map(function(t){
  var nm=lang=='ar'?(t.na||t.ne):(t.ne||t.na),sb=lang=='ar'?(t.sa||t.se):(t.se||t.sa);
  return '<div class="resCard"><div class="rcLnk">'
  +(safeUrl(t.fb)?'<a href="'+esc(safeUrl(t.fb))+'" target="_blank" rel="noopener"><i class="fa-brands fa-facebook-f"></i></a>':'')
  +(safeUrl(t.yt)?'<a href="'+esc(safeUrl(t.yt))+'" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i></a>':'')
  +'<button data-sh="'+esc(nm+' — '+sb+': '+(t.big||''))+'"><i class="fa-solid fa-share-nodes"></i></button></div>'
  +'<div class="rcT"><span class="avat">'+esc(nm.charAt(0))+'</span><div><b>'+esc(nm)+'</b><i>'+esc(sb)+'</i></div></div>'
  +'<div class="rcBig">'+esc(t.big||'')+'<span class="rcCap">'+esc(lang=='ar'?(t.bca||''):(t.bce||''))+'</span></div>'
  +'<div class="rcRow"><span>'+esc(lang=='ar'?(t.m1a||''):(t.m1e||''))+'</span><b>'+esc(t.m1||'')+'</b></div>'
  +'<div class="rcRow"><span>'+esc(lang=='ar'?(t.m2a||''):(t.m2e||''))+'</span><b>'+esc(t.m2||'')+'</b></div></div>'}).join('');
 $$('[data-sh]').forEach(function(b){b.addEventListener('click',function(){
  var txt=b.getAttribute('data-sh')+' \u2014 Kiro Studio';
  if(navigator.share){navigator.share({title:'Kiro',text:txt}).catch(function(){})}
  else{try{navigator.clipboard.writeText(txt);toastMsg(T('copied'))}catch(e){toastMsg(txt)}}})})}
function rWhy(){
 $('#whyL').innerHTML=WHY.map(function(w,i){return '<div class="val"><span class="vN">( 0'+(i+1)+' )</span><h3>'+bi([w[0],w[1]])+'</h3><p>'+bi([w[2],w[3]])+'</p></div>'}).join('');
 $('#jrS').innerHTML=JR.map(function(s){return '<div class="step"><i class="'+s[0]+' si"></i><b>'+bi([s[1],s[2]])+'</b><span>'+bi([s[3],s[4]])+'</span></div>'}).join('')}
var pendingSvc=null;
function rSvc(){
 $('#svcL').innerHTML=SVC.map(function(s,i){
  return '<a class="val" href="#/contact" onclick="return nav(\'contact\')" data-svc="'+esc(bi([s[1],s[2]]))+'"><span class="vN">0'+(i+1)+'</span><h3><i class="'+s[0]+'"></i>'+bi([s[1],s[2]])+'</h3><div><p>'+bi([s[3],s[4]])+'</p><div class="vTags">'+s[5].map(function(g){return '<span class="vTag">'+bi(g)+'</span>'}).join('')+'</div></div></a>'}).join('');
 $$('#svcL [data-svc]').forEach(function(a){a.addEventListener('click',function(){pendingSvc=a.getAttribute('data-svc')})})}
function rFeat(){
 var f=[{pl:'th1',c:['ثامبنيل كيمياء','Chemistry thumbnail']},{pl:'ph:رِيل — الصورة قريبًا',c:['رِيل من محاضرة','Reel from a lecture']},{pl:'da1',c:['حملة ٤٢١ حجز','421 bookings']},{pl:'ph:يوم استديو — الصورة قريبًا',c:['يوم استديو','A studio day']}];
 $('#featG').innerHTML=f.map(function(x){return '<a class="ftile" href="#/portfolio" onclick="return nav(\'portfolio\')">'+(x.img?'<img src="'+x.img+'" alt="" loading="lazy">':plate(x.pl))+'<div class="fcap"><b>'+bi(x.c)+'</b><small>'+(lang=='ar'?'من أعمالنا':'Portfolio')+'</small></div></a>'}).join('')}
function initBA(){
 var card=$('#baCard');if(!card||card.dataset.init)return;card.dataset.init='1';
 var af=$('#baAf'),h=$('#baH');
 function setBA(cx){
  var r=baRect||card.getBoundingClientRect(),pct;
  if(document.documentElement.dir=='rtl'){pct=Math.max(6,Math.min(94,((r.right-cx)/r.width)*100));af.style.clipPath='inset(0 0 0 '+pct+'%)'}
  else{pct=Math.max(6,Math.min(94,((cx-r.left)/r.width)*100));af.style.clipPath='inset(0 '+pct+'% 0 0)'}
  h.style.insetInlineStart=pct+'%'}
 var dn=false;
 card.addEventListener('pointerdown',function(e){baRect=card.getBoundingClientRect();dn=true;try{card.setPointerCapture(e.pointerId)}catch(x){};setBA(e.clientX)});
 card.addEventListener('pointermove',function(e){if(dn)setBA(e.clientX)});
 ['pointerup','pointercancel'].forEach(function(ev){card.addEventListener(ev,function(){dn=false;baRect=null})})}
/* ══ studio ══ */
var curLoc=STU[0].id;
function rLocT(){
 var t=$('#locT');if(!t)return;
 t.innerHTML=STU.map(function(s){return '<button class="tab'+(s.id==curLoc?' on':'')+'" data-l="'+s.id+'"><i class="'+s.ic+'"></i> '+bi(s.na)+'</button>'}).join('');
 $$('#locT .tab').forEach(function(b){b.addEventListener('click',function(){curLoc=b.getAttribute('data-l');rLocT();rLocP();syncLoc()})})}
function rLocP(){
 var p=$('#locP');if(!p)return;
 var s=STU.filter(function(x){return x.id==curLoc})[0];
 p.innerHTML='<div class="locG"><div class="locGal">'
 +'<div class="gPh big">'+phPlate((lang=='ar'?'صور الفرع قريبًا':'Branch photos coming soon'))+'<span class="gBad"><i class="fa-solid fa-camera"></i> '+(lang=='ar'?'الديكور الأساسي':'Main set')+'</span></div>'
 +'<div class="gPh">'+phPlate((lang=='ar'?'صورة قريبًا':'Photo soon'))+'</div>'
 +'<div class="gPh">'+phPlate((lang=='ar'?'صورة قريبًا':'Photo soon'))+'</div></div>'
 +'<div class="locInfo"><h3>'+bi(s.na)+'</h3><div class="lsub">'+bi(s.area)+'</div>'
 +'<div class="li"><i class="fa-solid fa-location-dot"></i><span>'+bi(s.ad)+'</span></div>'
 +'<div class="li"><i class="fa-regular fa-clock"></i><span>'+bi(s.hr)+'</span></div>'
 +'<div style="margin-top:11px">'+s.cl.map(function(c){return '<div class="li"><i class="fa-solid fa-play"></i><span>'+bi([c[0],c[1]])+' · '+c[2]+'</span></div>'}).join('')+'</div></div></div>'}
function rDev(){
 $('#ipF').innerHTML=IPHF.map(function(f){return '<li><i class="fa-solid fa-check"></i>'+bi(f)+'</li>'}).join('');
 $('#cmF').innerHTML=CMF.map(function(f){return '<li><i class="fa-solid fa-check"></i>'+bi(f)+'</li>'}).join('')}
var bkD=null,bkS='',bkT=0,bkDays=[],bkDs=[],bkDi=-1,bkTaken={};
function rBk(){
 var sel=$('#bkLoc');if(!sel)return;
 sel.innerHTML=STU.map(function(s){return '<option value="'+s.id+'"'+(s.id==curLoc?' selected':'')+'>'+bi(s.na)+'</option>'}).join('');
 /* الأيام بتوقيت القاهرة (مش توقيت جهاز العميل) */
 var base=new Date(cairoYMD()+'T12:00:00Z');bkDays=[];bkDs=[];
 for(var i=1;i<=7;i++){var d=new Date(base.getTime()+i*864e5);bkDays.push(d);bkDs.push(d.toISOString().slice(0,10))}
 var lc=lang=='ar'?'ar-EG':'en-GB',wf=new Intl.DateTimeFormat(lc,{weekday:'short',timeZone:'UTC'});
 $('#dayR').innerHTML=bkDays.map(function(d,i){return '<button type="button" class="dayCh'+(i==bkDi?' on':'')+'" data-d="'+i+'">'+wf.format(d)+'<b>'+d.getUTCDate()+'</b></button>'}).join('');
 $$('#dayR .dayCh').forEach(function(b){b.addEventListener('click',function(){$$('#dayR .dayCh').forEach(function(x){x.classList.remove('on')});b.classList.add('on');bkDi=+b.getAttribute('data-d');bkD=bkDays[bkDi];paintSlots()})});
 if(bkDi>-1)bkD=bkDays[bkDi];
 $('#slotR').innerHTML=['10:00','13:00','16:00','19:00'].map(function(t){return '<button type="button" class="slotCh'+(t==bkS?' on':'')+'" data-s="'+t+'">'+t+'</button>'}).join('');
 $$('#slotR .slotCh').forEach(function(b){b.addEventListener('click',function(){if(b.disabled)return;$$('#slotR .slotCh').forEach(function(x){x.classList.remove('on')});b.classList.add('on');bkS=b.getAttribute('data-s')})});
 rTypes();loadTaken()}
function paintSlots(){
 $$('#slotR .slotCh').forEach(function(b){
  var s=b.getAttribute('data-s'),tk=bkDi>-1&&bkTaken[bkDs[bkDi]+'|'+s];
  b.disabled=!!tk;b.classList.toggle('taken',!!tk);
  if(tk&&bkS==s){bkS='';b.classList.remove('on')}})}
function loadTaken(){
 if(!window.fetch||!$('#slotR'))return;
 fetch('/api/booked?loc='+encodeURIComponent(curLoc),{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(j){
  bkTaken={};(j.taken||[]).forEach(function(k){bkTaken[k]=1});paintSlots()}).catch(function(){})}
function rTypes(){
 var tt=[['آيفون','iPhone'],['كاميرا احترافية','Pro camera']];
 $('#typeR').innerHTML=tt.map(function(t,i){return '<button type="button" class="slotCh'+(bkT==i?' on':'')+'" data-t="'+i+'">'+(lang=='ar'?t[0]:t[1])+'</button>'}).join('');
 $$('#typeR .slotCh').forEach(function(b){b.addEventListener('click',function(){bkT=+b.getAttribute('data-t');rTypes()})})}
function syncLoc(){var s=$('#bkLoc');if(s)s.value=curLoc;loadTaken()}
 $$('[data-bt]').forEach(function(b){b.addEventListener('click',function(){bkT=+b.getAttribute('data-bt');rTypes();var p=$('#p-studio .bookP');if(p)p.scrollIntoView({behavior:SB()})})});
/* ══ platform ══ */
function rPlat(){
 var f=$('#plF');if(!f)return;
 f.innerHTML=PF2.map(function(x){return '<div class="pf2"><i class="'+x[0]+'"></i><h3>'+bi(x[1])+'</h3><ul>'+x[2].map(function(y){return '<li><i class="fa-solid fa-check"></i>'+bi(y)+'</li>'}).join('')+'</ul></div>'}).join('');
 var nm={mo:['شهري','Monthly'],q3:['٣ شهور','Quarterly'],yr:['سنوي','Yearly'],life:['مدى الحياة','Lifetime']};
 $('#subG').innerHTML=PLANS.map(function(p){
  return '<div class="subC'+(p.hot?' hot':'')+(p.k=='life'?' forever':'')+'">'+(p.save?'<span class="saveB">'+bi(p.save)+'</span>':'')
  +'<h3>'+(lang=='ar'?nm[p.k][0]:nm[p.k][1])+'</h3><p class="subFor">'+bi(p.f)+'</p>'
  +'<div class="subPr"><b>'+new Intl.NumberFormat('en-US').format(p.pr)+'</b><small>'+(lang=='ar'?'ج.م':'EGP')+'</small></div>'
  +'<ul class="svF">'+p.fs.map(function(x){return '<li><i class="fa-solid fa-check"></i>'+bi(x)+'</li>'}).join('')+'</ul>'
  +'<button class="btn '+(p.hot||p.k=='life'?'bG':'bO')+'" data-plan="'+p.k+'" style="width:100%"><i class="fa-solid fa-cart-shopping"></i> '+T('sub_now')+'</button></div>'}).join('');
 $$('#subG [data-plan]').forEach(function(b){b.addEventListener('click',function(){
  var p=null;PLANS.forEach(function(x){if(x.k==b.getAttribute('data-plan'))p=x});
  var n=lang=='ar'?nm[p.k][0]:nm[p.k][1];
  wa('*'+T('plat_msg')+'*\n• '+T('plan_l')+': '+n+'\n• '+T('price_l')+': '+new Intl.NumberFormat('en-US').format(p.pr)+' EGP','plan',{service:n});
  toastMsg(T('sent'))})})}
/* ══ portfolio ══ */
var actC='all';
function rCats(){
 var t=$('#pfT');if(!t)return;
 t.innerHTML=CATS.map(function(c){return '<button class="tab'+(actC==c[0]?' on':'')+'" data-c="'+c[0]+'">'+(lang=='ar'?c[1]:c[2])+'</button>'}).join('');
 $$('#pfT .tab').forEach(function(b){b.addEventListener('click',function(){actC=b.getAttribute('data-c');rCats();rGrid()})})}
function workMedia(w,thumb){
 var si=safeImg(w.img);
 if(si)return '<img src="'+esc(si)+'" alt="" loading="lazy" decoding="async">';
 var y=ytId(w.video);
 if(y&&thumb)return '<img src="https://i.ytimg.com/vi/'+esc(y)+'/hqdefault.jpg" alt="" loading="lazy" decoding="async">';
 return plate(w.pl)}
function catName(c){for(var i=0;i<CATS.length;i++)if(CATS[i][0]==c)return lang=='ar'?CATS[i][1]:CATS[i][2];return c}
function rGrid(){
 var g=$('#pfG');if(!g)return;
 var list=allW(),h='',n=0;
 list.forEach(function(w,i){
  if(actC!='all'&&w.c!=actC)return;
  var md=workMedia(w,true);
  h+='<figure class="pfIt" data-i="'+i+'" tabindex="0"><div class="pfM">'+md+'</div>'
  +'<button class="shB" data-shw="'+i+'"><i class="fa-solid fa-share-nodes"></i></button>'
  +'<span class="tagC">'+esc(catName(w.c))+'</span><figcaption class="cap"><div><b>'+esc(lang=='ar'?(w.ta||w.te):(w.te||w.ta))+'</b></div><span class="pPlus"><i class="fa-solid fa-plus"></i></span></figcaption></figure>';
  n++});
 g.innerHTML=h;
 $$('#pfG .pfIt').forEach(function(f){
  f.addEventListener('click',function(e){
   if(e.target.closest('.shB'))return;
   openLB(+f.getAttribute('data-i'))})});
 $$('#pfG [data-shw]').forEach(function(b){b.addEventListener('click',function(e){
  e.stopPropagation();
  var w=allW()[+b.getAttribute('data-shw')];
  var txt=(lang=='ar'?(w.ta||w.te):(w.te||w.ta))+' \u2014 Kiro';
  if(navigator.share){navigator.share({title:'Kiro',text:txt}).catch(function(){})}
  else{try{navigator.clipboard.writeText(txt);toastMsg(T('copied'))}catch(e){toastMsg(txt)}}})})}
var lbI=[],lbPos=0;
function openLB(i){
 lbI=[];allW().forEach(function(w,k){if(actC=='all'||w.c==actC)lbI.push(k)});
 lbPos=Math.max(0,lbI.indexOf(i));pbLB();
 $('#lb').classList.add('op');document.body.style.overflow='hidden'}
function pbLB(){
 var w=allW()[lbI[lbPos]],st=$('#lbS');
 var y=ytId(w.video);
 if(y){st.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+esc(y)+'" title="video" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>'}
 else st.innerHTML=workMedia(w,false);
 $('#lbC').textContent=catName(w.c);
 $('#lbT').textContent=lang=='ar'?(w.ta||w.te):(w.te||w.ta);
 $('#lbD').textContent=lang=='ar'?(w.da||w.de||''):(w.de||w.da||'');
 $('#lbI').textContent=(lbPos+1)+' / '+lbI.length}
function clLB(){$('#lb').classList.remove('op');document.body.style.overflow=''}
/* ══ print ══ */
var PRD=[
 {id:'flyer',sv:'<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 8h6M9 12h6M9 16h4"/>',nm:['فلاير','Flyer'],un:['فلاير','flyers'],b:1.15,mn:200,mx:10000,st:100,df:1000},
 {id:'poster',sv:'<rect x="4" y="3" width="16" height="18" rx="1"/><circle cx="9.5" cy="9" r="1.8"/><path d="M4 17l5-4 4 3 3-2.5 4 3.5"/>',nm:['بوستر A2','Poster A2'],un:['بوستر','posters'],b:60,mn:20,mx:1000,st:5,df:100},
 {id:'roll',sv:'<rect x="7" y="3" width="10" height="14" rx="1"/><path d="M12 17v3M7 22h10"/>',nm:['رول أب','Roll-up'],un:['ستاند','stands'],b:480,mn:1,mx:30,st:1,df:2},
 {id:'card',sv:'<rect x="3" y="6" width="13" height="9" rx="1.5"/><rect x="8" y="10" width="13" height="9" rx="1.5"/>',nm:['كارت','Card'],un:['كرت','cards'],b:2.2,mn:100,mx:5000,st:50,df:500},
 {id:'note',sv:'<path d="M5 4h11l3 3v13H5z"/><path d="M16 4v3h3M9 12h6M9 16h4"/>',nm:['ملزمة','Booklet'],un:['نسخة','copies'],b:14,mn:50,mx:2000,st:10,df:200},
 {id:'ban',sv:'<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 6l3-2h12l3 2M8 12h8"/>',nm:['بانر','Banner'],un:['قطعة','panels'],b:210,mn:1,mx:40,st:1,df:4}];
var pc={p:'flyer',f:'',q:1000,e:false,tot:0};
function getFinish(id){var l=DB.finishes||[];for(var i=0;i<l.length;i++)if(l[i].id==id)return l[i];return null}
function getPaper(id){var l=DB.paper||[];for(var i=0;i<l.length;i++)if(l[i].id==id)return l[i];return null}
function getBind(id){var l=DB.bind||[];for(var i=0;i<l.length;i++)if(l[i].id==id)return l[i];return null}
function pNum(v,mn){v=parseFloat(v);if(!isFinite(v)||v<mn)return mn;return v}
function gP(id){for(var i=0;i<PRD.length;i++)if(PRD[i].id==id)return PRD[i];return PRD[0]}
function paintPkPrice(n,raw){
 var el=$('#pkPr'+n),bd=$('#pkDisc'+n);if(!el)return;
 var fin=discountedPrice(raw);
 el.innerHTML=fin<raw?'<s class="pkOld">'+ar(raw)+'</s>'+ar(fin):ar(raw);
 if(bd){
  if(fin<raw){var d=activeDiscount();bd.hidden=false;
   bd.textContent=lang=='ar'?('خصم '+(d.type=='pct'?ar(d.value)+'٪':ar(d.value)+' ج.م')):('-'+(d.type=='pct'?d.value+'%':d.value+' EGP'))}
  else bd.hidden=true}
 return fin}
function applyPrices(){
 PRD.forEach(function(p){if(DB.prices.print[p.id]!=null)p.b=+DB.prices.print[p.id]});
 var raw=DB.prices.pk;
 paintPkPrice(1,raw[0]);
 var fin2=paintPkPrice(2,raw[1]);
 paintPkPrice(3,raw[2]);
 PK_COST=(typeof fin2=='number')?fin2:raw[1];
 var e4=$('#roiPkCost');if(e4)e4.textContent=ar(PK_COST)}
function snq(v){var P=gP(pc.p);v=P.mn+Math.round((v-P.mn)/P.st)*P.st;return Math.max(P.mn,Math.min(P.mx,v))}
function pMode(){return pc.p=='ban'?'ban':(pc.p=='note'?'note':'std')}
function rPrB(){
 var g=$('#prodG');if(!g)return;
 g.innerHTML=PRD.map(function(p){return '<button type="button" class="opt'+(pc.p==p.id?' on':'')+'" data-p="'+esc(p.id)+'"><svg viewBox="0 0 24 24">'+p.sv+'</svg>'+(lang=='ar'?p.nm[0]:p.nm[1])+'</button>'}).join('');
 $$('#prodG .opt').forEach(function(b){b.addEventListener('click',function(){pc.p=b.getAttribute('data-p');pc.q=gP(pc.p).df;if(pc.p!='card')pc.f='';rPrB();calcP(false)})});
 var mode=pMode();
 $('#finStep').hidden=pc.p!='card';
 $('#stdStep').hidden=mode!='std';
 $('#banCalc').hidden=mode!='ban';
 $('#noteCalc').hidden=mode!='note';
 if(pc.p=='card'){
  var fins=(DB.finishes||[]).filter(function(f){return f.on});
  $('#finR').innerHTML='<button type="button" class="finCh'+(!pc.f?' on':'')+'" data-f="">'+esc(T('fin_none'))+'</button>'+
   fins.map(function(f){return '<button type="button" class="finCh'+(pc.f==f.id?' on':'')+'" data-f="'+esc(f.id)+'">'+esc(lang=='ar'?f.na:(f.ne||f.na))+' <small>+'+ar(f.price)+'</small></button>'}).join('');
  $$('#finR .finCh').forEach(function(b){b.addEventListener('click',function(){pc.f=b.getAttribute('data-f');rPrB();calcP(true)})})}
 if(mode=='note'){
  var papers=(DB.paper||[]).filter(function(p){return p.on}),binds=(DB.bind||[]).filter(function(b){return b.on});
  if(!papers.some(function(p){return p.id==pc.ntSize}))pc.ntSize=papers[0]?papers[0].id:'';
  if(!binds.some(function(b){return b.id==pc.ntBind}))pc.ntBind=binds[0]?binds[0].id:'';
  $('#ntSize').innerHTML=papers.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id==pc.ntSize?' selected':'')+'>'+esc(p.na)+'</option>'}).join('')||'<option value="">—</option>';
  $('#ntBind').innerHTML=binds.map(function(b){return '<option value="'+esc(b.id)+'"'+(b.id==pc.ntBind?' selected':'')+'>'+esc(lang=='ar'?b.na:(b.ne||b.na))+'</option>'}).join('')||'<option value="">—</option>';
  $('#ntPages').value=pc.ntPages||20;$('#ntCopies').value=pc.ntCopies||50}
 if(mode=='ban'){$('#banW').value=pc.banW||100;$('#banH').value=pc.banH||200}}
function finName(){var f=getFinish(pc.f);return f?(lang=='ar'?f.na:(f.ne||f.na)):T('fin_none')}
function fmtM(n){return new Intl.NumberFormat(lang=='ar'?'ar-EG':'en-US').format(n)+' '+(lang=='ar'?'ج.م':'EGP')}
function calcP(pu){
 var mode=pMode(),e=$('#estT');
 if(mode=='std'){
  var P=gP(pc.p),r=$('#qtyR');if(!r)return;
  r.min=P.mn;r.max=P.mx;r.step=P.st;r.value=pc.q;
  $('#qV').textContent=ar(pc.q);$('#qU').textContent=lang=='ar'?P.un[0]:P.un[1];
  $('#smP').textContent=lang=='ar'?P.nm[0]:P.nm[1];
  $('#smF').textContent=pc.p=='card'?finName():'—';
  var pr=[],m1=P.df,mid=snq((P.df+P.mx)/2);
  [m1,mid,P.mx].forEach(function(v){if(pr.indexOf(v)<0)pr.push(v)});
  $('#preB').innerHTML=pr.map(function(v){return '<button type="button" data-q="'+v+'">'+ar(v)+'</button>'}).join('');
  $$('#preB button').forEach(function(b){b.addEventListener('click',function(){pc.q=+b.getAttribute('data-q');calcP(true)})});
  var finCost=pc.p=='card'&&pc.f?(getFinish(pc.f)?getFinish(pc.f).price:0)*pc.q:0;
  pc.tot=Math.round(P.b*pc.q*(pc.e?1.18:1)+finCost);
 }else if(mode=='ban'){
  var w=pNum($('#banW')&&$('#banW').value,1),h=pNum($('#banH')&&$('#banH').value,1);
  pc.banW=w;pc.banH=h;
  var areaM2=(w/100)*(h/100),pM2=+DB.prices.banM2||210;
  pc.tot=Math.round(areaM2*pM2);
  $('#smP').textContent=lang=='ar'?'بانر':'Banner';$('#smF').textContent='—';
  var bk=$('#banBrk');if(bk)bk.innerHTML=
   '<div class="cbR"><span>'+(lang=='ar'?'العرض':'Width')+'</span><b>'+ar(w)+' cm</b></div>'+
   '<div class="cbR"><span>'+(lang=='ar'?'الطول':'Height')+'</span><b>'+ar(h)+' cm</b></div>'+
   '<div class="cbR"><span>'+(lang=='ar'?'المساحة':'Area')+'</span><b>'+ar(Math.round(areaM2*100)/100)+' m²</b></div>'+
   '<div class="cbR"><span>'+(lang=='ar'?'سعر المتر':'Price / m²')+'</span><b>'+ar(pM2)+'</b></div>';
 }else if(mode=='note'){
  var pages=pNum($('#ntPages')&&$('#ntPages').value,1),copies=pNum($('#ntCopies')&&$('#ntCopies').value,1);
  pc.ntPages=pages;pc.ntCopies=copies;
  var paper=getPaper($('#ntSize')?$('#ntSize').value:pc.ntSize),bind=getBind($('#ntBind')?$('#ntBind').value:pc.ntBind);
  pc.ntSize=paper?paper.id:pc.ntSize;pc.ntBind=bind?bind.id:pc.ntBind;
  var paperCost=pages*copies*(paper?paper.price:0),bindCost=(bind?bind.price:0)*copies;
  pc.tot=Math.round(paperCost+bindCost);
  $('#smP').textContent=lang=='ar'?'ملزمة':'Booklet';$('#smF').textContent=bind?(lang=='ar'?bind.na:(bind.ne||bind.na)):'—';
  var bk2=$('#ntBrk');if(bk2)bk2.innerHTML=
   '<div class="cbR"><span>'+(lang=='ar'?'ورق ('+ar(pages)+'×'+ar(copies)+')':'Paper ('+ar(pages)+'×'+ar(copies)+')')+'</span><b>'+fmtM(Math.round(paperCost))+'</b></div>'+
   '<div class="cbR"><span>'+(lang=='ar'?'التقفيل':'Binding')+'</span><b>'+fmtM(Math.round(bindCost))+'</b></div>';
 }
 e.textContent='\u2248 '+fmtM(pc.tot);
 if(pu){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}}
/* ══ cube ══ */
(function(){
 var st=document.getElementById('cubeS'),cu=document.getElementById('cube');if(!st||!cu)return;
 var rX=-14,rY=28,vX=0,dn=false,lx=0;
 var wake=rafLoop(cu,function(dt){
  if(!dn){rY+=vX*dt;vX*=Math.pow(.94,dt);if(Math.abs(vX)<.02)vX=0;if(!REDUCED)rY+=.06*dt}
  cu.style.transform='rotateX('+rX.toFixed(1)+'deg) rotateY('+rY.toFixed(1)+'deg)';
  if(REDUCED&&!dn&&vX===0)return false});
 st.addEventListener('pointerdown',function(e){dn=true;lx=e.clientX;vX=0;try{st.setPointerCapture(e.pointerId)}catch(x){}wake()});
 st.addEventListener('pointermove',function(e){if(!dn)return;var dx=e.clientX-lx;lx=e.clientX;rY+=dx*.5;vX=dx*.5;wake()});
 ['pointerup','pointercancel'].forEach(function(ev){st.addEventListener(ev,function(){dn=false;wake()})})})();
/* ══ packages ══ */
function rPk(){
 Object.keys(PKD).forEach(function(k){
  var el=document.querySelector('[data-list="'+k+'"]');
  if(el)el.innerHTML=PKD[k].map(function(f){return '<li><i class="fa-solid fa-check"></i>'+bi(f)+'</li>'}).join('')});
 $$('[data-pk]').forEach(function(b){b.addEventListener('click',function(){
  pendingSvc=(lang=='ar'?['باقة البداية الصح','باقة وجه المدرس — إدارة شهرية','باقة نجم الترم'][+b.getAttribute('data-pk')]:['Solid Start','The Teacher\u2019s Face','Star of the Term'][+b.getAttribute('data-pk')]);
  nav('contact')})})}
/* ══ reviews ══ */
var rvI=0,rvT2;
function revList(){return(DB.reviews&&DB.reviews.length)?DB.reviews:RVS}
function rRv(){
 var tr=$('#rvTr');if(!tr)return;
 tr.innerHTML=revList().map(function(r){
  return '<div class="rvSl" dir="'+(lang=='ar'?'rtl':'ltr')+'"><p class="rvTx">&ldquo;'+esc(lang=='ar'?r.ba:r.be)+'&rdquo;</p><div class="rvPe"><span class="rvAv">'+esc(String(lang=='ar'?r.na:r.ne).charAt(0))+'</span><div><b>'+esc(lang=='ar'?r.na:r.ne)+'</b><span>'+esc(lang=='ar'?r.ra:r.re)+'</span></div></div></div>'}).join('');
 $('#rvDt').innerHTML=revList().map(function(_,i){return '<button data-r="'+i+'" aria-label="'+(i+1)+'"></button>'}).join('');
 $$('#rvDt button').forEach(function(d){d.addEventListener('click',function(){rvGo(+d.getAttribute('data-r'));rvA()})});
 rvI=0;rvPaint()}
function rvGo(i){rvI=(i+revList().length)%revList().length;rvPaint()}
function rvPaint(){$('#rvTr').style.transform='translateX('+(-rvI*100)+'%)';$$('#rvDt button').forEach(function(d,k){d.classList.toggle('on',k==rvI)})}
function rvA(){clearInterval(rvT2);if(REDUCED)return;rvT2=setInterval(function(){if(!document.hidden)rvGo(rvI+1)},5400)}
/* ══ contact ══ */
function rCt(){
 var sel=$('#cfTy');if(!sel)return;
 var o=SVC.map(function(s){return bi([s[1],s[2]])});o.push(T('consult'));
 sel.innerHTML=o.map(function(x){return '<option>'+esc(x)+'</option>'}).join('')}
/* ══ admin ══ */
var ADM=false;function isAdm(){return ADM}
function admUI(){
 var ok=isAdm();
 $('#admG').hidden=ok;$('#admS').hidden=!ok;
 if(ok){fillSet();rTeR();rWoR();rRvR();rSel();var si=$('#seasIn');if(si)si.value=DB.season||'';rEvR();fillPrices();fillContent();rFinR();rPapR();rBindR();rLeads()}}
function fillSet(){
 $('#sPh').value=DB.phone;$('#sFb').value=DB.fb||'';$('#sIg').value=DB.ig||'';$('#sTt').value=DB.tt||'';
 if(safeImg(DB.logo))$('#lpB').innerHTML='<img src="'+esc(safeImg(DB.logo))+'" alt="">'}
var EVT_PRESET_LBL={none:['بدون زخارف','No decor'],ramadan:['رمضان','Ramadan'],eid_fitr:['عيد الفطر','Eid Al-Fitr'],eid_adha:['عيد الأضحى','Eid Al-Adha'],custom:['تألق عام','Sparkle']};
function rEvR(){
 var g=$('#evR');if(!g)return;
 var t=todayStr(),act=activeEvent();
 g.innerHTML=(DB.events||[]).map(function(e){
  var live=act&&act.id==e.id;
  var range=(e.start||'…')+' → '+(e.end||'…');
  var dtxt=e.dt&&e.dt!='none'?(e.dt=='pct'?e.dv+'%':e.dv+' ج.م'):'';
  return '<div class="rowI"><span class="mAv" style="background:'+col(e.c1,'#580E1A')+';color:'+col(e.c2,'#C9A96E')+'">'+(PRESET_ICO[e.preset]||'★')+'</span>'+
   '<div class="rB"><b>'+esc(e.na)+(live?' <span style="color:#2e8b57;font-weight:700">● شغالة دلوقتي</span>':(e.on?'':' <span style="color:var(--so)">— معطّلة</span>'))+'</b>'+
   '<small>'+esc(range)+(dtxt?' · خصم '+esc(dtxt):'')+' · '+esc((EVT_PRESET_LBL[e.preset]||['',''])[0])+'</small></div>'+
   '<div class="rBt"><button type="button" class="mB" data-e="'+esc(e.id)+'"><i class="fa-solid fa-pen"></i></button><button type="button" class="mB del" data-x="'+esc(e.id)+'"><i class="fa-solid fa-trash"></i></button></div></div>'
 }).join('')||'<p style="font-size:13px;color:var(--so)">—</p>';
 $$('#evR [data-e]').forEach(function(b){b.addEventListener('click',function(){
  var ev=null;DB.events.forEach(function(x){if(x.id==b.getAttribute('data-e'))ev=x});if(!ev)return;
  $('#evId').value=ev.id;$('#evNA').value=ev.na||'';$('#evNE').value=ev.ne||'';$('#evDA').value=ev.da||'';$('#evDE').value=ev.de||'';
  $('#evStart').value=ev.start||'';$('#evEnd').value=ev.end||'';$('#evPreset').value=ev.preset||'none';$('#evPrio').value=ev.prio||1;
  $('#evC1').value=ev.c1||'#580E1A';$('#evC2').value=ev.c2||'#C9A96E';$('#evDT').value=ev.dt||'none';$('#evDV').value=ev.dv||0;$('#evOn').checked=!!ev.on;
  $('#evC').hidden=false;window.scrollTo({top:$('#evF').getBoundingClientRect().top+window.scrollY-100,behavior:SB()})})});
 $$('#evR [data-x]').forEach(function(b){b.addEventListener('click',function(){
  if(!confirm(T('cfm')))return;
  DB.events=DB.events.filter(function(x){return x.id!=b.getAttribute('data-x')});
  if(saveDB()){rEvR();applyEventTheme();applyPrices()}})})}
var PRLBL={flyer:['فلاير','Flyer'],poster:['بوستر A2','Poster A2'],roll:['رول أب — للقطعة','Roll-up — per unit'],card:['كارت','Card'],note:['ملزمة — للنسخة','Booklet — per copy'],ban:['بانر','Banner']};
function fillPrices(){
 $('#prPk1').value=DB.prices.pk[0];$('#prPk2').value=DB.prices.pk[1];$('#prPk3').value=DB.prices.pk[2];
 if($('#prBanM2'))$('#prBanM2').value=DB.prices.banM2!=null?DB.prices.banM2:210;
 var g=$('#prPrintG');if(!g)return;
 g.innerHTML=PRD.map(function(p){var lb=PRLBL[p.id]?bi(PRLBL[p.id]):p.id;
  return '<div><label class="fLb">'+esc(lb)+'</label><input class="aIn" type="number" step="0.01" min="0" id="prP_'+p.id+'" value="'+(DB.prices.print[p.id]!=null?DB.prices.print[p.id]:p.b)+'"></div>'}).join('')}
/* أدوات عامة لإدارة قوائم بسيطة (تشطيبات/مقاسات ورق/طرق تقفيل) */
function simpleRowR(containerId,list,fields){
 var g=$('#'+containerId);if(!g)return;
 g.innerHTML=(list||[]).map(function(it){
  var lbl=fields.label(it);
  return '<div class="rowI"><span class="mAv">'+esc((lbl||'?').charAt(0))+'</span><div class="rB"><b>'+esc(lbl)+(it.on?'':' <span style="color:var(--so)">— معطّل</span>')+'</b><small>'+esc(fields.sub(it))+'</small></div>'+
   '<div class="rBt"><button type="button" class="mB" data-e="'+esc(it.id)+'"><i class="fa-solid fa-pen"></i></button><button type="button" class="mB del" data-x="'+esc(it.id)+'"><i class="fa-solid fa-trash"></i></button></div></div>'
 }).join('')||'<p style="font-size:13px;color:var(--so)">—</p>'}
function rFinR(){
 simpleRowR('finAR',DB.finishes,{label:function(f){return f.na},sub:function(f){return '+'+f.price+' ج.م'+(f.ne?' · '+f.ne:'')}});
 $$('#finAR [data-e]').forEach(function(b){b.addEventListener('click',function(){
  var f=null;DB.finishes.forEach(function(x){if(x.id==b.getAttribute('data-e'))f=x});if(!f)return;
  $('#fnId').value=f.id;$('#fnNA').value=f.na||'';$('#fnNE').value=f.ne||'';$('#fnPrice').value=f.price||0;$('#fnOn').checked=!!f.on;$('#fnC').hidden=false})});
 $$('#finAR [data-x]').forEach(function(b){b.addEventListener('click',function(){
  if(!confirm(T('cfm')))return;
  DB.finishes=DB.finishes.filter(function(x){return x.id!=b.getAttribute('data-x')});
  if(saveDB()){rFinR();rPrB();calcP(false)}})})}
function rPapR(){
 simpleRowR('papAR',DB.paper,{label:function(p){return p.na},sub:function(p){return p.price+' ج.م / ورقة'}});
 $$('#papAR [data-e]').forEach(function(b){b.addEventListener('click',function(){
  var p=null;DB.paper.forEach(function(x){if(x.id==b.getAttribute('data-e'))p=x});if(!p)return;
  $('#ppId').value=p.id;$('#ppNA').value=p.na||'';$('#ppPrice').value=p.price||0;$('#ppOn').checked=!!p.on;$('#ppC').hidden=false})});
 $$('#papAR [data-x]').forEach(function(b){b.addEventListener('click',function(){
  if(!confirm(T('cfm')))return;
  DB.paper=DB.paper.filter(function(x){return x.id!=b.getAttribute('data-x')});
  if(saveDB()){rPapR();rPrB();calcP(false)}})})}
function rBindR(){
 simpleRowR('bdAR',DB.bind,{label:function(b){return b.na},sub:function(b){return b.price+' ج.م / نسخة'+(b.ne?' · '+b.ne:'')}});
 $$('#bdAR [data-e]').forEach(function(b){b.addEventListener('click',function(){
  var x0=null;DB.bind.forEach(function(x){if(x.id==b.getAttribute('data-e'))x0=x});if(!x0)return;
  $('#bdId').value=x0.id;$('#bdNA').value=x0.na||'';$('#bdNE').value=x0.ne||'';$('#bdPrice').value=x0.price||0;$('#bdOn').checked=!!x0.on;$('#bdC').hidden=false})});
 $$('#bdAR [data-x]').forEach(function(b){b.addEventListener('click',function(){
  if(!confirm(T('cfm')))return;
  DB.bind=DB.bind.filter(function(x){return x.id!=b.getAttribute('data-x')});
  if(saveDB()){rBindR();rPrB();calcP(false)}})})}
function fillContent(){
 var t=DB.txt;
 $('#txHkA').value=t.ar.h_kick||'';$('#txHkE').value=t.en.h_kick||'';
 $('#txT1A').value=t.ar.h_t1||'';$('#txT1E').value=t.en.h_t1||'';
 $('#txT2A').value=t.ar.h_t2||'';$('#txT2E').value=t.en.h_t2||'';
 $('#txSbA').value=t.ar.h_sub||'';$('#txSbE').value=t.en.h_sub||'';
 $('#txFtA').value=t.ar.ft_ab||'';$('#txFtE').value=t.en.ft_ab||'';
 $('#txCtA').value=t.ar.ct_p||'';$('#txCtE').value=t.en.ct_p||''}
function cImg(f,mx,cb){
 if(!f)return;
 if(!/^image\//.test(f.type||'')){toastMsg(lang=='ar'?'اختار ملف صورة':'Please choose an image file');return}
 var rd=new FileReader();
 rd.onerror=function(){toastMsg(lang=='ar'?'تعذّر قراءة الملف':'Could not read the file')};
 rd.onload=function(ev){var im=new Image();
  im.onerror=function(){toastMsg(lang=='ar'?'الصورة تالفة':'Invalid image')};
  im.onload=function(){var s=Math.min(1,mx/Math.max(im.width,im.height));
   var cv=document.createElement('canvas');cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);
   cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
   var d=cv.toDataURL('image/webp',.82);if(d.indexOf('data:image/webp')!==0)d=cv.toDataURL('image/jpeg',.85); /* Safari مابيدعمش webp */
   /* الصورة بتتخزن كملف على السيرفر ونرجّع رابطها (مش base64 جوه الداتا) */
   fetch('/api/upload',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:d})})
   .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
   .then(function(x){if(x.ok&&x.j.url)cb(x.j.url);else toastMsg((lang=='ar'?'فشل رفع الصورة: ':'Upload failed: ')+(x.j.message||x.j.error||''))})
   .catch(function(){toastMsg(lang=='ar'?'تعذّر رفع الصورة — تأكد من الاتصال':'Upload failed — check your connection')})};
  im.src=ev.target.result};
 rd.readAsDataURL(f)}
/* ══ الطلبات الواردة (لوحة الأدمن) — بنبني الـ DOM بـ textContent (آمن من XSS) ══ */
var LEAD_ST=[['new','جديد','New'],['confirmed','مؤكد','Confirmed'],['done','تم','Done'],['cancelled','ملغي','Cancelled']];
var LEAD_TY={contact:['تواصل','Contact'],booking:['حجز جلسة','Booking'],print:['طباعة','Print'],plan:['اشتراك منصة','Plan']};
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function rLeads(){
 var g=$('#ldR');if(!g||!window.fetch)return;
 fetch('/api/leads',{credentials:'same-origin'}).then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(j){
  g.textContent='';
  if(!j.leads.length){g.appendChild(mk('p','aSub',lang=='ar'?'مفيش طلبات لسه.':'No requests yet.'));return}
  j.leads.forEach(function(l){
   var row=mk('div','rowI ldRow'),b=mk('div','rB');
   var ty=LEAD_TY[l.type]||[l.type,l.type];
   var h=mk('b',null,(lang=='ar'?ty[0]:ty[1])+(l.name?' — '+l.name:''));b.appendChild(h);
   var meta=[new Date(l.t).toLocaleString(lang=='ar'?'ar-EG':'en-GB',{timeZone:'Africa/Cairo',dateStyle:'short',timeStyle:'short'})];
   if(l.type=='booking')meta.push(l.loc+' · '+l.date+' · '+l.slot);else if(l.service)meta.push(l.service);
   b.appendChild(mk('small',null,meta.join(' · ')));
   if(l.phone&&/^[0-9+]{8,16}$/.test(l.phone)){
    var a=mk('a','ldPh',l.phone);a.href='tel:'+l.phone;b.appendChild(a);
    var wl=mk('a','ldPh','WhatsApp');wl.target='_blank';wl.rel='noopener';
    wl.href='https://wa.me/'+(l.phone.charAt(0)=='+'?l.phone.slice(1):'2'+l.phone.replace(/^0/,'0'));b.appendChild(wl)}
   if(l.message){var d=mk('details','ldMsg');d.appendChild(mk('summary',null,lang=='ar'?'التفاصيل':'Details'));d.appendChild(mk('pre',null,l.message));b.appendChild(d)}
   var sel=mk('select','aIn ldSt');
   LEAD_ST.forEach(function(s){var o=mk('option',null,lang=='ar'?s[1]:s[2]);o.value=s[0];if(s[0]==l.status)o.selected=true;sel.appendChild(o)});
   sel.addEventListener('change',function(){
    fetch('/api/leads/'+encodeURIComponent(l.id),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:sel.value})})
    .then(function(r){toastMsg(r.ok?T('saved'):(lang=='ar'?'فشل التحديث':'Update failed'))}).catch(function(){toastMsg(lang=='ar'?'فشل التحديث':'Update failed')})});
   row.appendChild(b);row.appendChild(sel);g.appendChild(row)})
 }).catch(function(){g.textContent='';g.appendChild(mk('p','aSub',lang=='ar'?'تعذّر تحميل الطلبات.':'Could not load requests.'))})}
on('ldRef','click',rLeads);
function rTeR(){
 $('#teR').innerHTML=DB.teachers.map(function(t){
  return '<div class="rowI"><span class="mAv">'+esc((t.na||t.ne||'K').charAt(0))+'</span><div class="rB"><b>'+esc(t.na)+' — '+esc(t.sa||'')+'</b><small>'+esc(t.big||'')+' · '+esc(t.bca||'')+'</small></div><div class="rBt"><button type="button" class="mB" data-e="'+esc(t.id)+'"><i class="fa-solid fa-pen"></i></button><button type="button" class="mB del" data-x="'+esc(t.id)+'"><i class="fa-solid fa-trash"></i></button></div></div>'}).join('');
 $$('#teR [data-e]').forEach(function(b){b.addEventListener('click',function(){
  var t=null;DB.teachers.forEach(function(x){if(x.id==b.getAttribute('data-e'))t=x});
  if(!t)return;
  $('#teId').value=t.id;$('#teNA').value=t.na||'';$('#teNE').value=t.ne||'';$('#teSA').value=t.sa||'';$('#teSE').value=t.se||'';
  $('#teBig').value=t.big||'';$('#teBCa').value=t.bca||'';$('#teBCe').value=t.bce||'';
  $('#teM1').value=t.m1||'';$('#teM1a').value=t.m1a||'';$('#teM1e').value=t.m1e||'';
  $('#teM2').value=t.m2||'';$('#teM2a').value=t.m2a||'';$('#teM2e').value=t.m2e||'';
  $('#teFb').value=t.fb||'';$('#teYt').value=t.yt||'';$('#teC').hidden=false})});
 $$('#teR [data-x]').forEach(function(b){b.addEventListener('click',function(){
  if(!confirm(T('cfm')))return;
  DB.teachers=DB.teachers.filter(function(x){return x.id!=b.getAttribute('data-x')});
  if(saveDB()){refreshAll();rTeR()}})})}
function revEditable(){if(!DB.reviews||!DB.reviews.length)DB.reviews=RVS.map(function(r){var c={};for(var k in r)c[k]=r[k];c.id=uid();return c});return DB.reviews}
function rRvR(){
 var g=$('#rvR');if(!g)return;
 g.innerHTML=revList().map(function(r,i){
  return '<div class="rowI"><span class="mAv">'+esc((r.na||r.ne||'K').charAt(0))+'</span><div class="rB"><b>'+esc(r.na||r.ne)+' \u2014 '+esc(r.ra||'')+'</b><small>'+esc((r.ba||r.be||'').slice(0,80))+'</small></div><div class="rBt"><button type="button" data-rve="'+i+'" aria-label="edit"><i class="fa-solid fa-pen"></i></button><button type="button" data-rvx="'+i+'" aria-label="delete"><i class="fa-solid fa-trash"></i></button></div></div>'}).join('')}
function rWoR(){
 var g=$('#woR');if(!g)return;
 g.innerHTML=DB.works.length?DB.works.map(function(w){
  return '<div class="rowI"><span class="mAv" style="border-radius:9px">'+(safeImg(w.img)?'<img src="'+esc(safeImg(w.img))+'" style="width:100%;height:100%;object-fit:cover" alt="">':'<i class="fa-solid fa-play" style="font-size:12px"></i>')+'</span><div class="rB"><b>'+esc(w.ta)+'</b></div><div class="rBt"><button type="button" class="mB del" data-w="'+esc(w.id)+'"><i class="fa-solid fa-trash"></i></button></div></div>'}).join('')
  :'<p style="font-size:13px;color:var(--so)">—</p>';
 $$('#woR [data-w]').forEach(function(b){b.addEventListener('click',function(){
  if(!confirm(T('cfm')))return;
  DB.works=DB.works.filter(function(x){return x.id!=b.getAttribute('data-w')});
  if(saveDB()){refreshAll();rWoR()}})})}
function rSel(){
 var c=$('#woCat');if(!c)return;
 c.innerHTML=CATS.filter(function(x){return x[0]!='all'}).map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>'}).join('')}
function refreshAll(){
 try{rRes()}catch(e){}try{rWhy()}catch(e){}try{rSvc()}catch(e){}try{rFeat()}catch(e){}
 try{actC='all';rCats();rGrid()}catch(e){}try{rPk()}catch(e){}try{renderSeason()}catch(e){}try{rRv()}catch(e){}}
/* ══ on-page hook (for pending service, before/after) ══ */
window._onPage=function(r){
 if(r=='portfolio')setTimeout(initBA,50);
 if(r=='contact'&&pendingSvc){
  rCt();
  var o=$('#cfTy');
  for(var i=0;i<o.options.length;i++)if(o.options[i].text==pendingSvc){o.selectedIndex=i;break}
  toastMsg(T('svc_pick').replace('$',pendingSvc));pendingSvc=null}};
/* ══ hash backup (browser back/forward) ══ */
window.addEventListener('hashchange',function(){
 var r=location.hash.replace(/^#\/?/,'')||'home';
 if(!document.getElementById('p-'+r))r='home';
 var cur=document.querySelector('.page.act');
 if(!cur||cur.id!='p-'+r)nav(r)});
/* ══ wire up ══ */
on('thB','click',function(){setTheme(theme=='dark'?'light':'dark')});
on('seasonX','click',function(){SS.set(SK,'1');$('#seasonB').hidden=true});
['roiPrice','roiStu','roiLes'].forEach(function(id){on(id,'input',calcROI)});
on('roiWa','click',function(){
 var price=+$('#roiPrice').value,stu=+$('#roiStu').value,les=+$('#roiLes').value;
 var income=price*stu*les,net=income-PK_COST;
 wa(T('roi_msg').replace('{p}',price).replace('{s}',stu).replace('{i}',income.toLocaleString('en-US')).replace('{n}',net.toLocaleString('en-US')).replace('{k}',PK_COST.toLocaleString('en-US')));
 toastMsg(T('sent'))});
on('bkLoc','change',function(){curLoc=this.value;rLocT();rLocP();loadTaken()});
on('bkGo','click',function(){
 var n=$('#bkNm').value.trim(),ph=$('#bkPh').value.trim();
 if(!bkD||!bkS||bkDi<0){toastMsg(T('pick_day'));return}
 if(!n){$('#bkNm').focus();return}
 if(!normPhone(ph)){toastMsg(T('bad_ph'));$('#bkPh').focus();return}
 var s=STU.filter(function(x){return x.id==curLoc})[0];
 var dl=new Intl.DateTimeFormat(lang=='ar'?'ar-EG':'en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(bkD);
 var tp=lang=='ar'?(bkT==0?'آيفون':'كاميرا احترافية'):(bkT==0?'iPhone':'Pro camera');
 var msg='*'+T('bk_msg')+'*\n• '+T('loc_l')+': '+bi(s.na)+'\n• '+T('day_l')+': '+dl+'\n• '+T('time_l')+': '+bkS+'\n• '+T('type_l')+': '+tp+'\n• '+T('name_l')+': '+n+'\n• '+T('phone_l')+': '+ph;
 /* نفتح نافذة واتساب فورًا (جوه الضغطة) عشان المتصفح ما يحجبهاش، وبعدها نتأكد إن الميعاد لسه فاضي */
 var w=null;try{w=window.open('about:blank','_blank');if(w)w.opener=null}catch(e){}
 var btn=this;btn.disabled=true;
 lead('booking',{name:n,phone:ph,loc:curLoc,date:bkDs[bkDi],slot:bkS,setup:bkT==0?'iphone':'camera',message:msg}).then(function(r){
  btn.disabled=false;
  if(r.ok||r.status===0){openWa(msg,w);toastMsg(T('bk_ok'));if(r.ok)loadTaken()}
  else{
   try{if(w)w.close()}catch(e){}
   if(r.status==409){toastMsg(lang=='ar'?'الميعاد ده اتحجز لحد تاني — اختار معاد تاني':'That slot was just taken — please pick another');loadTaken()}
   else if(r.status==429)toastMsg(lang=='ar'?'محاولات كتير — جرّب بعد شوية':'Too many attempts — try again later');
   else toastMsg(lang=='ar'?'البيانات مش مظبوطة — راجع الاسم والرقم':'Please check your name and phone')}})});
on('plScroll','click',function(){var t=document.getElementById('plans');if(t)t.scrollIntoView({behavior:SB()})});
on('lbX','click',clLB);
on('lb','click',function(e){if(e.target.id=='lb')clLB()});
on('lbNx','click',function(){lbPos=(lbPos+1)%lbI.length;pbLB()});
on('lbPv','click',function(){lbPos=(lbPos-1+lbI.length)%lbI.length;pbLB()});
document.addEventListener('keydown',function(e){
 if(e.key=='Escape'){clLB();
  var mm=$('#mMenu');if(mm)mm.classList.remove('op');var bu=$('#bur');if(bu)bu.classList.remove('op');document.body.style.overflow=''}
 if($('#lb').classList.contains('op')){if(e.key=='ArrowLeft')$('#lbNx').click();if(e.key=='ArrowRight')$('#lbPv').click()}});
on('bur','click',function(){
 var o=!$('#mMenu').classList.contains('op');
 $('#bur').classList.toggle('op',o);$('#mMenu').classList.toggle('op',o);
 document.body.style.overflow=o?'hidden':''});
var tk=false;
window.addEventListener('scroll',function(){
 if(tk)return;tk=true;
 requestAnimationFrame(function(){$('#hdr').classList.toggle('scr',scrollY>50);tk=false})},{passive:true});
on('qtyR','input',function(){pc.q=snq(+this.value);calcP(false)});
on('edgeC','change',function(){pc.e=this.checked;calcP(true)});
on('banW','input',function(){calcP(true)});
on('banH','input',function(){calcP(true)});
on('ntPages','input',function(){calcP(true)});
on('ntCopies','input',function(){calcP(true)});
on('ntSize','change',function(){pc.ntSize=this.value;calcP(true)});
on('ntBind','change',function(){pc.ntBind=this.value;calcP(true)});
on('prWa','click',function(){
 var P=gP(pc.p);
 wa('*'+T('ord_msg')+'*\n• '+T('prod_l')+': '+(lang=='ar'?P.nm[0]:P.nm[1])+'\n• '+T('fin_l')+': '+finName()+'\n• '+T('qty_l')+': '+pc.q.toLocaleString('en-US')+'\n• '+T('est_l')+': '+pc.tot.toLocaleString('en-US')+' EGP','print',{service:(lang=='ar'?P.nm[0]:P.nm[1])});
 toastMsg(T('sent'))});
on('prCp','click',function(){try{navigator.clipboard.writeText($('#estT').textContent);toastMsg(T('copied'))}catch(e){toastMsg(T('copied'))}});
on('rvNx','click',function(){rvGo(rvI+1);rvA()});
on('rvPv','click',function(){rvGo(rvI-1);rvA()});
on('ctF','submit',function(e){
 e.preventDefault();
 var n=$('#cfNm').value.trim(),ph=$('#cfPh').value.trim();
 if(n.length<2){$('#cfNm').focus();return}
 if(!normPhone(ph)){toastMsg(T('bad_ph'));$('#cfPh').focus();return}
 try{if(window.trackEvent)trackEvent('lead_form_submit',{service:$('#cfTy').value})}catch(e){}
 wa('*'+T('req_msg')+'*\n• '+T('name_l')+': '+n+'\n• '+T('phone_l')+': '+ph+'\n• '+T('svc_l')+': '+$('#cfTy').value+'\n\n'+($('#cfMs').value.trim()||T('det_l')),'contact',{name:n,phone:ph,service:$('#cfTy').value,hp:($('#cfHp')||{}).value||''});
 toastMsg((lang=='ar'?'أهلاً ':'Hello ')+n.split(' ')[0]+' — '+T('sent'));
 this.reset();rCt()});
on('admGo','click',function(){
 var pw=$('#admP').value;if(!pw)return;
 fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})}).then(function(r){
  if(r.ok){ADM=true;$('#admP').value='';hydrateFromServer(true).then(function(){admUI();toastMsg(T('saved'))})}
  else if(r.status==429)toastMsg(lang=='ar'?'محاولات كتير — استنى شوية وجرّب تاني':'Too many attempts — try again later');
  else toastMsg(T('ad_pw'))
 }).catch(function(){toastMsg(lang=='ar'?'تعذّر الاتصال بالسيرفر':'Cannot reach the server')})});
on('admP','keydown',function(e){if(e.key=='Enter')$('#admGo').click()});
on('admOut','click',function(){
 fetch('/api/logout',{method:'POST',credentials:'same-origin'}).catch(function(){}).then(function(){ADM=false;admUI()})});
on('rvR','click',function(e){
 var be=e.target.closest?e.target.closest('[data-rve]'):null,bx=e.target.closest?e.target.closest('[data-rvx]'):null;
 if(be){var r=revList()[+be.getAttribute('data-rve')];if(!r)return;
  $('#rvId').value=r.id||'';$('#rvNA').value=r.na||'';$('#rvNE').value=r.ne||'';$('#rvRA').value=r.ra||'';$('#rvRE').value=r.re||'';$('#rvBA').value=r.ba||'';$('#rvBE').value=r.be||'';$('#rvC').hidden=false;$('#rvNA').focus();return}
 if(bx){if(!confirm(lang=='ar'?'تحذف الرأي ده؟':'Delete this testimonial?'))return;
  var L=revEditable();L.splice(+bx.getAttribute('data-rvx'),1);
  if(!L.length){DB.reviews=null;toastMsg(lang=='ar'?'رجعنا للآراء الافتراضية':'Back to default testimonials')}
  if(saveDB()){refreshAll();rRvR()}}});
on('rvC','click',function(){$('#rvId').value='';this.hidden=true;$('#rvF').reset()});
on('rvF','submit',function(e){
 e.preventDefault();
 var na=$('#rvNA').value.trim(),ba=$('#rvBA').value.trim();
 if(!na||!ba){toastMsg(lang=='ar'?'الاسم ونص الرأي مطلوبين':'Name and text are required');return}
 var L=revEditable(),id=$('#rvId').value;
 var o={id:id||uid(),na:na,ne:$('#rvNE').value.trim()||na,ra:$('#rvRA').value.trim(),re:$('#rvRE').value.trim(),ba:ba,be:$('#rvBE').value.trim()||ba};
 var found=false;L.forEach(function(x,i){if(id&&x.id==id){L[i]=o;found=true}});
 if(!found)L.push(o);
 if(saveDB()){$('#rvId').value='';$('#rvC').hidden=true;this.reset();refreshAll();rRvR();toastMsg(T('saved'))}});
on('admT','click',function(e){
 var b=e.target.closest?e.target.closest('[data-at]'):null;if(!b)return;
 $$('#admT .tab').forEach(function(x){x.classList.remove('on')});b.classList.add('on');
 $$('.aSec').forEach(function(s){s.classList.toggle('on',s.getAttribute('data-as')==b.getAttribute('data-at'))});if(b.getAttribute('data-at')=='leads')rLeads()});
on('saveSet','click',function(){
 DB.phone=$('#sPh').value.replace(/\D/g,'')||DEF.phone;
 DB.fb=$('#sFb').value.trim();DB.ig=$('#sIg').value.trim();DB.tt=$('#sTt').value.trim();
 if(saveDB()){applyLinks();toastMsg(T('saved'))}});
on('logoUp','click',function(){$('#logoF').click()});
on('logoF','change',function(e){
 cImg(e.target.files[0],420,function(d){DB.logo=d;
  if(saveDB()){paintBrand();fillSet();toastMsg(T('saved'))}})});
on('logoRm','click',function(){DB.logo=null;if(saveDB()){paintBrand();fillSet()}});
on('expB','click',function(){
 var b=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
 var a=document.createElement('a');a.href=URL.createObjectURL(b);
 a.download='kiro-backup.json';a.click()});
on('impB','click',function(){$('#impF').click()});
on('impF','change',function(e){
 var f=e.target.files[0];if(!f)return;
 var rd=new FileReader();
 rd.onload=function(ev){try{var o=JSON.parse(ev.target.result);
  if(!o||!Array.isArray(o.teachers)||!o.prices){toastMsg(lang=='ar'?'الملف مش نسخة صالحة من الموقع':'Not a valid site backup');return}
  if(!confirm(lang=='ar'?'هيتم استبدال كل بيانات الموقع الحالية بالنسخة دي. متأكد؟':'This replaces ALL current site data. Continue?'))return;
  o._v=DB._v;DB=ensureDefaults(o);if(saveDB()){refreshAll();admUI()}}catch(x){toastMsg(lang=='ar'?'الملف تالف أو مش JSON':'Invalid JSON file')}};
 rd.readAsText(f);e.target.value=''});
on('seasSave','click',function(){
 DB.season=$('#seasIn').value;
 if(saveDB()){renderSeason();toastMsg(T('seas_saved'))}});
on('seasRst','click',function(){
 DB.season='';$('#seasIn').value='';
 if(saveDB()){renderSeason();toastMsg(T('seas_auto'))}});
on('evC','click',function(){$('#evId').value='';this.hidden=true;$('#evF').reset();$('#evC1').value='#580E1A';$('#evC2').value='#C9A96E'});
on('evF','submit',function(e){
 e.preventDefault();
 var na=$('#evNA').value.trim();if(!na){toastMsg(T('ad_pw'));return}
 var start=$('#evStart').value,end=$('#evEnd').value;
 if(start&&end&&end<start){toastMsg(lang=='ar'?'تاريخ النهاية قبل البداية':'End date is before start date');return}
 var dv=Math.max(0,+$('#evDV').value||0);
 var id=$('#evId').value||('ev_'+Date.now());
 var obj={id:id,na:na,ne:$('#evNE').value.trim(),da:$('#evDA').value.trim(),de:$('#evDE').value.trim(),
  start:start,end:end,preset:$('#evPreset').value,prio:Math.max(0,+$('#evPrio').value||0),
  c1:$('#evC1').value,c2:$('#evC2').value,dt:$('#evDT').value,dv:dv,on:$('#evOn').checked};
 var i=DB.events.findIndex(function(x){return x.id==id});
 if(i>-1)DB.events[i]=obj;else DB.events.push(obj);
 if(saveDB()){rEvR();applyEventTheme();applyPrices();this.reset();$('#evId').value='';$('#evC').hidden=true;$('#evC1').value='#580E1A';$('#evC2').value='#C9A96E';toastMsg(T('saved'))}});
on('prSave','click',function(){
 DB.prices.pk=[+$('#prPk1').value||DEF.prices.pk[0],+$('#prPk2').value||DEF.prices.pk[1],+$('#prPk3').value||DEF.prices.pk[2]];
 PRD.forEach(function(p){var el=$('#prP_'+p.id);if(el&&el.value!=='')DB.prices.print[p.id]=+el.value});
 DB.prices.banM2=Math.max(0,+$('#prBanM2').value||0);
 if(saveDB()){applyPrices();calcP(false);calcROI();toastMsg(T('saved'))}});
on('fnC','click',function(){$('#fnId').value='';this.hidden=true;$('#finAF').reset()});
on('finAF','submit',function(e){
 e.preventDefault();
 var na=$('#fnNA').value.trim();if(!na)return;
 var id=$('#fnId').value||('fn_'+Date.now());
 var obj={id:id,na:na,ne:$('#fnNE').value.trim(),price:Math.max(0,+$('#fnPrice').value||0),on:$('#fnOn').checked};
 var i=DB.finishes.findIndex(function(x){return x.id==id});
 if(i>-1)DB.finishes[i]=obj;else DB.finishes.push(obj);
 if(saveDB()){rFinR();rPrB();calcP(false);this.reset();$('#fnId').value='';$('#fnC').hidden=true;toastMsg(T('saved'))}});
on('ppC','click',function(){$('#ppId').value='';this.hidden=true;$('#papAF').reset()});
on('papAF','submit',function(e){
 e.preventDefault();
 var na=$('#ppNA').value.trim();if(!na)return;
 var id=$('#ppId').value||('pp_'+Date.now());
 var obj={id:id,na:na,price:Math.max(0,+$('#ppPrice').value||0),on:$('#ppOn').checked};
 var i=DB.paper.findIndex(function(x){return x.id==id});
 if(i>-1)DB.paper[i]=obj;else DB.paper.push(obj);
 if(saveDB()){rPapR();rPrB();calcP(false);this.reset();$('#ppId').value='';$('#ppC').hidden=true;toastMsg(T('saved'))}});
on('bdC','click',function(){$('#bdId').value='';this.hidden=true;$('#bdAF').reset()});
on('bdAF','submit',function(e){
 e.preventDefault();
 var na=$('#bdNA').value.trim();if(!na)return;
 var id=$('#bdId').value||('bd_'+Date.now());
 var obj={id:id,na:na,ne:$('#bdNE').value.trim(),price:Math.max(0,+$('#bdPrice').value||0),on:$('#bdOn').checked};
 var i=DB.bind.findIndex(function(x){return x.id==id});
 if(i>-1)DB.bind[i]=obj;else DB.bind.push(obj);
 if(saveDB()){rBindR();rPrB();calcP(false);this.reset();$('#bdId').value='';$('#bdC').hidden=true;toastMsg(T('saved'))}});
on('ctxSave','click',function(){
 DB.txt.ar.h_kick=$('#txHkA').value.trim();DB.txt.en.h_kick=$('#txHkE').value.trim();
 DB.txt.ar.h_t1=$('#txT1A').value.trim();DB.txt.en.h_t1=$('#txT1E').value.trim();
 DB.txt.ar.h_t2=$('#txT2A').value.trim();DB.txt.en.h_t2=$('#txT2E').value.trim();
 DB.txt.ar.h_sub=$('#txSbA').value.trim();DB.txt.en.h_sub=$('#txSbE').value.trim();
 DB.txt.ar.ft_ab=$('#txFtA').value.trim();DB.txt.en.ft_ab=$('#txFtE').value.trim();
 DB.txt.ar.ct_p=$('#txCtA').value.trim();DB.txt.en.ct_p=$('#txCtE').value.trim();
 if(saveDB()){applyStatic();toastMsg(T('saved'))}});
on('teC','click',function(){$('#teId').value='';this.hidden=true;$('#teF').reset()});
on('teF','submit',function(e){
 e.preventDefault();
 var na=$('#teNA').value.trim()||$('#teNE').value.trim();
 if(!na){$('#teNA').focus();return}
 var o={id:$('#teId').value||uid(),na:na,ne:$('#teNE').value.trim()||na,sa:$('#teSA').value.trim(),se:$('#teSE').value.trim(),
  big:$('#teBig').value.trim(),bca:$('#teBCa').value.trim(),bce:$('#teBCe').value.trim(),
  m1:$('#teM1').value.trim(),m1a:$('#teM1a').value.trim(),m1e:$('#teM1e').value.trim(),
  m2:$('#teM2').value.trim(),m2a:$('#teM2a').value.trim(),m2e:$('#teM2e').value.trim(),
  fb:$('#teFb').value.trim(),yt:$('#teYt').value.trim()};
 var ix=-1;DB.teachers.forEach(function(x,i){if(x.id==o.id)ix=i});
 if(ix>-1)DB.teachers[ix]=o;else DB.teachers.unshift(o);
 $('#teId').value='';$('#teC').hidden=true;this.reset();
 if(saveDB()){refreshAll();rTeR()}});
on('woZ','click',function(){$('#woFl').click()});
on('woFl','change',function(e){
 cImg(e.target.files[0],1100,function(d){
  window._woImg=d;
  $('#woPv').src=d;$('#woPv').hidden=false;
  $('#woZ').innerHTML='<i class="fa-solid fa-circle-check" style="color:var(--gd)"></i> ✔'})});
window._woImg=null;
on('woCl','click',function(){this.form.reset();window._woImg=null;$('#woPv').hidden=true});
on('woF','submit',function(e){
 e.preventDefault();
 var ta=$('#woTA').value.trim(),te=$('#woTE').value.trim();
 if(!ta&&!te){$('#woTA').focus();return}
 DB.works.unshift({id:uid(),c:$('#woCat').value||'social',ta:ta||te,te:te||ta,da:$('#woDA').value.trim(),de:$('#woDE').value.trim(),img:window._woImg||'',video:$('#woVid').value.trim()});
 this.reset();window._woImg=null;$('#woPv').hidden=true;
 if(saveDB()){refreshAll();rWoR()}});
on('lgB','click',function(){
 lang=lang=='ar'?'en':'ar';LS.set(LK,lang);
 try{applyStatic()}catch(e){}
 try{refreshAll()}catch(e){}
 try{rLocT();rLocP();rDev();rBk();rPlat();rRv();rCt();applyPrices();rPrB();calcP(false);calcROI();applyLinks()}catch(e){}});
/* hero tilt — بيشتغل بس وقت حركة الماوس وبيقف لما يستقر */
(function(){
 var st=document.getElementById('stage');if(!st||REDUCED)return;
 var ps=$$('.tilt > div',st),tl=$('.tilt',st),tx=0,ty=0,cx=0,cy=0,rc=null;
 var wake=rafLoop(st,function(dt){
  var k=1-Math.pow(1-.07,dt);cx+=(tx-cx)*k;cy+=(ty-cy)*k;
  if(tl)tl.style.transform='rotateX('+(-cy*6).toFixed(2)+'deg) rotateY('+(cx*9).toFixed(2)+'deg)';
  ps.forEach(function(el){var d=+el.getAttribute('data-d')||8;el.style.translate=(cx*-d).toFixed(1)+'px '+(cy*-d).toFixed(1)+'px'});
  if(Math.abs(tx-cx)<.0005&&Math.abs(ty-cy)<.0005)return false});
 st.addEventListener('mouseenter',function(){rc=st.getBoundingClientRect()});
 st.addEventListener('mousemove',function(e){var r=rc||(rc=st.getBoundingClientRect());tx=((e.clientX-r.left)/r.width)-.5;ty=((e.clientY-r.top)/r.height)-.5;wake()});
 st.addEventListener('mouseleave',function(){tx=0;ty=0;rc=null;wake()})})();
/* ══ BOOT — كل خطوة محمية ══ */
(function(){
 try{setTheme(theme)}catch(e){}
 renderEverything();
 try{initBA()}catch(e){}
 /* فتح الصفحة المطلوبة من الـ URL (لو محفوظ لينك) */
 try{
  var r=location.hash.replace(/^#\/?/,'')||'home';
  if(r&&r!='home')nav(r);
 }catch(e){}
 /* لو فيه باك اند شغال، نجيب أحدث نسخة من البيانات المشتركة */
 try{hydrateFromServer()}catch(e){}
 try{if(window.fetch)fetch('/api/session',{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(j){if(j&&j.admin){ADM=true;admUI()}}).catch(function(){})}catch(e){}
})();

/* تسجيل الـService Worker (PWA) */
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}
