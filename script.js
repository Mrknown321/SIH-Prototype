(function(){
"use strict";

/* ================================================================
   INTRO VIDEO — edit this one line to show your video on the Home page.
   Paste a YouTube link (any format) or a direct .mp4 file URL.
   Leave it as "" to keep showing the empty placeholder.
   Example: var INTRO_VIDEO_URL = "https://youtu.be/dQw4w9WgXcQ";
   ================================================================ */
var INTRO_VIDEO_URL = "";

var centres = [
  {name:"Karnal Mandi", distance:2.4, distanceLabel:"4.2 km", queue:14, wait:42, price:"₹2,275/qtl", crowd:"High", crop:"Wheat"},
  {name:"Kaithal Yard", distance:9.8, distanceLabel:"9.8 km", queue:5, wait:18, price:"₹2,260/qtl", crowd:"Low", crop:"Wheat"},
  {name:"Panipat Grain Market", distance:12.1, distanceLabel:"12.1 km", queue:9, wait:29, price:"₹2,280/qtl", crowd:"Medium", crop:"Mustard"},
  {name:"Rohtak Centre 2", distance:15.6, distanceLabel:"15.6 km", queue:2, wait:8, price:"₹2,255/qtl", crowd:"Low", crop:"Bajra"},
  {name:"Assandh Yard", distance:6.7, distanceLabel:"6.7 km", queue:11, wait:34, price:"₹2,270/qtl", crowd:"Medium", crop:"Paddy"}
];

var prices = [
  {crop:"Wheat", msp:"₹2,275/qtl", market:"₹2,310/qtl", up:true},
  {crop:"Mustard", msp:"₹5,650/qtl", market:"₹5,600/qtl", up:false},
  {crop:"Bajra", msp:"₹2,500/qtl", market:"₹2,540/qtl", up:true},
  {crop:"Paddy", msp:"₹2,300/qtl", market:"₹2,290/qtl", up:false}
];

var payments = [
  {token:"#A241", crop:"Wheat", qty:"42 qtl", amount:"₹95,550", centre:"Karnal Mandi", status:"Paid"},
  {token:"#A198", crop:"Mustard", qty:"18 qtl", amount:"₹1,01,700", centre:"Panipat Grain Market", status:"Processing"},
  {token:"#A177", crop:"Bajra", qty:"30 qtl", amount:"₹75,000", centre:"Rohtak Centre 2", status:"Paid"}
];

var i18n = {
  en:{ "nav.home":"Home","nav.centres":"Find a centre","nav.token":"My token","nav.prices":"Prices","nav.payments":"Payments","nav.profile":"Profile","nav.ai":"How AI works","nav.video":"Video","home.hello":"Namaste, Ramesh" },
  hi:{ "nav.home":"होम","nav.centres":"केंद्र खोजें","nav.token":"मेरा टोकन","nav.prices":"भाव","nav.payments":"भुगतान","nav.profile":"प्रोफ़ाइल","nav.ai":"AI कैसे काम करता है","nav.video":"वीडियो","home.hello":"नमस्ते, रमेश" }
};

var titles = {
  home:["Home","Wednesday, 18 September"],
  centres:["Find a centre","Compare queue, distance and price"],
  token:["My token","Live status of your current token"],
  prices:["Today's prices","MSP and market price, side by side"],
  payments:["Payments","Receipts and payment status"],
  profile:["Profile","Your details on file"],
  ai:["How AI works","Why the app recommends what it recommends"],
  video:["Video","Add a walkthrough of the website"]
};

var activeToken = null; // {num, centre, crop, queue, wait}
var queueTimer = null;

/* ---------- View switching ---------- */
function showView(name){
  document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('active'); });
  var target = document.getElementById('view-'+name);
  if(target) target.classList.add('active');
  document.querySelectorAll('.side-link').forEach(function(l){ l.classList.remove('active'); });
  document.querySelectorAll('.side-link[data-view="'+name+'"]').forEach(function(l){ l.classList.add('active'); });
  document.getElementById('pageTitle').textContent = titles[name][0];
  document.getElementById('pageSub').textContent = titles[name][1];
  closeSidebar();
  window.scrollTo(0,0);
}
document.querySelectorAll('[data-view]').forEach(function(el){
  el.addEventListener('click', function(){ showView(el.dataset.view); });
});

/* ---------- Mobile sidebar ---------- */
var sidebar = document.getElementById('sidebar');
var overlay = document.getElementById('sideOverlay');
function openSidebar(){ sidebar.classList.add('open'); overlay.classList.add('show'); }
function closeSidebar(){ sidebar.classList.remove('open'); overlay.classList.remove('show'); }
document.getElementById('menuBtn').addEventListener('click', openSidebar);
overlay.addEventListener('click', closeSidebar);

