const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const namesEl = $("#names");
const prizesEl = $("#prizes");
const countNamesEl = $("#countNames");
const countPrizesEl = $("#countPrizes");
const tickerEl = $("#ticker");
const centerTextEl = $("#centerText");
const preCountEl = $("#preCount");
const resultsTBody = $("#resultsTable tbody");
const resultBannerEl = document.getElementById("resultBanner");
const duplicateWarningEl = $("#duplicateWarning");
const remainingCountEl = $("#remainingCount");
const progressBarEl = $("#progressBar");
const progressLabelEl = $("#progressLabel");
const searchResultsEl = $("#searchResults");
const noResultsMsgEl = $("#noResultsMsg");
const spinOnceBtn = $("#spinOnce");
const preDrawBtn = $("#preDraw");

$("#saveLists").addEventListener("click", saveLists);
$("#loadLists").addEventListener("click", loadLists);
$("#clearLists").addEventListener("click", clearSaved);
spinOnceBtn.addEventListener("click", spinOnce);
preDrawBtn.addEventListener("click", preDraw);
$("#reset").addEventListener("click", resetResults);
$("#exportExcel").addEventListener("click", exportExcel);
$("#sortByName").addEventListener("click", sortResultsByName);
$("#sortByNo").addEventListener("click", sortResultsByNo);
searchResultsEl.addEventListener("input", filterResultsTable);

const stopBtn = $("#stop");
let stopRequested = false;
stopBtn.addEventListener("click", () => {
  stopRequested = true;
  cancelSpin = true;
  toast("Stopped");
});

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  const typing = tag === "TEXTAREA" || tag === "INPUT";
  if (e.code === "Space" && !typing) {
    e.preventDefault();
    spinOnce();
  } else if (e.key === "Escape") {
    stopRequested = true;
    cancelSpin = true;
  }
});

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let rotation = 0;
let animating = false;
let cancelSpin = false;

let results = [];
let remainingNames = [];
let remainingPrizes = [];

function fitCanvasToDisplay() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const needW = Math.max(1, Math.round(rect.width * dpr));
  const needH = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== needW || canvas.height !== needH) {
    canvas.width = needW;
    canvas.height = needH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return dpr;
}

const DEFAULT_NAMES = [
  "Vince Toh",
  "Mr Ivan Hoh",
  "Nelson Yeo",
  "Mr Anthony Cheng",
  "Diana Goh",
  "Mr Jimmy Hee",
  "Zabrina Tan",
  "Mr Tan Kian Hao",
  "Tan Eng Han",
  "Chew Boon Kee",
  "Louis Lim",
  "Boo Kee Eu",
  "Lim Kah Pu",
  "Lim Kee Ping",
  "John Ngoh",
  "Kenny Chong Yean Keong",
  "Jeremy Tan Hock Leng (Nicole Tan's Dad)",
  "Raymond Elijah Tan Eng Teik",
  "Ms Leong Wah Gee",
  "Teo Heng Thye",
  "Mr Roy Lee",
  "Raymond Lau Yean Liang",
  "Mr Tay Swee Sun",
  "Roy Teo Khoon Ling",
  "Ee Hock Chye",
  "Simon Ang",
  "Kevin Pang Ju Hui",
  "Quinn Tan",
  "Chan Sek Wing",
  "Lee Yang Kwang",
  "Choo Yong Meng",
  "Lim Li Fen",
  "Lee Soo Jen Eddy",
  "Choo Hook Kee Vincent",
  "Chua Eng Lam Kelvin",
  "Wei Lixia Lisa",
  "Michael Choo Cheng Guan",
  "Ong Chwee Hoe Jason",
  "Oei Ching Toh Jeffrey",
  "Chia Joo Seng James",
  "Yip Wing Meng",
  "Teo Siak Meng Gabriel",
  "Lee Wing Hay Dylan",
  "Kang Leong Chuan Dennis",
  "Soh Lay Geok",
  "Oh Chee Teck",
  "Yeo Boon Tee",
  "Tan Chew Hoe Michael",
  "Koh Chai Meng",
  "Toi Boon Bin Peter",
  "Ms. Sam Ng",
  "Wong Hai Koon Mccoy",
  "Chee Sek Choy Steven",
  "Low Wai Keong Nikson",
  "Low Kim Peow Tony",
  "Teo Chee Seng",
  "Colin Tan Siak Hwee",
  "Chua Chen How",
  "SF Wong",
  "Ong Lay Khoon",
  "Derek Wu",
  "Low Beng Tin",
  "Cleavan tan",
  "John Thiam",
  "Andrew Tan",
  "Lau Kwong Chung",
  "Chan Wei Ming",
  "Budi Lee",
  "Roy Khoo",
  "Lum Hon Chew",
  "Joseph Lee",
  "Tang Sau Kit",
  "Chee Teow Siong",
  "Michael Mok",
  "Tan Tiong Hin",
  "Ng Kim Han",
  "Bryan Ong",
  "William Ho",
  "Mccoy Lim",
  "Jimmy Lian",
  "Kenneth Tay",
  "Phang Thong Jan",
  "Ken Pereira",
  "Seah Eng Seng",
  "Albert Kow",
  "Seng Chong Kiat",
  "Ms Tomoko Oyama",
  "Victor Wong",
  "Seng Chong Wei",
  "Michelle Seng",
  "Chan Koon Hock",
  "Dennis Chee",
  "Ng Ley Ming",
  "Vincent Han Kim Siew",
  "Steven Cheong Yue Thong",
  "Lim Soon Huat",
  "Samuel Cheong Zhi Quan",
  "Koh Tiam Teck",
  "Leon Chong",
  "Koh Kong Wen",
  "Shigenobu YUGAMI",
  "Koh Xian Wen",
  "Takeshi HARA",
  "Koh Yong Zhi",
  "Shaikh Abdul Hafiz Gani",
  "Ng Kian Yin",
  "Ervin Lim",
];

