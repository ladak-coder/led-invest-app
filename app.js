// LED Invest — app ao vivo (Firebase Realtime Database: /led/rapido e /led/historico)
const $ = id => document.getElementById(id);
const fmt = (v, d = 2) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = v => 'US$ ' + fmt(v); const sg = v => (v >= 0 ? '+' : '') + fmt(v);
const SKIN = ['#f1c9a5', '#d9a57b', '#b5784f', '#8a5534', '#e8b98f', '#6b3f26'], HAIR = ['#2b1d14', '#5a3a22', '#c9a063', '#1b1b1b', '#8e4a2a', '#d8d2c4'];
const SH = { Ouro: ['#d9a94a', '#c48c2c', '#e6bf6a'], Global: ['#5aa2d6', '#3f86bd', '#7db9e3'] };
function face(seed, shirt, mood) {
  const sk = SKIN[seed % 6], hr = HAIR[(seed >> 3) % 6], st = (seed >> 5) % 3;
  const hair = st === 0 ? `<path d='M10 22 Q10 8 22 8 Q34 8 34 22 Q30 14 22 14 Q14 14 10 22Z' fill='${hr}'/>` : st === 1 ? `<path d='M9 26 Q8 7 22 7 Q36 7 35 26 L32 26 Q32 15 22 14 Q12 15 12 26Z' fill='${hr}'/>` : `<circle cx='22' cy='11' r='7' fill='${hr}'/><path d='M11 21 Q11 10 22 10 Q33 10 33 21 Q28 15 22 15 Q16 15 11 21Z' fill='${hr}'/>`;
  const m = mood > 0 ? `<path d='M18 26 Q22 30 26 26' stroke='#3b2416' stroke-width='1.6' fill='none' stroke-linecap='round'/>` : mood < 0 ? `<path d='M18 28 Q22 25 26 28' stroke='#3b2416' stroke-width='1.6' fill='none' stroke-linecap='round'/>` : `<path d='M19 27 H25' stroke='#3b2416' stroke-width='1.6' stroke-linecap='round'/>`;
  return `<svg viewBox='0 0 44 44' aria-hidden='true'><rect width='44' height='44' fill='#243042'/><path d='M6 44 Q8 33 22 33 Q36 33 38 44Z' fill='${shirt}'/><rect x='19' y='28' width='6' height='6' fill='${sk}'/><circle cx='22' cy='21' r='10' fill='${sk}'/>${hair}<circle cx='18.5' cy='21' r='1.4' fill='#1b1b1b'/><circle cx='25.5' cy='21' r='1.4' fill='#1b1b1b'/>${m}</svg>`;
}
function deskHTML(a, i) {
  return `<article class="desk idle" id="d${i}"><div class="hd"><div class="face" id="f${i}">${face(i * 7919, SH[a.m][i % 3], 0)}</div><div class="who"><b>${a.p}</b><small title="${a.d}">${a.n} · ${a.d}</small></div><span class="chip">${a.s}</span></div><div class="st" id="s${i}">procurando setup</div><div class="meta"><div class="row"><span id="m${i}">mês +0,00</span><span>meta ${META[a.n] > 0 ? '+' + fmt(META[a.n]) + '%' : '—'}</span></div><div class="mbar"><i id="b${i}" style="width:0"></i></div><div class="row"><span id="t${i}">total +0,00</span><span id="w${i}">0 op</span></div></div></article>`;
}
$('mOuro').innerHTML = AG.map((a, i) => a.m === 'Ouro' ? deskHTML(a, i) : '').join('');
$('mGlobal').innerHTML = AG.map((a, i) => a.m === 'Global' ? deskHTML(a, i) : '').join('');
const BOSS = [{ id: 'risco', p: 'Helena', c: 'Gestora de Risco', cor: '#e0645c' }, { id: 'perf', p: 'Marcos', c: 'Analista de Performance', cor: '#9b8cf0' }, { id: 'tes', p: 'Paulo', c: 'Tesoureiro', cor: '#3fbf7f' }];
$('board').innerHTML = BOSS.map((b, k) => `<article class="boss"><div class="hd"><div class="face">${face(101 + k * 37, b.cor, 1)}</div><div class="who"><b>${b.p}</b><small>${b.c}</small></div><span class="sev ok" id="b_${b.id}_sev">ok</span></div><div class="msg" id="b_${b.id}">—</div></article>`).join('');


