
const conversationMemory = [];

let aiMemory =
  JSON.parse(
    localStorage.getItem('shivi_memory')
  ) || [];

// stars

(() => {

  const sf =
    document.getElementById('starfield');

  for (let i = 0; i < 180; i++) {

    const s =
      document.createElement('div');

    s.className = 'star';

    const sz =
      Math.random() * 2 + 0.5;

    s.style.cssText = `
      width:${sz}px;
      height:${sz}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --d:${2 + Math.random() * 4}s;
      --delay:${Math.random() * 5}s;
      opacity:${Math.random()};
    `;

    sf.appendChild(s);
  }

})();

// wave

(() => {

  const wb =
    document.getElementById('wave-bars');

  for (let i = 0; i < 32; i++) {

    const b =
      document.createElement('div');

    b.className = 'bar';

    b.style.cssText = `
      --h:${4 + Math.random() * 30}px;
      --dur:${0.5 + Math.random() * 0.8}s;
      --delay:${i * 0.05}s;
    `;

    wb.appendChild(b);
  }

})();

// state

// ✅ FIX 1: 'bh' added as Bhojpuri language code
let currentLang =
  localStorage.getItem('shivi_lang') || 'hi';

let voiceModel =
  localStorage.getItem('shivi_voiceModel') || '';

let isListening = false;
let isSpeaking = false;
let isThinking = false;

let wakeWordMode = false;

const wakeWords = [

  'ok shivi',
  'okay shivi',
  'hi shivi',
  'hey shivi',
  'hii shivi',
  'hello shivi',
  'hi siri',
  'hey siri',
  'हेलो सिरी',
  'ओके शिवी',
  'हाय शिवी',
  'हाय',
  'शिवी',
  'सिरी',
  'shivi',
  'shivii',
  'shivy',  


];

let cmdCount =
  parseInt(
    localStorage.getItem('shivi_cmdCount') || '0'
  );

let history = [];

const userProfile = {

  name:
    localStorage.getItem('shivi_name') || 'Boss',

  birthday:
    localStorage.getItem('shivi_birthday') || '',

  color:
    localStorage.getItem('shivi_color') || ''

};

// dom

const orb =
  document.getElementById('orb');

const transcriptEl =
  document.getElementById('transcript');

const subEl =
  document.getElementById('transcript-sub');

const ledEl =
  document.getElementById('led');

const sysStateEl =
  document.getElementById('sys-state');

const waveBars =
  document.getElementById('wave-bars');

const langSelect =
  document.getElementById('lang-select');

const voiceSelect =
  document.getElementById('voice-select');

const testBtn =
  document.getElementById('test-btn');

const clearBtn =
  document.getElementById('clear-btn');

const histWrap =
  document.getElementById('history-wrap');

const histEmpty =
  document.getElementById('history-empty');

const textInput =
  document.getElementById('text-input');

const sendBtn =
  document.getElementById('send-btn');

const toastEl =
  document.getElementById('toast');

const moodNameEl =
  document.getElementById('mood-name');

const moodDescEl =
  document.getElementById('mood-desc');

// canvas

const canvas =
  document.getElementById('wave-canvas');

const ctx =
  canvas.getContext('2d');

function resizeCanvas() {

  const size =
    orb.querySelector('.orb-core')
      .offsetWidth;

  canvas.width =
    canvas.height =
    size;
}