function parseList(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function checkDuplicates() {
  const names = parseList(namesEl.value);
  const seen = new Map();
  for (const n of names) {
    const key = n.toLowerCase();
    if (!seen.has(key)) seen.set(key, { original: n, count: 0 });
    seen.get(key).count++;
  }
  const dupes = [...seen.values()].filter((v) => v.count > 1);
  if (dupes.length === 0) {
    duplicateWarningEl.hidden = true;
    duplicateWarningEl.textContent = "";
  } else {
    duplicateWarningEl.hidden = false;
    const sample = dupes
      .slice(0, 3)
      .map((v) => v.original)
      .join(", ");
    const more = dupes.length > 3 ? ` and ${dupes.length - 3} more` : "";
    duplicateWarningEl.textContent = `Duplicate name${
      dupes.length > 1 ? "s" : ""
    } detected: ${sample}${more}`;
  }
}

function updateProgress() {
  const total = parseList(namesEl.value).length;
  const drawn = results.length;
  const pct = total > 0 ? Math.min(100, (drawn / total) * 100) : 0;
  progressBarEl.style.width = pct + "%";
  progressLabelEl.textContent = `${drawn} of ${total} drawn`;
  remainingCountEl.textContent = Math.max(0, total - drawn);
}

function updateCounts() {
  countNamesEl.textContent = parseList(namesEl.value).length;
  countPrizesEl.textContent = parseList(prizesEl.value).length;
  checkDuplicates();
  updateProgress();
  drawWheel();
}
namesEl.addEventListener("input", updateCounts);
prizesEl.addEventListener("input", updateCounts);

function filterResultsTable() {
  const q = searchResultsEl.value.trim().toLowerCase();
  let anyVisible = false;
  $$("#resultsTable tbody tr").forEach((tr) => {
    const name = tr.children[1] ? tr.children[1].textContent.toLowerCase() : "";
    const match = q.length === 0 || name.includes(q);
    tr.hidden = !match;
    if (match) anyVisible = true;
  });
  if (results.length === 0) {
    noResultsMsgEl.hidden = false;
    noResultsMsgEl.textContent = "No results yet.";
  } else if (!anyVisible) {
    noResultsMsgEl.hidden = false;
    noResultsMsgEl.textContent = "No matching participant.";
  } else {
    noResultsMsgEl.hidden = true;
  }
}

function saveLists() {
  localStorage.setItem("neon_draw_names", namesEl.value);
  localStorage.setItem("neon_draw_prizes", prizesEl.value);
  toast("Lists saved");
}
function loadLists() {
  namesEl.value = localStorage.getItem("neon_draw_names") || "";
  prizesEl.value = localStorage.getItem("neon_draw_prizes") || "";
  updateCounts();
  toast("Loaded saved lists");
}
function clearSaved() {
  if (!confirm("Clear the saved participant and prize lists from this browser?")) {
    return;
  }
  localStorage.removeItem("neon_draw_names");
  localStorage.removeItem("neon_draw_prizes");
  toast("Saved lists cleared");
}

function toast(msg) {
  const prev = centerTextEl.textContent;
  centerTextEl.textContent = msg;
  setTimeout(() => (centerTextEl.textContent = prev), 900);
}

function setBanner(message) {
  if (!resultBannerEl) return;
  resultBannerEl.textContent = message;
  resultBannerEl.style.transform = "scale(1.02)";
  setTimeout(() => (resultBannerEl.style.transform = "scale(1)"), 140);
}

const GROUP_SIZE = 10;
const MAX_LABELS_TARGET = 10;
const SHOW_DIVIDERS = true;
const SHOW_GROUP_TICKS = true;
const SHOW_INNER_RING = true;
const NEON_GLOW = true;

function drawWheel() {
  const scale = fitCanvasToDisplay();
  ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);

  const prizes = parseList(prizesEl.value);

  const cx = canvas.width / 2 / scale;
  const cy = canvas.height / 2 / scale;
  const rOuter = Math.min(cx, cy) - 10;
  const rInner = rOuter * 0.22;

  const now = performance.now();
  const pulse = 0.8 + 0.2 * Math.sin(now * 0.004);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  function strokeRim(radius, width = 5) {
    if (NEON_GLOW) {
      ctx.shadowColor = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = 26 * pulse;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
    } else {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(233,241,255,0.85)";
    }
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (prizes.length === 0) {
    strokeRim(rOuter, 6);
    ctx.restore();
    return;
  }

  const n = prizes.length;
  const angleStep = (Math.PI * 2) / n;

  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.00)";
  ctx.fill();

  if (SHOW_DIVIDERS) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const a = i * angleStep;
      const r1 = rOuter * 0.97;
      const r2 = rOuter;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (SHOW_GROUP_TICKS && GROUP_SIZE > 0) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(233,241,255,0.65)";
    ctx.lineWidth = 2.5;
    const groups = Math.ceil(n / GROUP_SIZE);
    for (let g = 0; g < groups; g++) {
      const a = g * GROUP_SIZE * angleStep;
      const r1 = rOuter * 0.93;
      const r2 = rOuter;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (SHOW_INNER_RING) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(233,241,255,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rInner, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  strokeRim(rOuter - 1, 5);

  const visible = Math.min(n, MAX_LABELS_TARGET);
  const step = Math.max(1, Math.ceil(n / visible));
  ctx.fillStyle = "#e9f1ff";
  ctx.font = visible > 18 ? "12px Orbitron" : "14px Orbitron";
  ctx.shadowColor = "rgba(5,6,20,0.85)";
  ctx.shadowBlur = 4;

  for (let i = 0; i < n; i += step) {
    const mid = i * angleStep + angleStep / 2;
    const tx = Math.cos(mid) * (rOuter * 0.68);
    const ty = Math.sin(mid) * (rOuter * 0.68);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mid);
    drawTextCentered(ctx, prizes[i], 120);
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawTextCentered(ctx, text, maxWidth) {
  if (!text) return;
  const words = String(text).split(" ");
  const lines = [];
  let line = words.shift();
  for (const w of words) {
    const test = line + " " + w;
    if (ctx.measureText(test).width < maxWidth) line = test;
    else {
      lines.push(line);
      line = w;
    }
  }
  lines.push(line);
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, -ctx.measureText(ln).width / 2, idx * 14);
  });
}