let R = null, Hh = null, lastKey = null, BRL = null;
async function dolar() { try { const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' }); const j = await r.json(); BRL = parseFloat(j.USDBRL.bid); render(); } catch (e) { } }
dolar(); setInterval(dolar, 60000);
function pop(i, v) {
  const el = $('d' + i); if (!el) return; const p = document.createElement('span'); p.className = 'pop ' + (v >= 0 ? 'pos' : 'neg'); p.textContent = sg(v); el.appendChild(p);
  el.classList.add(v >= 0 ? 'flash-w' : 'flash-l'); setTimeout(() => { p.remove(); el.classList.remove('flash-w', 'flash-l'); }, 1600);
}
function agData(i) {
  const n = AG[i].n, h = (Hh && Hh.agentes && Hh.agentes[n]) || {};
  const pos = R && R.pos ? Object.values(R.pos).find(p => p.a === n) : null;
  return { pos, mpct: h.mes_pct || 0, musd: h.mes_usd || 0, tusd: h.tot_usd || 0, n: h.n || 0, acerto: h.acerto || 0, last: h.ultimo ?? null };
}
function upDesk(a) {
  const el = $('d' + a), A = AG[a], g = agData(a), pos = g.pos, mt = META[A.n] || 0;
  el.classList.remove('idle', 'buy', 'sell');
  if (pos) { el.classList.add(pos.lado > 0 ? 'buy' : 'sell'); $('s' + a).innerHTML = `<b>${pos.lado > 0 ? 'COMPRADO' : 'VENDIDO'}</b> ${fmt(pos.lote)} @ ${fmt(pos.preco, A.s === 'USDJPY' ? 3 : 2)} · <span class="${pos.lucro >= 0 ? 'pos' : 'neg'}">${sg(pos.lucro)}</span><br>desde ${pos.desde}`; }
  else { el.classList.add('idle'); $('s' + a).innerHTML = g.last == null ? 'procurando setup' : `procurando setup<br>última: <span class="${g.last >= 0 ? 'pos' : 'neg'}">${sg(g.last)}</span>`; }
  $('m' + a).innerHTML = `mês <span class="${g.musd >= 0 ? 'pos' : 'neg'}">${sg(g.musd)} (${sg(g.mpct)}%)</span>`;
  const bi = $('b' + a); bi.style.width = (mt > 0 ? Math.min(100, 100 * Math.abs(g.mpct) / mt) : (g.mpct < 0 ? 100 : 0)) + '%'; bi.className = g.mpct < 0 ? 'neg' : '';
  $('t' + a).innerHTML = `total <span class="${g.tusd >= 0 ? 'pos' : 'neg'}">${sg(g.tusd)}</span>`;
  $('w' + a).textContent = `${g.n} op · ${Math.round(g.acerto)}%`;
  const mood = g.mpct >= mt && mt > 0 ? 1 : g.mpct < 0 ? -1 : 0;
  if (el.dataset.mood !== String(mood)) { el.dataset.mood = mood; $('f' + a).innerHTML = face(a * 7919, SH[A.m][a % 3], mood); }
}
function render() {
  if (!R || !Hh) return;
  const idade = (Date.now() - (R.ms || 0)) / 1000;
  const vivo = idade < 20; $('liveTag').classList.toggle('on', vivo);
  $('liveTxt').textContent = vivo ? 'ao vivo' : `sem sinal há ${idade < 3600 ? Math.round(idade / 60) + ' min' : Math.round(idade / 3600) + ' h'}`;
  $('clock').innerHTML = `${(R.servidor || '').slice(0, 16)}<small>servidor · Brasília ${R.local || ''} · conta ${R.login || ''}</small>`;
  const bal = R.saldo, flut = R.flutuante, eq = bal + flut;   // capital sem bônus/crédito da corretora
  $('kSaldo').textContent = usd(bal); $('kSaldoSub').innerHTML = `capital ${usd(eq)} · flutuante <span class="${flut >= 0 ? 'pos' : 'neg'}">${sg(flut)}</span>`;
  $('kXau').textContent = R.xau ? 'US$ ' + fmt(R.xau) : '—';
  if (BRL) { $('kReal').textContent = 'R$ ' + fmt(bal * BRL); $('kDolar').textContent = `dólar R$ ${fmt(BRL, 4)} · capital R$ ${fmt(eq * BRL)}`; }
  const P = Hh.periodos || {}, dIni = Hh.inicio || '04/11/2026';
  const dias = Math.max(1, (Date.now() - new Date(2026, 10, 4).getTime()) / 864e5);
  const metas = { dia: METAT / 21, semana: METAT / 4.33, mes: METAT, total: METAT * dias / 30.4 };
  const nomes = { dia: 'Hoje', semana: 'Semana', mes: 'Mês', total: 'Desde ' + dIni };
  const flutHoje = flut;
  $('per').innerHTML = ['dia', 'semana', 'mes', 'total'].map(k => {
    const p = P[k] || { pl: 0, base: bal }; const pl = p.pl, b = p.base - (p.saque || 0), pct = b > 0 ? 100 * pl / b : 0, mt = metas[k];
    const w = Math.max(0, Math.min(100, 100 * pct / mt));
    return `<div class="pc ${pct >= mt ? 'ok' : pct < 0 ? 'neg' : ''}"><span>${nomes[k]} · meta +${fmt(mt)}%</span><strong class="${pl >= 0 ? 'pos' : 'neg'}">${sg(pl)}</strong><em>${sg(pct)}%${BRL ? ' · R$ ' + sg(pl * BRL) : ''}</em><div class="bar"><i style="width:${w}%"></i></div></div>`;
  }).join('');
  const bm = P.mes ? P.mes.base - (P.mes.saque || 0) : 0, m = bm > 0 ? 100 * P.mes.pl / bm : 0;
  const capB = Hh.cap_base || bal, plT = (Hh.pl_total || 0) + flut, picoPL = Math.max(Hh.pico_pl || 0, plT);
  const dd = capB + picoPL > 0 ? 100 * Math.max(0, picoPL - plT) / (capB + picoPL) : 0, ddm = Math.max(100 * (Hh.dd_max || 0), dd);
  $('kDD').textContent = fmt(dd) + '%'; $('kDDSub').textContent = 'máx ' + fmt(ddm) + '%';
  $('kSac').textContent = usd(Hh.sacado_total); $('kSacSub').textContent = `este mês ${usd(Hh.sacado_mes)} · desde ${Hh.inicio || '04/11'}`;
  const pos = R.pos ? Object.values(R.pos) : []; $('kAbertas').textContent = pos.length; $('kOps').textContent = Hh.fechadas + ' fechadas';
  // Helena: risco
  const xau = pos.filter(p => p.ativo && p.ativo.indexOf('XAU') === 0), cx = xau.filter(p => p.lado > 0).length, vx = xau.length - cx;
  const marg = R.margem > 0 ? 100 * R.margem / eq : 0; const al = [];
  if (!vivo) al.push(`sem sinal da VPS há ${Math.round(idade / 60)} min`); if (dd >= 10) al.push(`queda de ${fmt(dd)}%`); if (marg > 50) al.push(`margem usada ${fmt(marg, 0)}%`); if (Math.max(cx, vx) >= 5) al.push(`${Math.max(cx, vx)} operadores no mesmo lado do ouro`);
  const sev = al.length === 0 ? ['ok', 'ok'] : (!vivo || dd >= 15 || marg > 70) ? ['al', 'alerta'] : ['at', 'atenção'];
  $('b_risco_sev').className = 'sev ' + sev[0]; $('b_risco_sev').textContent = sev[1];
  $('b_risco').innerHTML = `${al.length ? '<b>' + al.join(' · ') + '.</b> ' : ''}Queda ${fmt(dd)}% (máx ${fmt(ddm)}%). Margem usada ${fmt(marg, 1)}%. Ouro: ${cx} comprados, ${vx} vendidos.`;
  // Marcos: performance
  const gs = AG.map((A, i) => [agData(i), i]).filter(x => x[0].n > 0 && x[0].musd !== 0); const acima = AG.filter((A, i) => META[A.n] > 0 && agData(i).mpct >= META[A.n]).length;
  const ord = gs.slice().sort((a, b) => b[0].musd - a[0].musd);
  $('b_perf_sev').className = 'sev ' + (m >= METAT ? 'ok' : m >= 0 ? 'at' : 'al'); $('b_perf_sev').textContent = m >= METAT ? 'meta batida' : m >= 0 ? 'abaixo da meta' : 'mês negativo';
  $('b_perf').innerHTML = ord.length ? `${acima} de ${AG.length} operadores já bateram a meta do mês. Melhor: <b>${AG[ord[0][1]].p}</b> ${sg(ord[0][0].musd)}. Pior: <b>${AG[ord[ord.length - 1][1]].p}</b> ${sg(ord[ord.length - 1][0].musd)}.` : 'Sem operações fechadas no mês ainda.';
  // Paulo: tesouraria
  const sal = Hh.inicio_mes * 0.01, falta = Math.max(0, sal - Hh.sacado_mes);
  $('b_tes_sev').className = 'sev ' + (falta > 0 ? 'at' : 'ok'); $('b_tes_sev').textContent = falta > 0 ? 'salário a sacar' : 'em dia';
  $('b_tes').innerHTML = `Salário do mês: 1% do saldo do início do mês = ${usd(sal)}${falta > 0 ? ` (falta sacar ${usd(falta)})` : ' (já sacado)'}. Extra no fim do trimestre: 50% do lucro do trimestre. Total sacado: ${usd(Hh.sacado_total)}.`;
  AG.forEach((_, i) => upDesk(i));
}
function renderHist() {
  if (!Hh) return; const f = Hh.feed ? Object.values(Hh.feed) : [];
  $('feed').innerHTML = f.map(it => `<li><time>${it.h}</time><span class="${it.v == null ? '' : it.v >= 0 ? 'pos' : 'neg'}">${it.t}</span></li>`).join('');
  if (f.length) { const key = f[0].h + f[0].t; if (lastKey !== null && key !== lastKey) { for (const it of f) { if (it.h + it.t === lastKey) break; const i = AG.findIndex(a => a.n === it.a); if (i >= 0 && it.v != null) pop(i, it.v); } } lastKey = key; }
  const pts = (Hh.curva ? Object.values(Hh.curva) : []).map((c, i) => [i, c[1]]);
  const c = $('eq'), x = c.getContext('2d'), W = c.width, H = c.height; x.clearRect(0, 0, W, H);
  if (pts.length > 1) {
    let lo = Infinity, hi = -Infinity; for (const p of pts) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); } if (hi - lo < 1) hi = lo + 1;
    const X = t => 8 + (W - 16) * t / (pts.length - 1), Y = v => H - 14 - (H - 28) * (v - lo) / (hi - lo);
    x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(X(p[0]), Y(p[1])) : x.moveTo(X(p[0]), Y(p[1])));
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(217,169,74,.35)'); g.addColorStop(1, 'rgba(217,169,74,0)');
    x.strokeStyle = '#d9a94a'; x.lineWidth = 2.5; x.stroke(); x.lineTo(X(pts.length - 1), H); x.lineTo(0, H); x.closePath(); x.fillStyle = g; x.fill();
    x.fillStyle = '#8a96a8'; x.font = '20px JetBrains Mono, monospace'; x.fillText(fmt(hi, 0), 10, 22); x.fillText(fmt(lo, 0), 10, H - 18);
  }
}
// ---------- Firebase ----------
firebase.initializeApp(FIREBASE);
const auth = firebase.auth(), db = firebase.database();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
let subs = [];
auth.onAuthStateChanged(u => {
  subs.forEach(f => f()); subs = [];
  $('login').hidden = !!u; $('app').hidden = !u;
  if (!u) return;
  const r1 = db.ref('led/rapido'), r2 = db.ref('led/historico');
  const a = r1.on('value', s => { R = s.val(); render(); }, e => { $('liveTxt').textContent = 'sem permissão: ' + e.code; });
  const b = r2.on('value', s => { Hh = s.val(); renderHist(); render(); });
  subs.push(() => r1.off('value', a), () => r2.off('value', b));
});
setInterval(render, 5000);
$('entrar').onclick = async () => {
  $('erro').textContent = '';
  try { await auth.signInWithEmailAndPassword($('em').value.trim(), $('pw').value); }
  catch (e) { $('erro').textContent = e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' ? 'E-mail ou senha errados.' : 'Não consegui entrar: ' + e.code; }
};
$('pw').addEventListener('keydown', e => { if (e.key === 'Enter') $('entrar').click(); });
$('sair').onclick = () => auth.signOut();