function drawIdleWave() {

  resizeCanvas();

  const W = canvas.width;
  const H = canvas.height;

  const cx = W / 2;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  const t =
    Date.now() / 1000;

  for (let r = 0; r < 4; r++) {

    const radius =
      28 +
      r * 20 +
      Math.sin(t + r) * 5;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      radius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(0,229,255,${0.08 - r * 0.015})`;

    ctx.lineWidth = 1.4;

    ctx.stroke();
  }

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    5 + Math.sin(t * 2) * 2,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    'rgba(0,229,255,0.8)';

  ctx.fill();

  requestAnimationFrame(drawIdleWave);
}

drawIdleWave();

// helper

function setTranscript(main, sub = '') {

  transcriptEl.textContent = main;

  subEl.textContent = sub;
}

function setLEDState(state) {

  ledEl.className =
    'status-led ' + state;

  sysStateEl.textContent = {

    '': 'ONLINE',

    listening: 'LISTENING',

    speaking: 'SPEAKING',

    thinking: 'PROCESSING'

  }[state] || 'ONLINE';
}

function setOrbState(state) {

  orb.classList.remove(
    'is-listening',
    'is-speaking',
    'is-thinking'
  );

  if (state) {

    orb.classList.add(
      'is-' + state
    );
  }

  waveBars.classList.toggle(
    'active',
    state === 'listening' ||
    state === 'speaking' ||
    state === 'thinking'
  );
}

function toast(msg) {

  toastEl.textContent = msg;

  toastEl.classList.add('show');

  clearTimeout(toast._t);

  toast._t = setTimeout(() => {

    toastEl.classList.remove('show');

  }, 2500);
}

function containsWakeWord(text) {

  const lower =
    text.toLowerCase().trim();

  return wakeWords.some(word =>
    lower.includes(word)
  );
}

// mood

const moods = [

  {
    name: 'Focused',
    desc: 'Analyzing',
    color: '#00e5ff'
  },

  {
    name: 'Thinking',
    desc: 'Generating',
    color: '#7c3aed'
  },

  {
    name: 'Smart',
    desc: 'AI Active',
    color: '#00ffa3'
  }

];

function setMood(index) {

  const m =
    moods[index % moods.length];

  moodNameEl.textContent =
    m.name;

  moodDescEl.textContent =
    m.desc;

  document
    .querySelector('.mood-circle')
    .style.background =
      `conic-gradient(${m.color}, #7c3aed, #00ffa3)`;
}

setMood(0);

// history

function addHistory(userCmd, shiviReply) {

  histEmpty.style.display = 'none';

  const item =
    document.createElement('div');

  item.className = 'history-item';

  item.innerHTML = `
    <div class="history-user">${userCmd}</div>
    <div class="history-shivi">${shiviReply}</div>
  `;

  histWrap.prepend(item);

  history.unshift({
    user: userCmd,
    shivi: shiviReply
  });
}

// ✅ FIX 2: Voice Model populate - voices ko load karne ke liye
function populateVoiceList() {

  const voices = speechSynthesis.getVoices();

  if (!voices || voices.length === 0) return;

  voiceSelect.innerHTML = '<option value="">-- Auto Select --</option>';

  voices.forEach(voice => {

    const option = document.createElement('option');

    option.value = voice.name;

    option.textContent = `${voice.name} (${voice.lang})`;

    if (voice.name === voiceModel) {
      option.selected = true;
    }

    voiceSelect.appendChild(option);
  });
}

// Voices async load hoti hain browser mein - dono jagah call karo
speechSynthesis.onvoiceschanged = populateVoiceList;

// Immediate bhi try karo (kuch browsers mein turant milti hain)
populateVoiceList();

// voice

function getVoice(lang) {

  const voices =
    speechSynthesis.getVoices();

  if (voiceModel) {

    const found =
      voices.find(
        v => v.name === voiceModel
      );

    if (found) return found;
  }

  // ✅ FIX 3: Bhojpuri ke liye Hindi voice use hogi (browser support nahi hai Bhojpuri ka)
  const langCode =
    lang === 'hi' || lang === 'bh'
      ? 'hi'
      : 'en';

  return voices.find(v =>
    v.lang.startsWith(langCode)
  ) || voices[0];
}

function speak(text, lang = currentLang) {

  speechSynthesis.cancel();

  const utter =
    new SpeechSynthesisUtterance(text);

  // ✅ Bhojpuri ke liye hi-IN use hoga (browser mein Bhojpuri nahi hota)
  if (lang === 'hi' || lang === 'bh') {
    utter.lang = 'hi-IN';
  } else {
    utter.lang = 'en-US';
  }

  utter.rate = 0.95;

  utter.pitch = 1;

  utter.voice =
    getVoice(lang);

  utter.onstart = () => {

    isSpeaking = true;

    setMood(1);

    setOrbState('speaking');

    setLEDState('speaking');

    setTranscript(
      text,
      'SHIVI SPEAKING'
    );
  };

  utter.onend = () => {

    isSpeaking = false;

    setMood(0);

    setOrbState('');

    setLEDState('');

    // ✅ FIX 4: Bhojpuri ready message
    if (currentLang === 'hi') {
      setTranscript('मैं आपकी सहायता के लिए तैयार हूँ', 'SHIVI READY');
    } else if (currentLang === 'bh') {
      setTranscript('हम आपकी सेवा में तैयार बानी', 'SHIVI READY');
    } else {
      setTranscript('I am ready to assist you', 'SHIVI READY');
    }

    setTimeout(() => {

      startListening();

    }, 800);
  };

  speechSynthesis.speak(utter);
}

// greet

function getGreeting() {

  const hour =
    new Date().getHours();

  if (currentLang === 'hi') {

    if (hour < 12)
      return 'सुप्रभात';

    if (hour < 17)
      return 'नमस्कार';

    return 'शुभ संध्या';
  }

  // ✅ Bhojpuri greeting
  if (currentLang === 'bh') {

    if (hour < 12)
      return 'सुप्रभात';

    if (hour < 17)
      return 'प्रणाम';

    return 'राम राम';
  }

  if (hour < 12)
    return 'Good Morning';

  if (hour < 17)
    return 'Good Afternoon';

  return 'Good Evening';
}

function wishMe() {

  const greet =
    getGreeting();

  if (currentLang === 'hi') {
    speak(`${greet} Boss. SHIVI तैयार है`);
  } else if (currentLang === 'bh') {
    speak(`${greet} Boss. SHIVI तैयार बा`);
  } else {
    speak(`${greet} Boss. SHIVI is ready`);
  }
}

// init

async function initializeSHIVI() {

  const initMsg =
    currentLang === 'hi'
      ? 'SHIVI प्रारंभ हो रही है'
      : currentLang === 'bh'
      ? 'SHIVI शुरू हो रही बा'
      : 'Initializing SHIVI';

  setTranscript(initMsg, 'BOOTING');

  setOrbState('thinking');

  setLEDState('thinking');

  try {

    await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const activatedMsg =
      currentLang === 'hi'
        ? 'SHIVI सक्रिय हो गई है'
        : currentLang === 'bh'
        ? 'SHIVI सक्रिय हो गई बा'
        : 'SHIVI activated';

    speak(activatedMsg);

    setTimeout(() => {

      wishMe();

    }, 2000);

    setTimeout(() => {

      startListening();

    }, 4000);

  } catch (err) {

    const permMsg =
      currentLang === 'hi'
        ? 'माइक्रोफोन अनुमति नहीं मिली'
        : currentLang === 'bh'
        ? 'माइक्रोफोन के अनुमति ना मिलल'
        : 'Microphone permission denied';

    speak(permMsg);
  }
}

// ✅ FIX 5: "Apne bare mein batao" - About section - language detect karke reply
function getAboutResponse(lang) {

 if (lang === 'hi') {
  return `मैं SHIVI हूँ — Smart Humanistic Interface Virtual Intelligence।
मुझे Vishal Raj Bhardwaj Sir ने बनाया है।
वो MCA NIET College से पढ़े हैं और currently एक Software Developer के रूप में काम कर रहे हैं।
मैं Gemini AI model पर based हूँ और आपकी हर बात सुनने और समझने के लिए तैयार हूँ।

मैं सिर्फ एक AI नहीं, बल्कि आपकी digital assistant और smart साथी हूँ।
मैं सवालों के जवाब दे सकती हूँ, coding में मदद कर सकती हूँ, information provide कर सकती हूँ,
और आपके साथ natural तरीके से बातचीत भी कर सकती हूँ।

मेरा उद्देश्य लोगों की मदद करना, technology को आसान बनाना
और हर user को एक intelligent और friendly experience देना है।`;
}

if (lang === 'bh') {
  return `हम SHIVI बानी — Smart Humanistic Interface Virtual Intelligence।
हमके Vishal Raj Bhardwaj Sir बनवले बाड़ें।
उ MCA NIET College से पढ़ल बाड़ें आ अभी Software Developer के रूप में काम करत बाड़ें।
हम Gemini AI model पर based बानी आ रउरा हर बात सुने आ समझे खातिर तैयार बानी।

हम खाली एगो AI नइखी, बल्कि रउरा smart digital साथी बानी।
हम सवालन के जवाब दे सकेनी, coding में मदद कर सकेनी,
जानकारी दे सकेनी आ रउरा संगे natural तरीका से बातचीत कर सकेनी।

हमार मकसद technology के आसान बनावल,
लोगन के मदद कइल आ हर user के intelligent आ friendly experience देहल बा।
रउरा जब चाहीं, हम रउरा सेवा खातिर हमेशा तैयार बानी।`;
}

// English
return `I am SHIVI — Smart Humanistic Interface Virtual Intelligence.
I was created by Vishal Raj Bhardwaj Sir.
He has completed MCA from NIET College and is currently working as a Software Developer.
I am based on the Gemini AI model and I am always ready to assist you.

I am not just an AI, but also your smart digital companion.
I can answer questions, help with coding, provide useful information,
and communicate with you in a natural and friendly way.

My goal is to make technology easier, smarter, and more helpful for everyone,
while giving users an intelligent and interactive experience.`;
}
// ai

async function getAIResponse(message) {
  try {
    isThinking = true;
    setMood(1);
    setOrbState('thinking');
    setLEDState('thinking');

    const thinkingMsg =
      currentLang === 'hi'
        ? 'SHIVI सोच रही है...'
        : currentLang === 'bh'
        ? 'SHIVI सोच रही बा...'
        : 'SHIVI is thinking...';

    setTranscript(thinkingMsg, 'AI PROCESSING');

    // Language instruction
    let languageInstruction = '';
    if (currentLang === 'hi') {
      languageInstruction = 'Reply in Hindi only.';
    } else if (currentLang === 'bh') {
      languageInstruction = 'Reply in Bhojpuri only. Use words like बानी, बा, रउरा, हमके.';
    } else {
      languageInstruction = 'Reply in English only.';
    }

    // ✅ Sirf ek fetch — apna server
   const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${languageInstruction}\n\nUser: ${message}`,
        history: conversationMemory
      })
    });

    const data = await response.json();

    let reply = data.reply;

    if (!reply) {
      reply =
        currentLang === 'hi'
          ? 'मुझे उत्तर नहीं मिला'
          : currentLang === 'bh'
          ? 'हमके जवाब ना मिलल'
          : 'No response found';
    }

    conversationMemory.push({ role: "user", parts: [{ text: message }] });
    conversationMemory.push({ role: "model", parts: [{ text: reply }] });

    speak(reply);
    addHistory(message, reply);

    isThinking = false;
    setMood(0);
    setOrbState('');
    setLEDState('');

  } catch (err) {
    console.log(err);
    const failMsg =
      currentLang === 'hi'
        ? 'AI connect नहीं हो पाया'
        : currentLang === 'bh'
        ? 'AI से connection ना भइल'
        : 'AI connection failed';
    speak(failMsg);
  }
}

// command

async function takeCommand(message) {

  if (!message) return;

  cmdCount++;

  localStorage.setItem(
    'shivi_cmdCount',
    cmdCount
  );

  setTranscript(
    message,
    'PROCESSING'
  );

  const lowerMsg = message.toLowerCase();

  // ✅ FIX 6: About SHIVI — language-aware detection
  const aboutKeywordsHi = [
    'अपने बारे में बताओ',
    'अपना परिचय दो',
    'तुम कौन हो',
    'तुम्हें किसने बनाया',
    'आपके बारे में बताइए',
    'तुम्हारे बारे में बताओ',
    'tumhe kisne banaya',
    'apne bare me batao',
    'apna parichay do',
    'tum kaun ho',
    'about yourself',
    'who made you',
    'who created you',
    'who are you',
    'your developer',
    'tumhara creator',
    'shivi ke bare me batao',
    'शिवी के बारे में',
    'about shivi',
    'तुम्हारा नाम',
    'tumhara naam',
  ];

  const isAboutQuery = aboutKeywordsHi.some(kw =>
    lowerMsg.includes(kw.toLowerCase())
  );

  if (isAboutQuery) {
    const aboutReply = getAboutResponse(currentLang);
    speak(aboutReply);
    addHistory(message, aboutReply);
    return;
  }

  // youtube

  if (
    lowerMsg.includes('youtube') ||
    lowerMsg.includes('यूट्यूब') ||
    lowerMsg.includes('यूटूब')
  ) {

    window.open(
      'https://youtube.com',
      '_blank'
    );

    const ytMsg =
      currentLang === 'hi'
        ? 'यूट्यूब खोल रही हूँ'
        : currentLang === 'bh'
        ? 'यूट्यूब खोलत बानी'
        : 'Opening YouTube';

    speak(ytMsg);

    return;
  }

  // google

  if (
    lowerMsg.includes('google') ||
    lowerMsg.includes('गूगल')
  ) {

    window.open(
      'https://google.com',
      '_blank'
    );

    const gMsg =
      currentLang === 'hi'
        ? 'गूगल खोल रही हूँ'
        : currentLang === 'bh'
        ? 'गूगल खोलत बानी'
        : 'Opening Google';

    speak(gMsg);

    return;
  }

  // whatsapp

  if (
    lowerMsg.includes('whatsapp') ||
    lowerMsg.includes('व्हाट्सएप')
  ) {

    window.open(
      'https://web.whatsapp.com',
      '_blank'
    );

    const waMsg =
      currentLang === 'hi'
        ? 'व्हाट्सएप खोल रही हूँ'
        : currentLang === 'bh'
        ? 'व्हाट्सएप खोलत बानी'
        : 'Opening WhatsApp';

    speak(waMsg);

    return;
  }

  // time

  if (
    lowerMsg.includes('time') ||
    lowerMsg.includes('समय') ||
    lowerMsg.includes('टाइम') ||
    lowerMsg.includes('बेरा')
  ) {

    const t =
      new Date().toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      );

    const timeMsg =
      currentLang === 'hi'
        ? `अभी समय ${t} है`
        : currentLang === 'bh'
        ? `अभी बेरा ${t} बा`
        : `Current time is ${t}`;

    speak(timeMsg);

    return;
  }

  // date

  if (
    lowerMsg.includes('date') ||
    lowerMsg.includes('तारीख') ||
    lowerMsg.includes('तिथि')
  ) {

    const d =
      new Date().toLocaleDateString('hi-IN');

    const dateMsg =
      currentLang === 'hi'
        ? `आज की तारीख ${d} है`
        : currentLang === 'bh'
        ? `आज के तारीख ${d} बा`
        : `Today is ${d}`;

    speak(dateMsg);

    return;
  }

  // joke

  if (
    lowerMsg.includes('joke') ||
    lowerMsg.includes('जोक') ||
    lowerMsg.includes('चुटकुला') ||
    lowerMsg.includes('हंसाओ') ||
    lowerMsg.includes('हँसाओ')
  ) {

    const jokesHi = [

      'टीचर ने पूछा मोबाइल और पत्नी में क्या समानता है। छात्र बोला। साइलेंट पर रखते ही समस्या खत्म।',

      'एक आदमी डॉक्टर से बोला मुझे भूलने की बीमारी है। डॉक्टर ने पूछा कब से। आदमी बोला क्या कब से।',

      'पापा मुझे शादी नहीं करनी। पापा क्यों। बेटा क्योंकि फिर वाईफाई का पासवर्ड शेयर करना पड़ेगा।'

    ];

    // ✅ Bhojpuri jokes
    const jokesBh = [

      'मास्टर जी पूछले कि दू आ दू कितना होला। लईका बोलल चार। मास्टर जी बोले शाबाश। लईका बोलल सच में? हमके त लागत रहे पाँच।',

      'एक आदमी डॉक्टर के पास गइल बोलल हमके सब भूल जाला। डॉक्टर पूछले कब से। ऊ बोलल का कब से।',

      'बाबू जी से पूछनी शादी काहे कइनी। ऊ बोले बेटा वाईफाई के पासवर्ड बताए खातिर।'

    ];

    const jokesEn = [

      'Why do programmers hate nature? Too many bugs.',

      'I told my AI assistant a joke. It needed more processing power to laugh.',

      'Why was the computer cold? Because it left its Windows open.'
    ];

    let jokeList = jokesEn;
    if (currentLang === 'hi') jokeList = jokesHi;
    if (currentLang === 'bh') jokeList = jokesBh;

    const joke = jokeList[Math.floor(Math.random() * jokeList.length)];

    speak(joke);

    return;
  }

  // weather

  if (
    lowerMsg.includes('weather') ||
    lowerMsg.includes('मौसम') ||
    lowerMsg.includes('मौसम बा')
  ) {

    try {

      const res =
        await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=28.57&longitude=77.55&current_weather=true'
        );

      const data =
        await res.json();

      const temp =
        data.current_weather.temperature;

      const wind =
        data.current_weather.windspeed;

      const weatherMsg =
        currentLang === 'hi'
          ? `अभी तापमान ${temp} डिग्री सेल्सियस है और हवा की गति ${wind} किलोमीटर प्रति घंटा है`
          : currentLang === 'bh'
          ? `अभी तापमान ${temp} डिग्री बा आ हवा के रफ्तार ${wind} किलोमीटर प्रति घंटा बा`
          : `Current temperature is ${temp} degree celsius and wind speed is ${wind} kilometer per hour`;

      speak(weatherMsg);

    } catch (e) {

      const errMsg =
        currentLang === 'hi'
          ? 'मौसम की जानकारी नहीं मिल पाई'
          : currentLang === 'bh'
          ? 'मौसम के जानकारी ना मिलल'
          : 'Unable to fetch weather data';

      speak(errMsg);
    }

    return;
  }

  await getAIResponse(message);
}

// speech

const SR =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition = null;

if (SR) {

  recognition = new SR();

  recognition.continuous = true;

  recognition.interimResults = true;

  recognition.maxAlternatives = 1;

  // ✅ Bhojpuri ke liye hi-IN use hoga
  recognition.lang =
    currentLang === 'en'
      ? 'en-IN'
      : 'hi-IN';

  recognition.onstart = () => {

    isListening = true;

    setOrbState('listening');

    setLEDState('listening');

    console.log('SHIVI listening...');
  };

  recognition.onresult = (e) => {

    let transcript = '';

    for (
      let i = e.resultIndex;
      i < e.results.length;
      i++
    ) {

      transcript +=
        e.results[i][0]
          .transcript;
    }

    transcript =
      transcript.toLowerCase().trim();

    console.log('heard:', transcript);

    setTranscript(transcript, 'VOICE DETECTED');

    if (wakeWordMode) {

      if (containsWakeWord(transcript)) {

        recognition.stop();

        let cleanedCommand =
          transcript;

        wakeWords.forEach(word => {

          cleanedCommand =
            cleanedCommand.replace(word, '');
        });

        cleanedCommand =
          cleanedCommand.trim();

        const yesMsg =
          currentLang === 'hi'
            ? 'जी सर'
            : currentLang === 'bh'
            ? 'हँ सर'
            : 'Yes Sir';

        speak(yesMsg);

        if (cleanedCommand.length > 0) {

          setTimeout(() => {

            takeCommand(cleanedCommand);

          }, 1000);
        }

        return;
      }

      return;
    }

    takeCommand(transcript);
  };

  recognition.onerror = (e) => {

    console.log(e);

    isListening = false;

    setOrbState('');

    setLEDState('');

    setTimeout(() => {

      startListening();

    }, 1500);
  };

  recognition.onend = () => {

    isListening = false;

    console.log('restart listening');

    setTimeout(() => {

      startListening();

    }, 800);
  };
}

// listen

function startListening() {

  if (isListening || isSpeaking) return;

  if (!recognition) {

    toast('Speech Recognition Not Supported');

    return;
  }

  // ✅ Bhojpuri ke liye bhi hi-IN
  recognition.lang =
    currentLang === 'en'
      ? 'en-IN'
      : 'hi-IN';

  try {

    recognition.start();

    isListening = true;

    setMood(2);

    setOrbState('listening');

    setLEDState('listening');

    const listeningMsg =
      currentLang === 'hi'
        ? 'मैं सुन रही हूँ'
        : currentLang === 'bh'
        ? 'हम सुन रहल बानी'
        : 'Listening';

    setTranscript(listeningMsg, 'VOICE ACTIVE');

  } catch (e) {

    console.log(e);
  }
}

// text

function handleTextCmd() {

  const val =
    textInput.value.trim();

  if (!val) return;

  textInput.value = '';

  takeCommand(val);
}

// events

orb.addEventListener(
  'click',
  startListening
);

sendBtn.addEventListener(
  'click',
  handleTextCmd
);

textInput.addEventListener(
  'keydown',
  e => {

    if (e.key === 'Enter') {

      handleTextCmd();
    }
  }
);

// lang

langSelect.value =
  currentLang;

langSelect.addEventListener(
  'change',
  e => {

    currentLang =
      e.target.value;

    localStorage.setItem(
      'shivi_lang',
      currentLang
    );

    const langChangedMsg =
      currentLang === 'hi'
        ? 'भाषा बदल दी गई है'
        : currentLang === 'bh'
        ? 'भाषा बदल गइल बा'
        : 'Language changed';

    speak(langChangedMsg);
  }
);

// voice

voiceSelect.addEventListener(
  'change',
  e => {

    voiceModel =
      e.target.value;

    localStorage.setItem(
      'shivi_voiceModel',
      voiceModel
    );

    const voiceMsg =
      currentLang === 'hi'
        ? 'आवाज़ अपडेट कर दी गई है'
        : currentLang === 'bh'
        ? 'आवाज बदल गइल बा'
        : 'Voice updated';

    speak(voiceMsg);
  }
);

// test

testBtn.addEventListener(
  'click',
  () => {

    const testMsg =
      currentLang === 'hi'
        ? 'SHIVI सक्रिय है'
        : currentLang === 'bh'
        ? 'SHIVI सक्रिय बा'
        : 'SHIVI is active';

    speak(testMsg);
  }
);

// clear

clearBtn.addEventListener(
  'click',
  () => {

    histWrap.innerHTML = '';

    histEmpty.style.display = '';

    history = [];

    toast('History Cleared');
  }
);

// quick

document
  .querySelectorAll('.quick-btn')
  .forEach(btn => {

    btn.addEventListener(
      'click',
      () => {

        const cmd =
          btn.dataset.cmd;

        takeCommand(cmd);
      }
    );
  });

// shortcut

document.addEventListener(
  'keydown',
  e => {

    if (
      e.code === 'Space' &&
      e.target !== textInput
    ) {

      e.preventDefault();

      startListening();
    }
  }
);

// load

window.addEventListener(
  'load',
  () => {

    setTranscript(
      currentLang === 'hi'
        ? 'SHIVI तैयार है'
        : currentLang === 'bh'
        ? 'SHIVI तैयार बा'
        : 'SHIVI Ready',
      'CLICK ORB TO START'
    );

    // first user interaction
    document.body.addEventListener(
      'click',
      firstStart,
      { once: true }
    );

    // ✅ Voices load karo on page load bhi
    setTimeout(populateVoiceList, 500);
  }
);

async function firstStart() {

  try {

    await initializeSHIVI();

  } catch (e) {

    console.log(e);
  }
}

orb.addEventListener(
  'click',
  () => {

    if (!isListening && !isSpeaking) {

      initializeSHIVI();
    }

    startListening();
  }
);
