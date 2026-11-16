"use strict";

const API_URL = "https://first-impression-radar.realtime-voice-chat-2.workers.dev/analyze";

const el = id => document.getElementById(id);
const photoInput = el("photo");
const status = el("status");
const labels = ["表情氛围", "视线与姿态", "穿搭与妆容", "光线与构图", "第一眼记忆点"];
const samplePhoto = "assets/example-portrait.jpg";
const sample = {
  title: "笑起来很有感染力",
  tags: ["明朗", "自然", "有记忆点"],
  compliment: "红色上衣很抓眼，真正让视线停下来的，是你笑起来时眼睛和嘴角一起弯的那一下。",
  summary: "直视镜头和展开的笑容，让这张近景照有种面对面说话的亲切感。",
  dimensions: [
    "嘴角向上、眼周也跟着弯，笑意在整张脸上都看得到。",
    "视线直向镜头，头微侧，画面像一次轻松的对视。",
    "红色上衣给近景一个鲜明的色彩焦点。妆面细节在这张照片里不明显。",
    "柔和的光照亮眉眼，模糊的背景把注意力留给表情。",
    "红衣先吸引视线，眼睛和嘴角一起弯起的笑容留下记忆。"
  ],
  tips: [
    "想留住笑容又让画面更安静，可以在窗边用柔和侧光，试试低饱和的上衣。",
    "拍头像时把手机抬到眼睛齐平的位置，给肩线多留一点空间，让近景更松弛。"
  ],
  question: "你刚认识我时，先注意到的是我的笑，还是我的穿搭？"
};

let selectedPhoto;
let currentReport;
let selectionId = 0;
let busy = false;
let exporting = false;

function announce(message, error = false) {
  status.textContent = message;
  status.classList.toggle("error", error);
}

function setBusy(value) {
  busy = value;
  for (const id of ["analyze", "change", "consent", "pick", "example", "header-example", "cover-example", "again"]) {
    el(id).disabled = value;
  }
  el("analyze").textContent = value ? "正在测评…" : "开始测评 →";
}

function choose() {
  if (!busy) photoInput.click();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("这张照片无法读取，请试试另一张。"));
    image.src = src;
  });
}

async function prepare(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    if (Math.min(image.naturalWidth, image.naturalHeight) < 160) {
      throw new Error("照片有点小，请换一张清晰的人像照。");
    }
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", .84);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function select(file) {
  if (!file || busy) return;
  const id = ++selectionId;
  selectedPhoto = undefined;
  el("consent").checked = false;
  el("selected").hidden = true;
  el("upload-zone").hidden = false;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    announce("请选择 12 MB 以内的 JPG、PNG 或 WebP 图片。", true);
    return;
  }
  announce("正在读取照片…");
  try {
    const data = await prepare(file);
    if (id !== selectionId) return;
    selectedPhoto = data;
    el("preview").src = data;
    el("filename").textContent = file.name;
    el("selected").hidden = false;
    el("upload-zone").hidden = true;
    announce(API_URL ? "" : "在线测评尚未接通。照片仅在本机预览，你可以先查看示例报告。");
    el("change").focus();
    el("upload-form").scrollIntoView({ block: "nearest" });
  } catch (error) {
    if (id === selectionId) announce(error.message, true);
  }
}

function setList(id, entries) {
  el(id).replaceChildren(...entries.map(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    return li;
  }));
}

function showReport(result, photo, example = false) {
  currentReport = { result, photo, example };
  el("report-kind").textContent = example ? "示例报告 · 人工撰写" : "你的第一印象 · AI 分析";
  el("report-photo").src = photo;
  el("report-title").textContent = result.title;
  el("compliment").textContent = result.compliment;
  el("summary").textContent = result.summary;
  el("question").textContent = result.question;
  setList("tags", result.tags);
  setList("tips", result.tips);
  el("dimensions").replaceChildren(...result.dimensions.map((text, index) => {
    const li = document.createElement("li");
    const heading = document.createElement("h4");
    const detail = document.createElement("p");
    heading.textContent = labels[index];
    detail.textContent = text;
    li.append(heading, detail);
    return li;
  }));
  el("include-photo").checked = false;
  el("share-status").textContent = "";
  el("report").hidden = false;
  el("report-title").focus({ preventScroll: true });
  el("report").scrollIntoView({ block: "start" });
}