function spinToIndex(index, opts = {}) {
  const prizes = parseList(prizesEl.value);
  const n = prizes.length;
  if (n === 0) return Promise.resolve({ cancelled: false });

  const angleStep = (Math.PI * 2) / n;
  const targetAngle = (Math.PI * 3) / 2 - (index + 0.5) * angleStep;
  const extraTurns = (opts.extraTurns ?? 3) + Math.random() * 1.5;
  let start = rotation % (Math.PI * 2);
  if (start < 0) start += Math.PI * 2;
  const finalAngle = targetAngle + extraTurns * Math.PI * 2;
  const duration = opts.duration ?? 800;
  const startTime = performance.now();

  animating = true;
  cancelSpin = false;

  return new Promise((resolve) => {
    function frame(now) {
      if (cancelSpin) {
        animating = false;
        cancelSpin = false;
        resolve({ cancelled: true });
        return;
      }
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      rotation = start + (finalAngle - start) * eased;
      drawWheel();
      if (t < 1) requestAnimationFrame(frame);
      else {
        animating = false;
        resolve({ cancelled: false });
      }
    }
    requestAnimationFrame(frame);
  });
}

function addResultRow({ no, name, prize, time }) {
  const tr = document.createElement("tr");
  tr.className = "row-new";
  tr.innerHTML = `<td>${no}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(
    prize
  )}</td><td>${time}</td>`;
  resultsTBody.appendChild(tr);
  filterResultsTable();
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        m
      ])
  );
}