/* ---------- Language toggle ---------- */
function setLang(lang){
  document.getElementById('langEn').classList.toggle('active', lang==='en');
  document.getElementById('langHi').classList.toggle('active', lang==='hi');
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key = el.dataset.i18n;
    if(i18n[lang][key]) el.textContent = i18n[lang][key];
  });
}
document.getElementById('langEn').addEventListener('click', function(){ setLang('en'); });
document.getElementById('langHi').addEventListener('click', function(){ setLang('hi'); });

/* ---------- Render centre row ---------- */
function crowdBadge(level){
  var cls = level==='Low' ? 'badge-low' : level==='Medium' ? 'badge-med' : 'badge-high';
  return '<span class="badge '+cls+'">'+level+' crowd</span>';
}
function renderCentreRow(c, idx){
  return '' +
  '<div class="centre-row">' +
    '<div>' +
      '<div class="centre-name">'+c.name+'</div>' +
      '<div class="centre-meta">'+c.distanceLabel+' away · '+c.crop+' · '+crowdBadge(c.crowd)+'</div>' +
    '</div>' +
    '<div class="metric"><b>'+c.queue+'</b><span>ahead</span></div>' +
    '<div class="metric"><b>'+c.wait+'m</b><span>wait</span></div>' +
    '<div class="metric" style="text-align:right;">' +
      '<b style="font-size:14px;">'+c.price+'</b>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:6px;" onclick="window.__getToken('+idx+')">Get token</button>' +
      '<div style="margin-top:6px;"><button class="link-btn" onclick="window.__explainCentre('+idx+')">Why this centre?</button></div>' +
    '</div>' +
  '</div>';
}
function renderCentreLists(){
  var sorted = centres.slice().sort(function(a,b){ return a.distance-b.distance; });
  document.getElementById('homeCentreList').innerHTML = sorted.slice(0,2).map(function(c){
    var idx = centres.indexOf(c);
    return renderCentreRow(c, idx);
  }).join('');
  applyCentreFilters();
}
function applyCentreFilters(){
  var crop = document.getElementById('cropFilter').value;
  var sort = document.getElementById('sortFilter').value;
  var list = centres.filter(function(c){ return crop==='all' || c.crop===crop; });
  if(sort==='distance') list.sort(function(a,b){ return a.distance-b.distance; });
  else if(sort==='wait') list.sort(function(a,b){ return a.wait-b.wait; });
  else if(sort==='price') list.sort(function(a,b){ return parseInt(a.price.replace(/\D/g,'')) - parseInt(b.price.replace(/\D/g,'')); });
  else list.sort(function(a,b){ return (a.queue+a.distance) - (b.queue+b.distance); });
  document.getElementById('fullCentreList').innerHTML = list.map(function(c){
    return renderCentreRow(c, centres.indexOf(c));
  }).join('');
}
document.getElementById('cropFilter').addEventListener('change', applyCentreFilters);
document.getElementById('sortFilter').addEventListener('change', applyCentreFilters);

/* ---------- Token flow ---------- */
window.__getToken = function(idx){
  var c = centres[idx];
  var tokenNum = 100 + Math.floor(Math.random()*800);
  activeToken = { num: tokenNum, centre: c.name, crop: c.crop, queue: c.queue, startQueue: c.queue, wait: c.wait };
  renderTicket();
  renderHomeToken();
  showView('token');
};

function renderTicket(){
  if(!activeToken){
    document.getElementById('tokenEmptyState').style.display = 'block';
    document.getElementById('ticketBox').style.display = 'none';
    return;
  }
  document.getElementById('tokenEmptyState').style.display = 'none';
  document.getElementById('ticketBox').style.display = 'block';
  document.getElementById('ticketNum').textContent = '#'+activeToken.num;
  document.getElementById('ticketCentreShort').textContent = '#'+activeToken.num;
  document.getElementById('ticketCentre').textContent = activeToken.centre;
  document.getElementById('ticketCrop').textContent = activeToken.crop;
  document.getElementById('ticketQueue').textContent = activeToken.queue + ' farmers';

  var now = new Date();
  var leave = new Date(now.getTime() + Math.max(activeToken.wait-15,4)*60000);
  var hh = leave.getHours()%12 || 12;
  var mm = leave.getMinutes().toString().padStart(2,'0');
  var ampm = leave.getHours()>=12 ? 'PM':'AM';
  document.getElementById('ticketLeave').textContent = hh+':'+mm+' '+ampm;

  var pct = Math.max(0, Math.round((activeToken.queue/activeToken.startQueue)*100));
  document.getElementById('queueBarFill').style.width = pct+'%';

  var alertBox = document.getElementById('leaveAlert');
  if(activeToken.queue<=0){
    alertBox.innerHTML = '<span>✓</span><span>It\'s your turn — please head to the weighing counter.</span>';
  } else {
    alertBox.innerHTML = '<span>⏱</span><span>Your queue position updates automatically — this is a live demo, so it moves on its own every few seconds.</span>';
  }
}