async function analyze(event) {
  event.preventDefault();
  if (!selectedPhoto || busy) return;
  const endpoint = API_URL;
  if (!endpoint) {
    announce("在线测评尚未接通，请先查看示例报告。", true);
    return;
  }
  if (!el("consent").checked) {
    announce("请先确认照片使用和发送说明。", true);
    el("consent").focus();
    return;
  }
  const photo = selectedPhoto;
  setBusy(true);
  announce("正在观察照片里的细节，首次测评可能需要一到两分钟。");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({ image: photo })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "测评暂时无法完成，请稍后再试。");
    if (payload.status === "retake") {
      announce(payload.reason, true);
      return;
    }
    showReport(payload, photo);
    announce("测评完成。");
  } catch (error) {
    const message = error instanceof TypeError || error instanceof SyntaxError || error.name === "TimeoutError"
      ? "暂时连不上测评服务，请稍后再试。" : error.message;
    announce(message, true);
  } finally {
    setBusy(false);
  }
}

function wrapText(ctx, text, width) {
  const lines = [];
  let line = "";
  for (const character of text) {
    if (line && ctx.measureText(line + character).width > width) {
      lines.push(line);
      line = "";
    }
    line += character;
  }
  if (line) lines.push(line);
  return lines;
}

function coverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) * .39, sourceWidth, sourceHeight, x, y, width, height);
}

async function saveCard() {
  if (!currentReport || exporting) return;
  const snapshot = currentReport;
  const { result, photo, example } = snapshot;
  const include = el("include-photo").checked;
  exporting = true;
  el("download").disabled = true;
  el("share-status").textContent = "正在生成分享卡…";
  try {
    const image = include ? await loadImage(photo) : null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const font = '"Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
    const width = 1080;
    const inset = 76;
    const available = width - 2 * inset;
    const blocks = [
      { text: result.title, font: "700 77px", color: "#002fa7", line: 96, gap: 24 },
      { text: result.tags.join(" / "), font: "500 34px", color: "#002fa7", line: 46, gap: 33 },
      { text: result.compliment, font: "600 42px", color: "#17171b", line: 61, gap: 31 },
      { text: result.question, font: "400 34px", color: "#575761", line: 47, gap: 0 }
    ].map(block => {
      ctx.font = block.font + " " + font;
      return { ...block, lines: wrapText(ctx, block.text, available) };
    });
    canvas.width = width;
    canvas.height = 260 + (image ? 560 : 0) +
      blocks.reduce((height, block) => height + block.lines.length * block.line + block.gap, 0);
    ctx.fillStyle = "#f7f7f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#002fa7";
    ctx.fillRect(0, 0, width, 14);
    ctx.textBaseline = "top";
    ctx.font = "700 36px " + font;
    ctx.fillText(example ? "初见雷达 / 示例报告" : "初见雷达", inset, 67);
    let y = 147;
    if (image) {
      coverImage(ctx, image, inset, y, available, 516);
      y += 560;
    }
    for (const block of blocks) {
      ctx.font = block.font + " " + font;
      ctx.fillStyle = block.color;
      for (const line of block.lines) {
        ctx.fillText(line, inset, y);
        y += block.line;
      }
      y += block.gap;
    }
    ctx.fillStyle = "#d5d5dc";
    ctx.fillRect(inset, y + 25, available, 2);
    ctx.fillStyle = "#575761";
    ctx.font = "400 23px " + font;
    ctx.fillText(example && image ? "照片 / Michael Dam · Unsplash" : "你给陌生人的第一印象", inset, y + 48);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("无法创建分享图片。");
    const url = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement("a"), { href: url, download: "初见雷达-分享卡.png" });
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    if (currentReport === snapshot) el("share-status").textContent = "分享卡已生成，请查看浏览器的下载。";
  } catch {
    if (currentReport === snapshot) el("share-status").textContent = "分享卡生成失败，请再试一次。";
  } finally {
    exporting = false;
    el("download").disabled = false;
  }
}

for (const id of ["pick", "change", "again"]) el(id).addEventListener("click", choose);
for (const id of ["example", "header-example", "cover-example"]) {
  el(id).addEventListener("click", () => showReport(sample, samplePhoto, true));
}
photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  photoInput.value = "";
  select(file);
});
el("upload-form").addEventListener("submit", analyze);
const zone = el("upload-zone");
zone.addEventListener("dragover", event => {
  event.preventDefault();
  zone.classList.add("dragging");
});
zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
zone.addEventListener("drop", event => {
  event.preventDefault();
  zone.classList.remove("dragging");
  select(event.dataTransfer.files[0]);
});
el("download").addEventListener("click", saveCard);
