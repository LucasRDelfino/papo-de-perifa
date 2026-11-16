/* =========================================================
   PAPO DE PERIFA — interações
   ========================================================= */
(function () {
    'use strict';

    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------
       1. Progresso, seção ativa e dots
       --------------------------------------------------------- */
    const slides = $$('.slide');
    const dotsNav = $('#dots');
    const navLinks = $$('.nav-links a');
    const progressBar = $('#progressBar');

    slides.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'dot';
        b.setAttribute('aria-label', s.dataset.label);
        b.innerHTML = `<span>${s.dataset.label}</span>`;
        b.addEventListener('click', () => s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
        dotsNav.appendChild(b);
    });
    const dots = $$('.dot', dotsNav);

    let current = 0;
    function updateActive() {
        const mid = window.innerHeight * 0.4;
        let idx = 0;
        slides.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) idx = i; });
        current = idx;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        const id = slides[idx].id;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));

        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    updateActive();

    /* ---------------------------------------------------------
       2. Navegação por teclado (modo apresentação)
       --------------------------------------------------------- */
    function goTo(i) {
        const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
        // dentro do protótipo do celular, setas controlam o feed
        if (e.target.closest && e.target.closest('#phone')) return;

        if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && tag !== 'button')) {
            e.preventDefault(); goTo(current + 1);
        } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
            e.preventDefault(); goTo(current - 1);
        } else if (e.key === 'Home') {
            e.preventDefault(); goTo(0);
        } else if (e.key === 'End') {
            e.preventDefault(); goTo(slides.length - 1);
        }
    });

    /* ---------------------------------------------------------
       3. Reveal on scroll
       --------------------------------------------------------- */
    const reveals = $$('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                const el = en.target;
                // efeito cascata entre irmãos
                const siblings = $$('.reveal', el.parentElement).filter((x) => x.parentElement === el.parentElement);
                el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 90 + 'ms';
                el.classList.add('in');
                io.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach((el) => io.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add('in'));
    }

    /* ---------------------------------------------------------
       4. Tradutor corporativês → papo reto
       --------------------------------------------------------- */
    const TERMS = [
        { t: 'Fluxo de caixa', corp: '“É imprescindível monitorar o fluxo de caixa para garantir a sustentabilidade da operação.”', reto: 'Anota todo dinheiro que entra e que sai. Sem isso, você não sabe se tá ganhando ou só girando grana.' },
        { t: 'Precificação', corp: '“A estratégia de precificação deve considerar custos fixos, variáveis e a margem de contribuição.”', reto: 'Pra saber quanto cobrar, soma material, tempo, transporte e o teu lucro. Cobrar barato demais é pagar pra trabalhar.' },
        { t: 'Capital de giro', corp: '“A empresa necessita de capital de giro para honrar seus compromissos de curto prazo.”', reto: 'É a reserva que segura o corre enquanto o cliente não paga: material, gás, gasolina da moto.' },
        { t: 'Pró-labore', corp: '“Recomenda-se definir um pró-labore desvinculado da distribuição de lucros.”', reto: 'É o teu salário, separado do caixa do negócio. Dinheiro do corre não é dinheiro de casa.' },
        { t: 'Formalização (MEI)', corp: '“A formalização como MEI viabiliza a emissão de notas fiscais e o acesso à seguridade social.”', reto: 'Com CNPJ de MEI você emite nota, vende pra empresa e contribui pro INSS pra ter aposentadoria e auxílio.' },
        { t: 'Branding', corp: '“O branding consolida o posicionamento e o valor percebido da marca.”', reto: 'É como a quebrada lembra de você: nome, cor, jeito de atender e de postar. Tua marca na boca do povo.' },
        { t: 'Networking', corp: '“Investir em networking amplia as oportunidades de negócio.”', reto: 'Trocar ideia com quem pode somar no teu corre: cliente, fornecedor, parceiro. Contato é oportunidade.' },
        { t: 'ROI', corp: '“O ROI da campanha superou as expectativas do trimestre.”', reto: 'Quanto voltou do que você gastou. Pagou R$ 50 pra impulsionar e vendeu R$ 200? Valeu a pena.' }
    ];

    const termList = $('#termList');
    const trCorp = $('#trCorp');
    const trReto = $('#trReto');
    let typeTimer = null;

    function typeText(el, text) {
        clearInterval(typeTimer);
        if (reduceMotion) { el.textContent = text; return; }
        let i = 0;
        el.innerHTML = '<span class="caret"></span>';
        typeTimer = setInterval(() => {
            i += 2;
            el.innerHTML = text.slice(0, i) + '<span class="caret"></span>';
            if (i >= text.length) { clearInterval(typeTimer); el.textContent = text; }
        }, 18);
    }

    function selectTerm(i) {
        $$('.term', termList).forEach((b, j) => {
            b.classList.toggle('active', i === j);
            b.setAttribute('aria-selected', i === j);
        });
        trCorp.textContent = TERMS[i].corp;
        typeText(trReto, TERMS[i].reto);
    }

    TERMS.forEach((item, i) => {
        const b = document.createElement('button');
        b.className = 'term';
        b.setAttribute('role', 'tab');
        b.textContent = item.t;
        b.addEventListener('click', () => selectTerm(i));
        termList.appendChild(b);
    });
    // preenche sem digitar no carregamento
    $$('.term', termList)[0].classList.add('active');
    trCorp.textContent = TERMS[0].corp;
    trReto.textContent = TERMS[0].reto;

    /* =========================================================
       5. PROTÓTIPO DO APP
       ========================================================= */
    const phone = $('#phone');
    const toastEl = $('#appToast');
    let toastTimer;
    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
    }

    /* ----- abas ----- */
    const tabs = $$('.tab', phone);
    const views = $$('.app-view', phone);
    const moduleBoxes = $$('.module-box');

    function openTab(name) {
        tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
        views.forEach((v) => v.classList.toggle('active', v.dataset.view === name));
        moduleBoxes.forEach((m) => m.classList.toggle('active', m.dataset.goto === name));
        if (name === 'feed') playFeed(); else pauseFeed();
        if (name !== 'pilulas') stopQuizTimer();
    }
    tabs.forEach((t) => t.addEventListener('click', () => openTab(t.dataset.tab)));
    moduleBoxes.forEach((m) => m.addEventListener('click', () => {
        openTab(m.dataset.goto);
        if (window.innerWidth < 1080) phone.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }));

    /* ----- modo economia de dados ----- */
    const dataToggle = $('#dataToggle');
    dataToggle.addEventListener('click', () => {
        const on = dataToggle.getAttribute('aria-pressed') !== 'true';
        dataToggle.setAttribute('aria-pressed', on);
        phone.classList.toggle('low-data', on);
        toast(on ? 'Modo economia ligado: vídeo em baixa resolução e imagens comprimidas.' : 'Modo economia desligado.');
    });

    /* ----- FEED ----- */
    const FEED = [
        { q: 'O Corre da Semana', title: 'Das 7h às 22h: a rotina de uma nail designer que atende em casa', who: '@papodeperifa · 1:12', g: 'linear-gradient(160deg,#ff5722,#8b5cf6)', likes: 1240, art: '💅' },
        { q: 'Sem Curva', title: 'Capital de giro explicado em 60 segundos', who: '@papodeperifa · 0:58', g: 'linear-gradient(160deg,#06b6d4,#8b5cf6)', likes: 986, art: '💸' },
        { q: 'O Corre da Semana', title: 'Entregador de app: quanto sobra no fim do mês?', who: '@papodeperifa · 1:30', g: 'linear-gradient(160deg,#10b981,#06b6d4)', likes: 2310, art: '🛵' },
        { q: 'Sem Curva', title: 'MEI: o que é, quanto custa e por que vale', who: '@papodeperifa · 0:49', g: 'linear-gradient(160deg,#8b5cf6,#ff5722)', likes: 1785, art: '📄' }
    ];
    const feed = $('#feed');
    let feedIdx = 0;
    let feedTimer = null;

    feed.innerHTML =
        '<button class="feed-next" id="feedNext">próximo ↓</button><span class="feed-lowdata">ECO · 240p</span>' +
        FEED.map((f, i) => `
        <article class="feed-item ${i ? 'below' : ''}" style="background:${f.g}">
            <span class="feed-art" aria-hidden="true">${f.art}</span>
            <span class="feed-play" aria-hidden="true"></span>
            <span class="feed-quadro">${f.q}</span>
            <h5 class="feed-title">${f.title}</h5>
            <span class="feed-meta">${f.who}</span>
            <div class="feed-bar"><span></span></div>
            <div class="feed-actions">
                <button class="fa like" aria-label="Curtir"><i>♥</i><span>${fmt(f.likes)}</span></button>
                <button class="fa save" aria-label="Salvar"><i>🔖</i><span>salvar</span></button>
                <button class="fa share" aria-label="Compartilhar"><i>↗</i><span>enviar</span></button>
            </div>
        </article>`).join('');

    function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'k' : String(n); }

    const feedItems = $$('.feed-item', feed);

    function showFeed(i) {
        feedIdx = (i + feedItems.length) % feedItems.length;
        feedItems.forEach((el, j) => {
            el.classList.remove('above', 'below', 'playing');
            if (j < feedIdx) el.classList.add('above');
            if (j > feedIdx) el.classList.add('below');
        });
        playFeed();
    }
    function playFeed() {
        pauseFeed();
        const el = feedItems[feedIdx];
        // reinicia a barra de progresso
        void el.offsetWidth;
        el.classList.add('playing');
        feedTimer = setTimeout(() => showFeed(feedIdx + 1), 8000);
    }
    function pauseFeed() {
        clearTimeout(feedTimer);
        feedItems.forEach((el) => el.classList.remove('playing'));
    }

    $('#feedNext').addEventListener('click', () => showFeed(feedIdx + 1));
    feed.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); showFeed(feedIdx + 1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); showFeed(feedIdx - 1); }
    });
    let wheelLock = false;
    feed.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (wheelLock || Math.abs(e.deltaY) < 20) return;
        wheelLock = true;
        showFeed(feedIdx + (e.deltaY > 0 ? 1 : -1));
        setTimeout(() => (wheelLock = false), 700);
    }, { passive: false });
    let touchY = null;
    feed.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    feed.addEventListener('touchend', (e) => {
        if (touchY === null) return;
        const dy = touchY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 40) showFeed(feedIdx + (dy > 0 ? 1 : -1));
        touchY = null;
    });

    feed.addEventListener('click', (e) => {
        const like = e.target.closest('.like');
        if (like) {
            const i = feedItems.indexOf(like.closest('.feed-item'));
            const liked = like.classList.toggle('liked');
            FEED[i].likes += liked ? 1 : -1;
            like.querySelector('span').textContent = fmt(FEED[i].likes);
            return;
        }
        if (e.target.closest('.save')) { toast('Salvo na sua lista de pílulas pra ver depois.'); return; }
        if (e.target.closest('.share')) { toast('Link copiado pra mandar no grupo do Zap.'); }
    });

    // só toca o feed quando o celular aparece na tela
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => {
            const feedActive = $('[data-view="feed"]', phone).classList.contains('active');
            if (en.isIntersecting && feedActive) playFeed(); else pauseFeed();
        }, { threshold: 0.4 }).observe(phone);
    }

    /* ----- VITRINE ----- */
    const CATS = ['Todos', 'Beleza', 'Comida', 'Entregas', 'Tech', 'Design'];
    const PROS = [
        { n: 'Nails da Bia', c: 'Beleza', r: 'Nail designer', d: 0.8, col: '#ec4899' },
        { n: 'Dona Cida Marmitas', c: 'Comida', r: 'Marmitas e bolos', d: 0.5, col: '#ff5722' },
        { n: 'Barbearia do Kaique', c: 'Beleza', r: 'Barbeiro', d: 1.2, col: '#8b5cf6' },
        { n: 'Thiago Entregas', c: 'Entregas', r: 'Motoboy · frete leve', d: 0.9, col: '#10b981' },
        { n: 'Rafa Codes', c: 'Tech', r: 'Sites e lojas virtuais', d: 2.1, col: '#06b6d4' },
        { n: 'Lu Arte Visual', c: 'Design', r: 'Logos e artes p/ redes', d: 1.7, col: '#f59e0b' },
        { n: 'Mari Tranças', c: 'Beleza', r: 'Tranças e penteados', d: 2.6, col: '#a855f7' },
        { n: 'Lanches do Neguinho', c: 'Comida', r: 'Lanches e porções', d: 1.4, col: '#ef4444' }
    ];
    const chips = $('#chips');
    const pros = $('#pros');
    let cat = 'Todos';

    CATS.forEach((c) => {
        const b = document.createElement('button');
        b.className = 'chip' + (c === cat ? ' active' : '');
        b.textContent = c;
        b.addEventListener('click', () => {
            cat = c;
            $$('.chip', chips).forEach((x) => x.classList.toggle('active', x === b));
            renderPros();
        });
        chips.appendChild(b);
    });

    function initials(n) {
        return n.split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    }
    function renderPros() {
        const list = PROS.filter((p) => cat === 'Todos' || p.c === cat).sort((a, b) => a.d - b.d);
        pros.innerHTML = list.map((p, i) => `
            <div class="pro" style="animation-delay:${i * 60}ms">
                <span class="avatar" style="background:${p.col}">${initials(p.n)}</span>
                <div>
                    <div class="pro-name">${p.n}</div>
                    <div class="pro-info">${p.r}</div>
                    <div class="pro-dist">${p.d.toFixed(1).replace('.', ',')} km</div>
                </div>
                <button class="pro-btn" data-name="${p.n}">Chamar</button>
            </div>`).join('');
    }
    pros.addEventListener('click', (e) => {
        const b = e.target.closest('.pro-btn');
        if (b) toast(`Aqui abriria o WhatsApp de ${b.dataset.name}.`);
    });
    renderPros();

    /* ----- PÍLULAS + QUIZ ----- */
    const PILLS = [
        { t: 'Quanto cobrar sem pagar pra trabalhar', m: 'precificação' },
        { t: 'MEI sem mistério', m: 'formalização' },
        { t: 'Divulgar sem gastar', m: 'marketing' },
        { t: 'Separar o dinheiro de casa', m: 'gestão' }
    ];
    const QUIZ = [
        {
            q: 'Você vende um bolo por R$ 30. Ingredientes: R$ 18, embalagem: R$ 2, gás e luz: R$ 3. Quanto sobra pra você?',
            o: ['R$ 30', 'R$ 12', 'R$ 7'], a: 2,
            e: 'Preço não é lucro. Tira todos os custos antes de comemorar.'
        },
        {
            q: 'O que é capital de giro?',
            o: ['O lucro do mês', 'A grana que segura o corre enquanto o cliente não paga', 'Um empréstimo do banco'], a: 1,
            e: 'É a reserva pra comprar material e pagar as contas antes do dinheiro entrar.'
        },
        {
            q: 'Misturar o dinheiro do negócio com o de casa é…',
            o: ['Normal, é tudo meu', 'Um risco: você perde a noção se o corre dá lucro', 'Obrigatório pra quem é MEI'], a: 1,
            e: 'Separar as contas é o primeiro passo pra saber se o negócio se paga.'
        }
    ];
    const quizArea = $('#quizArea');
    let qi = 0, score = 0, timeLeft = 60, quizTimer = null;

    function stopQuizTimer() { clearInterval(quizTimer); quizTimer = null; }

    function quizHome() {
        stopQuizTimer();
        quizArea.innerHTML = `
            <h6 class="app-sub">Pílulas de 1 minuto</h6>
            <div class="pill-list">
                ${PILLS.map((p) => `<div class="pill-item"><b>${p.t}</b><small>#${p.m}</small></div>`).join('')}
            </div>
            <div class="quiz">
                <div class="quiz-top"><span>QUIZ RELÂMPAGO</span><span>3 perguntas · 60s</span></div>
                <p class="quiz-q">Será que tu manja de grana do corre? Bora testar.</p>
                <button class="app-btn" id="quizStart">Começar quiz</button>
            </div>`;
        $('#quizStart').addEventListener('click', startQuiz);
    }

    function startQuiz() {
        qi = 0; score = 0; timeLeft = 60;
        renderQuestion();
        stopQuizTimer();
        quizTimer = setInterval(() => {
            timeLeft--;
            const bar = $('.quiz-timer span', quizArea);
            const lbl = $('#quizTime', quizArea);
            if (bar) bar.style.width = (timeLeft / 60) * 100 + '%';
            if (lbl) lbl.textContent = timeLeft + 's';
            if (timeLeft <= 0) quizEnd();
        }, 1000);
    }

    function renderQuestion() {
        const item = QUIZ[qi];
        quizArea.innerHTML = `
            <div class="quiz">
                <div class="quiz-top"><span>PERGUNTA ${qi + 1}/${QUIZ.length}</span><span id="quizTime">${timeLeft}s</span></div>
                <div class="quiz-timer"><span style="width:${(timeLeft / 60) * 100}%"></span></div>
                <p class="quiz-q">${item.q}</p>
                <div class="quiz-opts">
                    ${item.o.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}
                </div>
                <div id="quizFeedback"></div>
            </div>`;
        $$('.opt', quizArea).forEach((b) => b.addEventListener('click', () => answer(+b.dataset.i)));
    }

    function answer(i) {
        const item = QUIZ[qi];
        const opts = $$('.opt', quizArea);
        opts.forEach((b) => (b.disabled = true));
        opts[item.a].classList.add('right');
        if (i === item.a) score++; else opts[i].classList.add('wrong');
        const last = qi === QUIZ.length - 1;
        $('#quizFeedback').innerHTML = `
            <p class="quiz-exp">${i === item.a ? '✅ Sem curva!' : '❌ Quase.'} ${item.e}</p>
            <button class="app-btn" id="quizNext">${last ? 'Ver resultado' : 'Próxima'}</button>`;
        $('#quizNext').addEventListener('click', () => { if (last) quizEnd(); else { qi++; renderQuestion(); } });
    }

    function quizEnd() {
        stopQuizTimer();
        const msg = score === 3 ? 'Mandou bem demais! Tá pronto pra precificar.' :
            score === 2 ? 'Tá no caminho. Uma pílula por dia e já era.' :
                'Relaxa: é pra isso que as pílulas existem.';
        quizArea.innerHTML = `
            <div class="quiz quiz-score">
                <div class="quiz-top"><span>RESULTADO</span><span>${timeLeft > 0 ? 60 - timeLeft + 's' : 'tempo esgotado'}</span></div>
                <div class="big">${score}/${QUIZ.length}</div>
                <p class="quiz-exp">${msg}</p>
                <button class="app-btn" id="quizAgain">Jogar de novo</button>
                <button class="app-btn ghost" id="quizBack">Ver pílulas</button>
            </div>`;
        $('#quizAgain').addEventListener('click', startQuiz);
        $('#quizBack').addEventListener('click', quizHome);
    }
    quizHome();

    /* ----- FEIRA ----- */
    const credBtn = $('#credBtn');
    credBtn.addEventListener('click', () => {
        const qr = $('#qr');
        let cells = '';
        // padrão decorativo com "olhos" nos cantos, estilo QR
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
                const on = corner || Math.random() > 0.5;
                cells += `<i class="${on ? 'on' : ''}"></i>`;
            }
        }
        qr.innerHTML = cells;
        $('#credCode').textContent = 'PDP-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        $('#cred').hidden = false;
        credBtn.textContent = 'Credencial gerada ✓';
        credBtn.disabled = true;
        toast('Pronto! Mostra esse código na entrada da feira.');
    });

    const STANDS = [
        ['food', 'Marmitas da Cida'], ['food', 'Doces da Jô'], ['empty'], ['moda', 'Brechó da Laje'], ['moda', 'Camisetas Zona Sul'],
        ['arte', 'Grafite ao vivo'], ['empty'], ['ofic', 'Oficina de precificação'], ['empty'], ['arte', 'Poesia & Slam'],
        ['serv', 'Tranças & Nails'], ['serv', 'Barbearia móvel'], ['ofic', 'Mentoria MEI'], ['food', 'Lanches do Neguinho'], ['moda', 'Bonés & bordados']
    ];
    const LABELS = { food: 'Comida', moda: 'Moda', arte: 'Arte', serv: 'Serviços', ofic: 'Oficina' };
    const fairMap = $('#fairMap');
    const mapInfo = $('#mapInfo');
    STANDS.forEach(([type, name], i) => {
        const b = document.createElement('button');
        if (type === 'empty') {
            b.className = 'stand empty';
            b.disabled = true;
            b.setAttribute('aria-label', 'Espaço livre');
        } else {
            const code = String.fromCharCode(65 + Math.floor(i / 5)) + ((i % 5) + 1);
            b.className = 'stand st-' + type;
            b.textContent = code;
            b.setAttribute('aria-label', `${code}: ${name}`);
            b.addEventListener('click', () => {
                $$('.stand', fairMap).forEach((s) => s.classList.remove('sel'));
                b.classList.add('sel');
                mapInfo.innerHTML = `<b>${code} · ${name}</b><br><span style="color:var(--text-muted)">${LABELS[type]}</span>`;
            });
        }
        fairMap.appendChild(b);
    });
})();