function renderHomeToken(){
  var box = document.getElementById('homeTokenBox');
  if(!activeToken){
    box.innerHTML = '<div class="empty-state">You don\'t have a token right now.<div style="margin-top:12px;"><button class="btn btn-primary btn-sm" data-view="centres">Find a centre</button></div></div>';
    box.querySelector('[data-view]').addEventListener('click', function(){ showView('centres'); });
    return;
  }
  box.innerHTML = '' +
    '<div class="token-mini">' +
      '<div class="num">#'+activeToken.num+'</div>' +
      '<div style="flex:1;">' +
        '<div style="font-weight:600;">'+activeToken.centre+'</div>' +
        '<div style="font-size:12.5px; color:var(--ink-faint);">'+activeToken.crop+' · '+activeToken.queue+' farmers ahead</div>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" data-view="token">View</button>' +
    '</div>';
  box.querySelector('[data-view]').addEventListener('click', function(){ showView('token'); });
}

document.getElementById('cancelTokenBtn').addEventListener('click', function(){
  activeToken = null;
  renderTicket();
  renderHomeToken();
});

/* Simulate the queue moving, purely for the demo */
setInterval(function(){
  if(activeToken && activeToken.queue>0){
    activeToken.queue -= 1;
    renderTicket();
    renderHomeToken();
  }
}, 4000);

/* ---------- Prices table ---------- */
document.getElementById('pricesTableBody').innerHTML = prices.map(function(p){
  return '<tr><td class="strong">'+p.crop+'</td><td>'+p.msp+'</td><td>'+p.market+'</td>' +
    '<td class="'+(p.up?'trend-up':'trend-down')+'">'+(p.up?'▲ up':'▼ down')+'</td></tr>';
}).join('');

/* ---------- Payments table ---------- */
document.getElementById('paymentsTableBody').innerHTML = payments.map(function(p, i){
  var badge = p.status==='Paid' ? 'badge-paid' : 'badge-processing';
  return '<tr class="clickable" onclick="window.__openReceipt('+i+')">' +
    '<td class="strong">'+p.token+'</td><td>'+p.crop+'</td><td>'+p.qty+'</td><td>'+p.amount+'</td>' +
    '<td><span class="badge '+badge+'">'+p.status+'</span></td></tr>';
}).join('');

window.__openReceipt = function(i){
  var p = payments[i];
  document.getElementById('modalContent').innerHTML = '' +
    '<div class="section-label">Digital receipt</div>' +
    '<h3 style="font-size:20px; margin-bottom:14px;">'+p.token+'</h3>' +
    '<div class="field" style="margin-bottom:10px;"><span>Crop &amp; quantity</span><b>'+p.crop+' · '+p.qty+'</b></div>' +
    '<div class="field" style="margin-bottom:10px;"><span>Centre</span><b>'+p.centre+'</b></div>' +
    '<div class="field" style="margin-bottom:10px;"><span>Amount</span><b>'+p.amount+'</b></div>' +
    '<div class="field" style="margin-bottom:0;"><span>Status</span><b>'+p.status+'</b></div>';
  document.getElementById('receiptModal').classList.add('show');
};
document.getElementById('modalClose').addEventListener('click', function(){
  document.getElementById('receiptModal').classList.remove('show');
});
document.getElementById('receiptModal').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('show');
});

/* ---------- AI scoring (explainability) ---------- */
var weights = { queue:0.35, distance:0.25, price:0.25, reliability:0.15 };

function crowdToReliability(level){
  return level==='Low' ? 0.9 : level==='Medium' ? 0.6 : 0.35;
}
function priceValue(str){ return parseInt(str.replace(/\D/g,''),10); }