function renderResultsTable() {
  resultsTBody.innerHTML = "";
  results.forEach((entry, idx) => {
    entry.no = idx + 1;
    addResultRow(entry);
  });
  filterResultsTable();
}

function sortResultsByName() {
  results.sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );
  renderResultsTable();
}

function sortResultsByNo() {
  results.sort((a, b) => a.no - b.no);
  renderResultsTable();
}

function resetResults() {
  results = [];
  resultsTBody.innerHTML = "";
  tickerEl.textContent = "";
  centerTextEl.textContent = "Ready";
  setBanner("Ready");
  remainingNames = parseList(namesEl.value);
  remainingPrizes = parseList(prizesEl.value);
  searchResultsEl.value = "";
  filterResultsTable();
  updateProgress();
  drawWheel();
}

function nowTime() {
  return new Date().toLocaleString();
}

async function spinOnce() {
  if (animating) return;
  stopRequested = false;

  if (remainingNames.length === 0) remainingNames = parseList(namesEl.value);
  if (remainingPrizes.length === 0) remainingPrizes = parseList(prizesEl.value);
  if (remainingNames.length === 0 || remainingPrizes.length === 0) {
    toast("Need names and prizes");
    return;
  }

  spinOnceBtn.disabled = true;
  preDrawBtn.disabled = true;

  const nameIdx = Math.floor(Math.random() * remainingNames.length);
  const prizeIdx = Math.floor(Math.random() * remainingPrizes.length);
  const name = remainingNames.splice(nameIdx, 1)[0];
  const prize = remainingPrizes[prizeIdx];

  const currentPrizeList = parseList(prizesEl.value);
  const indexInCurrent = currentPrizeList.findIndex((p) => p === prize);
  const res = await spinToIndex(Math.max(0, indexInCurrent), { duration: 900 });

  if (res.cancelled) {
    remainingNames.splice(nameIdx, 0, name);
    centerTextEl.textContent = "Stopped";
    drawWheel();
    spinOnceBtn.disabled = false;
    preDrawBtn.disabled = false;
    return;
  }

  remainingPrizes.splice(prizeIdx, 1);

  const entry = { no: results.length + 1, name, prize, time: nowTime() };
  results.push(entry);
  addResultRow(entry);

  setBanner(`${name} got ${prize}`);
  centerTextEl.textContent = "Done";
  tickerLine(`[${String(entry.no).padStart(3, "0")}] ${name} got ${prize}`);
  updateProgress();
  fireConfetti();
  drawWheel();

  spinOnceBtn.disabled = false;
  preDrawBtn.disabled = false;
}

