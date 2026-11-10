let LABJ = null;
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


let R = null, Hh = null, lastKey = null, BRL = null, BRL0 = null;
async function dolar() { try { const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' }); const j = await r.json(); BRL = parseFloat(j.USDBRL.bid); render(); } catch (e) { } }
// dólar do dia de início (04/11/2026): separa o lucro do trading do ganho/perda só pela variação do dólar
async function dolar0() { try { const r = await fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/?start_date=20261104&end_date=20261104'); const j = await r.json(); if (j && j[0]) { BRL0 = parseFloat(j[0].bid); render(); } } catch (e) { } }
dolar(); dolar0(); setInterval(dolar, 60000);
// ---- horário de Brasília: a corretora manda hora do servidor; a diferença vem de R.servidor × R.ms ----
const BR = { timeZone: 'America/Sao_Paulo' };
function srvMs(t) { const m = String(t || '').match(/(\d{4})[.\-\/](\d{2})[.\-\/](\d{2})[ T]+(\d{2}):(\d{2})(?::(\d{2}))?/); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)) : null; }
function offSrv() { const s = R && srvMs(R.servidor); return s && R.ms ? Math.round((s - R.ms) / 9e5) * 9e5 : null; }   // servidor − UTC, arredondado a 15 min
function hBR(t, comData) {
  const off = offSrv(); if (off == null || t == null) return t ?? '';
  let ms = srvMs(t);
  if (ms == null) { const m = String(t).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/); if (!m) return t; const d = new Date(R.ms + off); ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), +m[1], +m[2], +(m[3] || 0)); comData = false; }
  return new Date(ms - off).toLocaleString('pt-BR', { ...BR, ...(comData === false ? {} : { day: '2-digit', month: '2-digit' }), hour: '2-digit', minute: '2-digit' });
}
const hojeSrv = () => { const off = offSrv(); if (off == null) return null; const d = new Date(R.ms + off); return d.toISOString().slice(0, 10); };
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
  if (pos) { el.classList.add(pos.lado > 0 ? 'buy' : 'sell'); $('s' + a).innerHTML = `<b>${pos.lado > 0 ? 'COMPRADO' : 'VENDIDO'}</b> ${fmt(pos.lote)} @ ${fmt(pos.preco, A.s === 'USDJPY' ? 3 : 2)} · <span class="${pos.lucro >= 0 ? 'pos' : 'neg'}">${sg(pos.lucro)}</span><br>desde ${hBR(pos.desde)} (Brasília)`; }
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
  $('clock').innerHTML = `${R.ms ? new Date(R.ms).toLocaleString('pt-BR', { ...BR, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}<small>horário de Brasília · servidor ${(R.servidor || '').slice(11, 16)} · conta ${R.login || ''}</small>`;
  const bal = R.saldo, flut = R.flutuante, eq = bal + flut;   // capital sem bônus/crédito da corretora
  $('kSaldo').textContent = usd(bal); $('kSaldoSub').innerHTML = `capital ${usd(eq)} · flutuante <span class="${flut >= 0 ? 'pos' : 'neg'}">${sg(flut)}</span>`;
  $('kXau').textContent = R.xau ? 'US$ ' + fmt(R.xau) : '—';
  if (BRL) {
    $('kReal').textContent = 'R$ ' + fmt(bal * BRL);
    const capI = Hh.cap_base || 0, plU = ((Hh.periodos || {}).total || {}).pl || 0;
    const doTrade = plU * BRL, doDolar = BRL0 && capI ? capI * (BRL - BRL0) : null;
    $('kDolar').innerHTML = `dólar R$ ${fmt(BRL, 4)}${BRL0 ? ` (04/11: R$ ${fmt(BRL0, 4)})` : ''}<br>lucro do trading <span class="${doTrade >= 0 ? 'pos' : 'neg'}">R$ ${sg(doTrade)}</span>${doDolar != null ? ` · do dólar <span class="${doDolar >= 0 ? 'pos' : 'neg'}">R$ ${sg(doDolar)}</span>` : ''}`;
  }
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
  const pos = R.pos ? Object.values(R.pos) : []; $('kAbertas').textContent = pos.length; const fd = Hh.feed ? Object.values(Hh.feed) : [], hj = hojeSrv();
  const nHoje = P.dia && P.dia.n != null ? P.dia.n : fd.filter(it => it.v != null && hj && String(it.h || '').replace(/\./g, '-').startsWith(hj)).length;
  $('kOps').textContent = `${nHoje} fechada${nHoje === 1 ? '' : 's'} hoje`;
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
  try { renderStaff(vivo, idade, eq, bal); } catch (e) { console.log(e); }
}
function renderHist() {
  if (!Hh) return; const f = Hh.feed ? Object.values(Hh.feed) : [];
  $('feed').innerHTML = f.map(it => `<li><time>${hBR(it.h)}</time><span class="${it.v == null ? '' : it.v >= 0 ? 'pos' : 'neg'}">${it.t}</span></li>`).join('');
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
  const r3 = db.ref('led/agenda'); const c3 = r3.on('value', s => { AGD = s.val(); render(); });
  subs.push(() => r1.off('value', a), () => r2.off('value', b), () => r3.off('value', c3));
  labChave(db).then(k => { LABK = k; lab(); }).catch(e => { $('labAt').textContent = 'sem acesso ao laboratório'; });
});
setInterval(render, 5000);
$('entrar').onclick = async () => {
  $('erro').textContent = '';
  try { await auth.signInWithEmailAndPassword($('em').value.trim(), $('pw').value); }
  catch (e) { $('erro').textContent = e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' ? 'E-mail ou senha errados.' : 'Não consegui entrar: ' + e.code; }
};
$('pw').addEventListener('keydown', e => { if (e.key === 'Enter') $('entrar').click(); });
$('sair').onclick = () => auth.signOut();

// ---------- Laboratório (pesquisa noturna; arquivo cifrado lab.enc, chave no Firebase) ----------
let LABK = null;
const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u))), unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' };
// chave do laboratório: criada aqui no seu aparelho no primeiro acesso; a privada fica só no Firebase (só você lê), a pública vai para o laboratório
async function labChave(db) {
  const s = await db.ref('led/lab_priv').once('value');
  if (s.val()) return crypto.subtle.importKey('pkcs8', unb64(s.val()), RSA, false, ['decrypt']);
  const kp = await crypto.subtle.generateKey({ ...RSA, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['encrypt', 'decrypt']);
  await db.ref('led/lab_pub').set(b64(await crypto.subtle.exportKey('spki', kp.publicKey)));
  await db.ref('led/lab_priv').set(b64(await crypto.subtle.exportKey('pkcs8', kp.privateKey)));
  return kp.privateKey;
}
async function abre(nome) {
  const r = await fetch(nome + '?' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw 0;
  const raw = unb64((await r.text()).trim());
  const kraw = await crypto.subtle.decrypt(RSA, LABK, raw.slice(0, 256));
  const key = await crypto.subtle.importKey('raw', kraw, 'AES-GCM', false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(256, 268) }, key, raw.slice(268))));
}
async function lab() {
  if (!LABK) return;
  try { renderLab(await abre('lab.enc')); } catch (e) { $('labAt').textContent = 'aguardando a primeira noite de pesquisa'; }
  try { renderAta(await abre('ata.enc')); } catch (e) { }
}
function renderAta(A) {
  $('ataAt').textContent = A.data || '—';
  const esc = t => String(t || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  $('ata').innerHTML = `<div class="ata"><p><b>${esc(A.resumo)}</b></p>${(A.diretoria || []).map(d => `<div class="dir"><b>${esc(d.nome)} · ${esc(d.cargo)}</b><p>${esc(d.texto)}</p></div>`).join('')}
  <h3>Propostas (aguardando sua aprovação: responda no Claude)</h3>${(A.propostas || []).length ? A.propostas.map((p, i) => `<div class="prop"><b>${i + 1}. ${esc(p.titulo)}</b><br>${esc(p.motivo)}<br><i>Ação: ${esc(p.acao)}</i></div>`).join('') : '<p class="note">Nenhuma proposta hoje.</p>'}
  ${(A.licoes || []).length ? `<h3>Lições anotadas hoje</h3>${A.licoes.map(l => `<p>· ${esc(l)}</p>`).join('')}` : ''}</div>`;
}
setInterval(lab, 10 * 60000);
const fp = v => (v >= 0 ? '+' : '') + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
function renderLab(J) {
  LABJ = J; try { render(); } catch (e) { }
  $('labAt').textContent = `${J.noites} noites · ${Number(J.testados).toLocaleString('pt-BR')} ideias testadas · atualizado ${J.atualizado}`;
  $('labPes').innerHTML = J.pesquisadores.map((p, k) => `<article class="boss" style="border-left-color:${p.cor}"><div class="hd"><div class="face">${face(311 + k * 53, p.cor, p.hoje_aprovados > 0 ? 1 : 0)}</div><div class="who"><b>${p.nome}</b><small>${p.cargo}</small></div><span class="sev ${p.nome === 'Sérgio' ? 'ok' : p.ativos.length ? (p.hoje_aprovados ? 'ok' : 'at') : 'al'}">${p.nome === 'Sérgio' ? (J.validados || 0) + ' validados' : p.ativos.length ? (p.hoje_aprovados ? p.hoje_aprovados + ' novo' + (p.hoje_aprovados > 1 ? 's' : '') : 'pesquisando') : 'sem dados'}</span></div><div class="msg">${p.ativos.length ? 'Última ideia: ' + (p.ultima || '—') : p.status}</div>${p.nome === 'Sérgio' ? '' : `<div class="nums"><span>hoje ${p.hoje_testados} testes</span><span>total ${Number(p.testados).toLocaleString('pt-BR')}</span><span>aprovados ${p.aprovados}</span></div>`}</article>`).join('');
  $('labRegra').textContent = J.regra;
  $('labTit').textContent = `Setups aprovados (${J.aprovados.length}) — aguardando sua decisão; nada entra no robô sem você`;
  $('labAp').innerHTML = J.aprovados.length ? J.aprovados.map(a => { const m = a.m; return `<details class="ap"><summary><b>${a.valid && a.valid.ok ? '✅ ' : ''}${a.desc}${a.obs ? `<span class="obs ${{ 'confirmado': 'ok', 'falhou na prática': 'al', 'abaixo do esperado': 'at' }[a.obs.status] || 'nd'}">${a.obs.status}${a.obs.n ? ' · ' + a.obs.n + ' op · ' + fp(a.obs.pts) + ' pts' : ''}</span>` : ''}</b><span class="pos">${fp(m.pts_mes)} pts/mês</span></summary><div class="det">${a.quem} · ${a.data.split('-').reverse().join('/')} · ${m.n} operações (${String(m.ops_mes).replace('.', ',')}/mês) · acerto ${String(m.acerto).replace('.', ',')}% · fator de lucro ${String(m.pf).replace('.', ',')} · média ${fp(m.media)} pts/op · queda máx ${fp(-m.dd)} pts<br>2022-2024: ${fp(m.is_pts)} pts (FL ${String(m.is_pf).replace('.', ',')}) · 2025-2026: ${fp(m.oos_pts)} pts (FL ${String(m.oos_pf).replace('.', ',')}) · entrada aleatória igual: FL ${String(m.base_pf).replace('.', ',')}, ${fp(m.base_media)} pts/op · vizinhos lucrando ${a.vizinhos}${a.valid ? `<br><b class="${a.valid.ok ? 'pos' : 'neg'}">Validador: ${a.valid.ok ? 'APROVADO' : 'REPROVADO'}</b> · custo dobrado FL ${String(a.valid.custo2_pf).replace('.', ',')} (${fp(a.valid.custo2_pts)} pts) · queda Monte Carlo 95% ${fp(-a.valid.dd95)} pts · últimos 6 meses ${fp(a.valid.ult6m)} pts (${a.valid.ult6m_n} op)` : ''}<table><tr>${Object.keys(m.anos).map(y => `<td>${y}</td>`).join('')}</tr><tr>${Object.values(m.anos).map(v => `<td class="${v >= 0 ? 'pos' : 'neg'}">${fp(v)}</td>`).join('')}</tr></table></div></details>`; }).join('') : '<p class="note">Nenhum aprovado ainda.</p>';
}

// ---------- Equipe de apoio ----------
let AGD = null, BASE = null;
fetch('base_teste.json').then(r => r.json()).then(j => { BASE = j; render(); }).catch(() => { });
const STAFF = [
  { id: 'port', p: 'Fernando', c: 'Gestor de Portfólio', cor: '#2f5d9e' },
  { id: 'exe', p: 'Clara', c: 'Execução', cor: '#8e44ad' },
  { id: 'ops', p: 'Rodrigo', c: 'Operações / TI', cor: '#16a085' },
  { id: 'mac', p: 'Lúcia', c: 'Macro e agenda', cor: '#c0392b' },
  { id: 'ri', p: 'Beatriz', c: 'Relações com Investidores', cor: '#c9a84c' },
  { id: 'ctl', p: 'Antônio', c: 'Controladoria', cor: '#34495e' }];
$('staff').innerHTML = STAFF.map((b, k) => `<article class="boss" style="border-left-color:${b.cor}"><div class="hd"><div class="face">${face(907 + k * 61, b.cor, 0)}</div><div class="who"><b>${b.p}</b><small>${b.c}</small></div><span class="sev ok" id="s_${b.id}_sev">ok</span></div><div class="msg" id="s_${b.id}">—</div>${b.id === 'ri' ? '<button class="btn" id="btnRel" type="button">Gerar relatório do mês (PDF)</button>' : ''}</article>`).join('');
function sev(id, cls, txt) { const e = $('s_' + id + '_sev'); e.className = 'sev ' + cls; e.textContent = txt; }
const dias = ms => (Date.now() - ms) / 864e5;
function renderStaff(vivo, idade, eq, bal) {
  const RG = LABJ && LABJ.regime && LABJ.regime.agentes ? LABJ.regime : null;
  const A = (Hh && Hh.agentes) || {}, B = (BASE && BASE.base) || {};
  // Fernando: operador ao vivo × teste
  const fora = [], linhas = [];
  AG.forEach(g => {
    const a = A[g.n] || {}, b = B[g.n]; if (!b) return; const st = [];
    if ((a.seq || 0) >= b.seq_max) st.push(`${a.seq} perdas seguidas (teste: máx ${b.seq_max})`);
    if ((a.mes_pct || 0) < b.mes_pior) st.push(`mês ${fmt(a.mes_pct)}% abaixo do pior mês do teste (${fmt(b.mes_pior)}%)`);
    if (a.ult_ms && dias(a.ult_ms) > Math.max(b.gap_max, 3) * 1.4) st.push(`sem operar há ${Math.round(dias(a.ult_ms))} dias (teste: máx ${b.gap_max})`);
    if (b.mes_med < 0) st.push('resultado médio negativo no teste');
    if (st.length) fora.push(`<b>${g.p}</b> (${g.n}): ${st.join('; ')}`);
    linhas.push(`<tr><td>${g.p} · ${g.n}</td><td>${a.n || 0}</td><td>${fmt(a.acerto || 0, 0)}% / ${fmt(b.acerto, 0)}%</td><td class="${(a.mes_pct || 0) >= 0 ? 'pos' : 'neg'}">${sg(a.mes_pct || 0)}%</td><td>${fmt(b.mes_med)}% · pior ${fmt(b.mes_pior)}%</td><td>${a.seq || 0} / ${b.seq_max}</td><td>${fmt(b.peso)}x</td><td>${RG && RG.agentes[g.n] && RG.agentes[g.n].media_atual != null ? sg(RG.agentes[g.n].media_atual) + '%/op · ' + RG.agentes[g.n].leitura : '—'}</td><td class="${st.length ? 'neg' : 'pos'}">${st.length ? 'revisar' : 'ok'}</td></tr>`);
  });
  sev('port', fora.length ? 'at' : 'ok', fora.length ? fora.length + ' para revisar' : 'carteira ok');
  const rgTxt = RG ? Object.entries(RG.atual || {}).map(([k, v]) => `${k} ${v.vol}/${v.tend}`).join(' · ') : '';
  const melhorR = RG ? AG.filter(g => (RG.agentes[g.n] || {}).leitura === 'melhor').map(g => g.p) : [], piorR = RG ? AG.filter(g => (RG.agentes[g.n] || {}).leitura === 'pior').map(g => g.p) : [];
  const cp = BASE ? BASE.corr_top.slice(0, 3).map(c => `${c[1]} × ${c[2]} (${fmt(c[0])})`).join(', ') : '';
  $('s_port').innerHTML = (fora.length ? fora.slice(0, 3).join('<br>') + (fora.length > 3 ? `<br>+${fora.length - 3} na tabela.` : '') : 'Todos os operadores dentro do padrão do teste.') + (RG ? `<br>Mercado agora: ${rgTxt}.${melhorR.length ? ` No teste, em regime igual, rendem mais: <b>${melhorR.join(', ')}</b>.` : ''}${piorR.length ? ` Rendem menos: <b>${piorR.join(', ')}</b>.` : ''}` : '') + (cp ? `<br><small>Mais parecidos no teste: ${cp}. Correlação média ${fmt(BASE.corr_med)}.</small>` : '');
  $('portTab').innerHTML = `<table><tr><th>Operador</th><th>Op.</th><th>Acerto real / teste</th><th>Mês</th><th>Teste: mês médio</th><th>Perdas seguidas / máx teste</th><th>Peso sugerido</th><th>Teste no regime atual</th><th></th></tr>${linhas.join('')}</table><p class="note">Peso sugerido = risco relativo pelo inverso da oscilação mensal no teste (1,00x = média). Só sugestão: nada é alterado nos robôs.</p>`;
  // Clara: execução
  const sp = R.spreads || {}, sps = Object.entries(sp).map(([k, v]) => `${k} ${v}`).join(' · ');
  const sl = AG.map(g => [g, A[g.n] || {}]).filter(x => (x[1].slip_n || 0) > 0).sort((x, y) => y[1].slip - x[1].slip);
  const pior = sl.slice(0, 3).map(x => `${x[0].p} ${sg(x[1].slip)} pts (${x[1].slip_n})`).join(', ');
  const ping = R.ping || 0; sev('exe', ping > 150 || (sl[0] && sl[0][1].slip > 30) ? 'at' : 'ok', ping > 150 ? 'ping alto' : 'ok');
  $('s_exe').innerHTML = `Ping VPS→corretora: <b>${ping} ms</b>${ping > 150 ? ' (alto: ordens a mercado podem escorregar)' : ''}.<br>Spread agora (pontos): ${sps || '—'}.<br>Slippage médio em stops/alvos/pendentes: ${pior || 'sem dados ainda'}.`;
  // Rodrigo: operações / TI
  const al = []; if (!vivo) al.push(`VPS sem sinal há ${Math.round(idade / 60)} min`); if (R.conectado === 0) al.push('MT5 desconectado da corretora'); if (R.algo === 0) al.push('Algo Trading DESLIGADO'); if (R.conta_ea === 0) al.push('conta não permite robôs');
  const sumidos = AG.filter(g => { const a = A[g.n] || {}, b = B[g.n]; return b && a.ult_ms && dias(a.ult_ms) > Math.max(b.gap_max, 3) * 1.4; }).map(g => g.p);
  sev('ops', al.length ? 'al' : sumidos.length ? 'at' : 'ok', al.length ? 'alerta' : sumidos.length ? 'atenção' : 'tudo no ar');
  $('s_ops').innerHTML = `${al.length ? '<b>' + al.join(' · ') + '.</b><br>' : ''}VPS ${vivo ? 'online' : 'OFF'} · corretora ${R.conectado === 0 ? 'OFF' : 'conectada'} · Algo Trading ${R.algo === 0 ? 'OFF' : 'ligado'} · nível de margem ${fmt(R.nivel_margem || 0, 0)}%.${sumidos.length ? `<br>Operadores parados além do normal: ${sumidos.join(', ')}.` : ''}<br><small>Aviso no celular: o relatório manda push pelo app MT5 se cair a conexão ou desligar o Algo Trading.</small>`;
  // Lúcia: agenda
  const it = AGD && AGD.itens ? Object.values(AGD.itens).filter(x => x.ms > Date.now() - 36e5).sort((x, y) => x.ms - y.ms) : [];
  const prox = it.filter(x => x.ms > Date.now()).slice(0, 4), logo = prox.find(x => x.ms - Date.now() < 3600e3);
  sev('mac', logo ? 'al' : prox.some(x => x.ms - Date.now() < 864e5) ? 'at' : 'ok', logo ? 'notícia em <1h' : prox.some(x => x.ms - Date.now() < 864e5) ? 'notícia hoje' : 'calmo');
  const dt = ms => new Date(ms).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  $('s_mac').innerHTML = prox.length ? 'Próximas de impacto alto (horário de Brasília):<br>' + prox.map(x => `<b>${dt(x.ms)}</b> ${x.moeda} ${x.nome}${x.prev ? ' · prev. ' + x.prev : ''}`).join('<br>') : 'Sem notícias de impacto alto nos próximos dias (USD, EUR, JPY).';
  // Beatriz: RI
  const P = Hh.periodos || {}, pm = P.mes || {}, pt = P.total || {};
  sev('ri', 'ok', 'pronto');
  $('s_ri').innerHTML = `Relatório do mês para clientes com a marca LED Invest: resultado do mês ${sg(pm.pl || 0)} (${sg(pm.base ? 100 * pm.pl / (pm.base - (pm.saque || 0)) : 0)}%), desde 04/11 ${sg(pt.pl || 0)}.`;
  // Antônio: controladoria
  const M = Hh.meses || {}, ks = Object.keys(M).sort(); let tot = 0, totR = 0;
  const rows = ks.map(k => { const m = M[k]; tot += m.pl; const r = BRL ? m.pl * BRL : 0; totR += r; return `<tr><td>${k.slice(5)}/${k.slice(0, 4)}</td><td class="${m.pl >= 0 ? 'pos' : 'neg'}">${sg(m.pl)}</td><td>${BRL ? 'R$ ' + sg(r) : '—'}</td><td>${fmt(m.aporte)}</td><td>${fmt(m.saque)}</td></tr>`; }).join('');
  sev('ctl', 'ok', 'em dia');
  $('s_ctl').innerHTML = `Lucro realizado desde 04/11: <b>${usd(tot)}</b>${BRL ? ` ≈ R$ ${fmt(tot * BRL)} no dólar de hoje` : ''}. Aportes e saques fora do lucro. Tabela mês a mês abaixo.`;
  $('ctlTab').innerHTML = `<table><tr><th>Mês</th><th>Lucro US$</th><th>Em reais (dólar de hoje)</th><th>Aportes US$</th><th>Saques US$</th></tr>${rows}<tr><td><b>Total</b></td><td><b>${sg(tot)}</b></td><td><b>${BRL ? 'R$ ' + sg(totR) : '—'}</b></td><td></td><td></td></tr></table><p class="note">Para o imposto: rendimentos de aplicações no exterior de pessoa física seguem a Lei 14.754/2023 (apuração anual). A conversão oficial usa a cotação do Banco Central da data de cada operação, não a de hoje. Confirme os valores com seu contador; não sou contador.</p>`;
}
function relatorio() {
  const P = Hh.periodos || {}, pm = P.mes || {}, pt = P.total || {}, A = Hh.agentes || {};
  const bm = (pm.base || 0) - (pm.saque || 0), bt = (pt.base || 0) - (pt.saque || 0);
  const mesNome = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const ops = AG.map(g => [g, A[g.n] || {}]).filter(x => x[1].n > 0).sort((x, y) => y[1].mes_usd - x[1].mes_usd);
  const M = Hh.meses || {};
  $('rel').innerHTML = `<div class="cab"><img src="logo-branco.png" alt="LED Invest"><div><h1>Relatório de desempenho</h1><div style="font-size:.8rem;color:#c8cfdb">${mesNome} · LED Alpha Gold + LED Alpha Global</div></div></div>
  <h2>Resumo</h2><div class="k"><div><span>Resultado do mês</span><b>${usd(pm.pl || 0)}</b><br>${sg(bm > 0 ? 100 * pm.pl / bm : 0)}%</div><div><span>Desde o início (04/11/2026)</span><b>${usd(pt.pl || 0)}</b><br>${sg(bt > 0 ? 100 * pt.pl / bt : 0)}%</div><div><span>Maior queda desde o início</span><b>${fmt(100 * (Hh.dd_max || 0))}%</b></div>
  <div><span>Operações fechadas</span><b>${Hh.fechadas || 0}</b></div><div><span>Robôs operando</span><b>${AG.length}</b></div><div><span>Gerado em</span><b>${new Date().toLocaleDateString('pt-BR')}</b></div></div>
  <h2>Evolução do resultado (US$)</h2><img class="cv" src="${$('eq').toDataURL('image/png')}" alt="Curva de resultado">
  <h2>Resultado por mês</h2><table><tr><th>Mês</th><th>Resultado US$</th></tr>${Object.keys(M).sort().map(k => `<tr><td>${k.slice(5)}/${k.slice(0, 4)}</td><td>${sg(M[k].pl)}</td></tr>`).join('')}</table>
  <h2>Operadores no mês</h2><table><tr><th>Estratégia</th><th>Operações</th><th>Acerto</th><th>Mês US$</th></tr>${ops.map(x => `<tr><td>${x[0].n}</td><td>${x[1].n}</td><td>${fmt(x[1].acerto, 0)}%</td><td>${sg(x[1].mes_usd)}</td></tr>`).join('')}</table>
  <p class="disc">LED Invest. Resultados passados não garantem resultados futuros. Operações em ouro, índices, moedas e criptoativos envolvem risco de perda do capital. Valores em dólares americanos, líquidos de custos de operação.</p>`;
  setTimeout(() => window.print(), 300);
}
document.addEventListener('click', e => { if (e.target && e.target.id === 'btnRel') relatorio(); });
