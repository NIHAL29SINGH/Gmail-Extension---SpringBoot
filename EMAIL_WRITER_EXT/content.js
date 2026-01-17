console.log("✅ Email Writer Loaded");

/* =========================
   TYPEWRITER EFFECT
========================= */
function typeWriter(el, text, speed = 18) {
  el.textContent = "";
  let i = 0;

  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

/* =========================
   GET EMAIL CONTENT
========================= */
function getEmailContent() {
  const selectors = [".h7", ".a3s.aiL", ".gmail_quote"];
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return el.innerText.trim();
  }
  return "";
}

/* =========================
   FIND TOOLBAR
========================= */
function findComposeToolbar() {
  return document.querySelector(".btC");
}

/* =========================
   CREATE UI
========================= */
function createAIReplyUI() {
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.display = "inline-flex";
  container.style.marginRight = "6px";

  /* BUTTON */
  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl";
  button.textContent = "AI Reply";
  button.style.background = "#1a73e8";
  button.style.color = "white";
  button.style.borderRadius = "18px";
  button.style.padding = "0 14px";
  button.style.fontWeight = "500";

  /* PANEL */
  const panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.bottom = "45px";
  panel.style.left = "0";
  panel.style.width = "260px";
  panel.style.background = "#fff";
  panel.style.borderRadius = "14px";
  panel.style.padding = "12px";
  panel.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  panel.style.display = "none";
  panel.style.zIndex = "9999";
  panel.style.boxSizing = "border-box";

  panel.innerHTML = `
    <div style="display:flex; gap:6px; margin-bottom:8px;">
      <button class="tone-btn" data-tone="friendly">😊 Friendly</button>
      <button class="tone-btn" data-tone="casual">🙂 Casual</button>
      <button class="tone-btn" data-tone="formal">🧑‍💼 Formal</button>
    </div>

    <div style="display:flex; gap:6px; margin-bottom:8px;">
      <button class="lang-btn" data-lang="english">English</button>
      <button class="lang-btn" data-lang="hindi">Hindi</button>
    </div>

    <textarea
      class="ai-prompt"
      placeholder="Optional instruction..."
      style="
        width:100%;
        height:65px;
        padding:8px;
        border-radius:10px;
        border:1px solid #dadce0;
        resize:none;
        font-size:13px;
        box-sizing:border-box;
        background:#f8f9fa;
      "
    ></textarea>

    <button
      class="generate-btn"
      style="
        margin-top:10px;
        width:100%;
        padding:9px;
        border-radius:20px;
        border:none;
        background:#1a73e8;
        color:white;
        font-weight:600;
        cursor:pointer;
      "
    >
      Generate
    </button>
  `;

  // Style buttons
  panel.querySelectorAll(".tone-btn, .lang-btn").forEach(btn => {
    btn.style.flex = "1";
    btn.style.padding = "6px";
    btn.style.borderRadius = "10px";
    btn.style.border = "1px solid #dadce0";
    btn.style.background = "#f1f3f4";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";
  });

  container.appendChild(button);
  container.appendChild(panel);

  return { container, button, panel };
}

/* =========================
   INJECT UI
========================= */
function inject() {
  if (document.querySelector(".ai-reply-injected")) return;

  const toolbar = findComposeToolbar();
  if (!toolbar) return;

  const { container, button, panel } = createAIReplyUI();
  container.classList.add("ai-reply-injected");

  toolbar.insertBefore(container, toolbar.firstChild);

  let selectedTone = "professional";
  let selectedLang = "english";

  // Toggle panel
  button.onclick = (e) => {
    e.stopPropagation();
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  };

  document.addEventListener("click", () => {
    panel.style.display = "none";
  });

  panel.onclick = e => e.stopPropagation();

  // Tone
  panel.querySelectorAll(".tone-btn").forEach(btn => {
    btn.onclick = () => {
      selectedTone = btn.dataset.tone;
      panel.querySelectorAll(".tone-btn").forEach(b => b.style.background = "#f1f3f4");
      btn.style.background = "#d2e3fc";
    };
  });

  // Language
  panel.querySelectorAll(".lang-btn").forEach(btn => {
    btn.onclick = () => {
      selectedLang = btn.dataset.lang;
      panel.querySelectorAll(".lang-btn").forEach(b => b.style.background = "#f1f3f4");
      btn.style.background = "#d2e3fc";
    };
  });

  // Generate
  panel.querySelector(".generate-btn").onclick = async () => {
    panel.style.display = "none";

    const emailContent = getEmailContent();
    const customPrompt = panel.querySelector(".ai-prompt").value;

    const res = await fetch("http://localhost:8080/api/email/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailContent,
        tone: selectedTone,
        language: selectedLang,
        customPrompt
      })
    });

    const reply = await res.text();
    const box = document.querySelector('[role="textbox"][g_editable="true"]');

    if (box) {
      box.focus();
      typeWriter(box, reply);
    }
  };
}

/* =========================
   OBSERVER
========================= */
new MutationObserver(() => setTimeout(inject, 300))
  .observe(document.body, { childList: true, subtree: true });