async function preDraw() {
  if (animating) return;

  remainingNames = parseList(namesEl.value);
  remainingPrizes = parseList(prizesEl.value);
  const maxRounds = Math.min(remainingNames.length, remainingPrizes.length);
  if (maxRounds === 0) {
    toast("Need names and prizes");
    return;
  }

  let requested = Number(preCountEl.value || maxRounds);
  if (!Number.isFinite(requested) || requested <= 0) requested = maxRounds;
  const rounds = Math.min(requested, maxRounds);

  tickerEl.textContent = "";
  centerTextEl.textContent = "Pre draw running";
  stopRequested = false;
  spinOnceBtn.disabled = true;
  preDrawBtn.disabled = true;

  const currentPrizeList = parseList(prizesEl.value);

  for (let i = 0; i < rounds; i++) {
    if (stopRequested) break;

    const nameIdx = Math.floor(Math.random() * remainingNames.length);
    const prizeIdx = Math.floor(Math.random() * remainingPrizes.length);
    const name = remainingNames[nameIdx];
    const prize = remainingPrizes[prizeIdx];

    const indexInCurrent = currentPrizeList.findIndex((p) => p === prize);
    const res = await spinToIndex(Math.max(0, indexInCurrent), {
      duration: 300,
      extraTurns: 1.4,
    });

    if (stopRequested || res.cancelled) {
      centerTextEl.textContent = "Stopped";
      drawWheel();
      break;
    }

    remainingNames.splice(nameIdx, 1);
    remainingPrizes.splice(prizeIdx, 1);

    const entry = { no: results.length + 1, name, prize, time: nowTime() };
    results.push(entry);
    addResultRow(entry);

    const label = `${name} got ${prize}`;
    setBanner(label);
    centerTextEl.textContent = "Running";
    tickerLine(`[${String(entry.no).padStart(3, "0")}] ${label}`);
    updateProgress();

    await wait(90);
  }

  if (!stopRequested)
    centerTextEl.textContent = `Pre draw complete ${results.length} pairs`;
  drawWheel();
  spinOnceBtn.disabled = false;
  preDrawBtn.disabled = false;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function tickerLine(text) {
  tickerEl.textContent += text + "\n";
  tickerEl.scrollTop = tickerEl.scrollHeight;
}

const CONFETTI_COLORS = ["#00f5ff", "#7c4dff", "#ff1aff", "#2afc98", "#ffcf5c"];
const prefersReducedMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fireConfetti() {
  if (prefersReducedMotion) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const c = canvas.getContext("2d");

  const particles = Array.from({ length: 90 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * -6 - 2,
    size: Math.random() * 6 + 4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
  }));

  const gravity = 0.25;
  const start = performance.now();
  const duration = 1500;

  function frame(now) {
    const t = now - start;
    c.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      c.restore();
    });
    if (t < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

async function exportExcel() {
  if (results.length === 0) {
    toast("No results yet");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lucky Draw";
  workbook.created = new Date();
  workbook.properties.date1904 = true;

  const ws = workbook.addWorksheet("Results", {
    properties: {
      defaultColWidth: 18,
      defaultRowHeight: 18,
      tabColor: { argb: "FF00FFFF" },
    },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Participant", key: "name", width: 28 },
    { header: "Prize", key: "prize", width: 28 },
    { header: "Time", key: "time", width: 22 },
  ];

  results.forEach((r, idx) => ws.addRow({ ...r, no: idx + 1 }));

  const header = ws.getRow(1);
  header.font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: { argb: "FF001F2D" },
  };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 22;
  header.fill = {
    type: "gradient",
    gradient: "angle",
    degree: 45,
    stops: [
      { position: 0, color: { argb: "FF00F5FF" } },
      { position: 1, color: { argb: "FF7C4DFF" } },
    ],
  };

  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    row.alignment = { vertical: "middle" };
    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F6FF" },
      };
    }
    row.getCell("A").alignment = { horizontal: "center" };
  }

  ws.addTable({
    name: "ResultsTable",
    ref: "A1",
    headerRow: true,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
      showColumnStripes: false,
    },
    columns: [
      { name: "No" },
      { name: "Participant" },
      { name: "Prize" },
      { name: "Time" },
    ],
    rows: results.map((r, idx) => [idx + 1, r.name, r.prize, r.time]),
  });

  const ws2 = workbook.addWorksheet("Summary");
  ws2.getCell("A1").value = "Lucky Draw Summary";
  ws2.getCell("A1").font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FF7C4DFF" },
  };
  ws2.getCell("A3").value = "Participants";
  ws2.getCell("B3").value = countNamesEl.textContent;
  ws2.getCell("A4").value = "Prizes";
  ws2.getCell("B4").value = countPrizesEl.textContent;
  ws2.getCell("A5").value = "Pairs";
  ws2.getCell("B5").value = results.length;
  ws2.getColumn(1).width = 20;
  ws2.getColumn(2).width = 20;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `lucky-draw-results.xlsx`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function initCanvasSize() {
  canvas.style.width = "min(520px, 92vw)";
  canvas.style.height = "auto";
  canvas.width = 520;
  canvas.height = 520;
}
initCanvasSize();
loadLists();
if (!namesEl.value.trim()) {
  namesEl.value = DEFAULT_NAMES.join("\n");
}
updateCounts();
resetResults();

let glowRAF = null;
function startGlowLoop() {
  if (glowRAF) return;
  function loop() {
    if (!animating) drawWheel();
    glowRAF = requestAnimationFrame(loop);
  }
  glowRAF = requestAnimationFrame(loop);
}
startGlowLoop();

window.addEventListener("resize", () => {
  drawWheel();
});
