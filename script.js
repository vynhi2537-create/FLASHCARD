let currentCardIndex = 0;
let cardData = JSON.parse(localStorage.getItem("flashcards")) || [
  { hanzi: "我", pinyin: "Wǒ", meaning: "Tôi", note: "Chỉ bản thân" },
  { hanzi: "你", pinyin: "Nǐ", meaning: "Bạn", note: "Người đối diện" },
  { hanzi: "他", pinyin: "Tā", meaning: "Anh ấy", note: "Người nam" },
];

document.addEventListener("DOMContentLoaded", () => {
  renderCard();
  if (window.lucide && lucide.createIcons) lucide.createIcons();
});

// 🃏 Lật thẻ
function flipCard() {
  document.getElementById("flashcard").classList.toggle("flipped");
}

// ⏭ / ⏮
function showNextCard() {
  currentCardIndex = (currentCardIndex + 1) % cardData.length;
  renderCard();
  showReward("🎉");
}
function showPrevCard() {
  currentCardIndex = (currentCardIndex - 1 + cardData.length) % cardData.length;
  renderCard();
}

// 🔊 Phát âm
function speakCurrentWord(text = null) {
  const word = text || cardData[currentCardIndex].hanzi;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "zh-CN";
  speechSynthesis.speak(utterance);
}

// 🖼 Hiển thị thẻ
function renderCard() {
  const card = cardData[currentCardIndex];
  document.getElementById("hanzi").innerText = card.hanzi;
  document.getElementById("pinyin").innerText = card.pinyin;
  document.getElementById("meaning").innerText = card.meaning;
  document.getElementById("note").innerText = card.note || "";
}

// 🧠 Thêm từ mới
document.getElementById("add-card-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const newCard = {
    hanzi: document.getElementById("new-hanzi").value.trim(),
    pinyin: document.getElementById("new-pinyin").value.trim(),
    meaning: document.getElementById("new-meaning").value.trim(),
    note: document.getElementById("new-tip").value.trim() || "Chưa có cách nhớ.",
    reward: document.getElementById("new-reward").value.trim() || null,
  };
  if (!newCard.hanzi || !newCard.pinyin || !newCard.meaning)
    return alert("Vui lòng điền đủ thông tin!");
  cardData.push(newCard);
  localStorage.setItem("flashcards", JSON.stringify(cardData));
  renderCard();
  document.getElementById("add-card-form").reset();
  document.getElementById("save-status").textContent = "✅ Đã thêm từ mới!";
  setTimeout(() => (document.getElementById("save-status").textContent = ""), 2000);
  showReward("💖");
}

// 🎁 Phần thưởng
function showReward(icon) {
  const reward = document.getElementById("reward");
  reward.innerText = icon;
  reward.classList.remove("hidden");
  setTimeout(() => reward.classList.add("hidden"), 1000);
}

/* ==============================
 🤖 HỘI THOẠI AI & KIỂM TRA NGHĨA
============================== */

let conversation = null;
let challengeIndex = 0;

window.startConversationPractice = async function () {
  const word = cardData[currentCardIndex].hanzi;
  const pinyin = cardData[currentCardIndex].pinyin;
  const meaning = cardData[currentCardIndex].meaning;

  document.getElementById("conversation-area").classList.remove("hidden");
  document.getElementById("conversation-content").innerHTML = `
    <p class="text-gray-500">🪄 Giả lập hội thoại với từ: <b>${word}</b></p>`;

  conversation = {
    title: `Hội thoại với ${word}`,
    sentences: [
      { speaker: "A", chinese: `${word} 你好吗？`, pinyin: `${pinyin} nǐ hǎo ma?`, vietnamese: `${meaning} — bạn khỏe không?` },
      { speaker: "B", chinese: `我很好，谢谢。`, pinyin: `Wǒ hěn hǎo, xièxie.`, vietnamese: `Mình khỏe, cảm ơn.` },
    ],
    challenge_hanzi: `${word} 你好吗？`,
    challenge_pinyin_answer: `${pinyin} nǐ hǎo ma?`,
    challenge_viet_answer: `${meaning} — bạn khỏe không?`,
  };

  renderConversation(conversation);
  setupChallenge(conversation);
};

function renderConversation(conv) {
  const convContent = document.getElementById("conversation-content");
  let html = `<h3 class="text-xl font-bold text-gray-700 mb-3">${conv.title}</h3>`;
  conv.sentences.forEach((s, i) => {
    const isA = i % 2 === 0;
    const color = isA ? "bg-neon-teal" : "bg-neon-pink";
    html += `
      <div class="flex ${isA ? "justify-start" : "justify-end"} mb-2">
        <div class="max-w-[80%] p-3 rounded-xl shadow-md text-white ${color}">
          <p class="text-lg font-semibold">${s.chinese}</p>
          <p class="text-sm italic">${s.pinyin}</p>
          <p class="text-xs mt-1 opacity-80">${s.vietnamese}</p>
        </div>
      </div>`;
  });
  convContent.innerHTML = html;
}

function setupChallenge(conv) {
  document.getElementById("challenge-text").textContent = `Dịch câu: ${conv.challenge_hanzi}`;
  document.getElementById("challenge-input").value = "";
  document.getElementById("challenge-feedback").textContent = "";
}

function normalizePinyin(s) {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[1-5]/g, "");
}

window.checkChallenge = function () {
  if (!conversation) return alert("Chưa có hội thoại để kiểm tra!");

  const inputRaw = document.getElementById("challenge-input").value.trim().toLowerCase();
  const expectedViet = conversation.challenge_viet_answer.toLowerCase();
  const expectedPinyin = normalizePinyin(conversation.challenge_pinyin_answer);

  const feedbackEl = document.getElementById("challenge-feedback");
  let correct = false;

  if (normalizePinyin(inputRaw) === expectedPinyin) correct = true;
  else if (inputRaw === expectedViet) correct = true;
  else if (expectedViet.includes(inputRaw) || inputRaw.includes(expectedViet)) correct = true;
  else {
    const keywords = expectedViet.split(" ").filter(w => w.length > 2);
    if (keywords.some(k => inputRaw.includes(k))) correct = true;
  }

  if (correct) {
    feedbackEl.className = "mt-2 text-green-600 font-semibold";
    feedbackEl.textContent = "✅ Chính xác! Giỏi lắm!";
    showReward("🏆");
  } else {
    feedbackEl.className = "mt-2 text-red-600 font-semibold";
    feedbackEl.textContent = "❌ Sai rồi, thử lại nhé (chấp nhận cả nghĩa gần đúng).";
  }
};