function scoreCentre(c){
  var maxQueue = Math.max.apply(null, centres.map(function(x){ return x.queue; }));
  var maxDist = Math.max.apply(null, centres.map(function(x){ return x.distance; }));
  var prices2 = centres.map(function(x){ return priceValue(x.price); });
  var minPrice = Math.min.apply(null, prices2), maxPrice = Math.max.apply(null, prices2);

  var queueScore = 1 - (c.queue / maxQueue);
  var distScore = 1 - (c.distance / maxDist);
  var priceScore = maxPrice===minPrice ? 1 : (priceValue(c.price)-minPrice) / (maxPrice-minPrice);
  var relScore = crowdToReliability(c.crowd);

  return {
    queue: queueScore, distance: distScore, price: priceScore, reliability: relScore,
    total: Math.round((queueScore*weights.queue + distScore*weights.distance + priceScore*weights.price + relScore*weights.reliability) * 100)
  };
}

function explainRowsHtml(c){
  var s = scoreCentre(c);
  var rows = [
    { key:'queue', label:'Queue length', why: c.queue+' farmers waiting — fewer is better.' },
    { key:'distance', label:'Distance', why: c.distanceLabel+' from you — closer is better.' },
    { key:'price', label:'Price offered', why: c.price+' — higher is better.' },
    { key:'reliability', label:'Centre reliability', why: c.crowd+' crowd levels recently.' }
  ];
  var html = rows.map(function(r){
    var pct = Math.round(s[r.key]*100);
    return '' +
    '<div class="score-row">' +
      '<div class="score-row-head"><span>'+r.label+' <span style="color:var(--ink-faint);">('+Math.round(weights[r.key]*100)+'% of the score)</span></span><b>'+pct+'/100</b></div>' +
      '<div class="score-track"><div class="score-fill" style="width:'+pct+'%;"></div></div>' +
      '<div class="score-why">'+r.why+'</div>' +
    '</div>';
  }).join('');
  return [html, s];
}

function renderExplain(idx, container){
  var c = centres[idx];
  var s = scoreCentre(c);
  var rowsHtml = explainRowsHtml(c)[0];
  container.innerHTML = '' +
    '<div class="score-total"><span class="big">'+s.total+'</span><span class="sub">match score for '+c.name+', out of 100</span></div>' +
    rowsHtml;
}

function populateAiSelect(){
  var sel = document.getElementById('aiCentreSelect');
  sel.innerHTML = centres.map(function(c,i){ return '<option value="'+i+'">'+c.name+'</option>'; }).join('');
  sel.addEventListener('change', function(){
    renderExplain(parseInt(sel.value,10), document.getElementById('aiExplainBox'));
  });
  renderExplain(0, document.getElementById('aiExplainBox'));
}

window.__explainCentre = function(idx){
  var c = centres[idx];
  var s = scoreCentre(c);
  var rowsHtml = explainRowsHtml(c)[0];
  document.getElementById('modalContent').innerHTML = '' +
    '<div class="section-label">Why we suggest this centre</div>' +
    '<h3 style="font-size:19px; margin-bottom:14px;">'+c.name+'</h3>' +
    '<div class="score-total"><span class="big">'+s.total+'</span><span class="sub">match score, out of 100</span></div>' +
    rowsHtml;
  document.getElementById('receiptModal').classList.add('show');
};

/* ---------- Video controls ---------- */
function toEmbedUrl(url){
  try{
    var m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
    if(m && m[1]) return 'https://www.youtube.com/embed/' + m[1];
  }catch(e){}
  return null;
}

function renderIntroVideo(){
  var frame = document.getElementById('introVideoFrame');
  if(!INTRO_VIDEO_URL) return; // keeps the placeholder shown
  var yt = toEmbedUrl(INTRO_VIDEO_URL);
  if(yt){
    frame.innerHTML = '<iframe src="'+yt+'" title="KisanSetu intro" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  } else {
    frame.innerHTML = '<video src="'+INTRO_VIDEO_URL+'" controls playsinline></video>';
  }
}

var videoFrame = document.getElementById('videoFrame');
document.getElementById('ytBtn').addEventListener('click', function(){
  var val = document.getElementById('ytInput').value.trim();
  if(!val) return;
  var embed = toEmbedUrl(val);
  if(embed){
    videoFrame.innerHTML = '<iframe src="'+embed+'" title="KisanSetu walkthrough" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  }
});
document.getElementById('fileInput').addEventListener('change', function(e){
  var file = e.target.files && e.target.files[0];
  if(!file) return;
  var url = URL.createObjectURL(file);
  videoFrame.innerHTML = '<video src="'+url+'" controls playsinline></video>';
});

/* ---------- Init ---------- */
renderCentreLists();
renderHomeToken();
populateAiSelect();
renderIntroVideo();

})();