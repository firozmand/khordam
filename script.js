const meals = [
    {
        title: "مرحله ۱ - صبحانه",
        suggestions: ["یک کف دست نان سنگک و پنیر", "یک کف دست نان سنگل", "چهار تخم مرغ ", "سه تخم مرغ "]
    },
    {
        title: "مرحله ۲ - میان‌وعده صبح",
        suggestions: ["چای", "30 گرم پروتئین ", "100 میلیلیتر شیر ", "موز ", "سیب ", "پرو میلک کاله با 40 گرم پروتئین "]
    },
    {
        title: "مرحله ۳ - ناهار",
        suggestions: ["150 گرم گوشت ", "150 گرم مرغ ", "قرمه", "قیمه", "12 قاشق برنج", "یک بشقاب سالاد  "]
    },
    {
        title: "مرحله ۴ - میان‌وعده عصر",
        suggestions: ["چای", "30 گرم پروتئین ", "100 میلیلیتر شیر ", "موز ", "سیب ", "پرو میلک کاله با 40 گرم پروتئین "]
    },
    {
        title: "مرحله ۵ - شام",
        suggestions: ["150 گرم فیله مرغ ", "150 گرم گوشت ", "یک تن ماهی ", "نصف تن ماهی ", "نان رژیمی قهوه ای 55 گرمی  ", "یک کف دست نان سنگک ", "یک بشقاب سالاد  "]
    },
    {
        title: "مرحله ۶ - قبل خواب",
        suggestions: ["چای", "30 گرم پروتئین ", "100 میلیلیتر شیر ", "موز ", "سیب ", "پرو میلک کاله با 40 گرم پروتئین "]
    }
];

let currentStep = 0;
let records = new Array(meals.length).fill("");

const intro = document.getElementById("intro");
const stepSection = document.getElementById("step");
const resultSection = document.getElementById("result");
const mealTitle = document.getElementById("mealTitle");
const mealInput = document.getElementById("mealInput");
const suggestionGrid = document.getElementById("suggestionGrid");
const reportBox = document.getElementById("reportBox");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const copyBtn = document.getElementById("copyBtn");
const homeBtn = document.getElementById("homeBtn");
const resetBtn = document.getElementById("resetBtn");
const aboutBtn = document.getElementById("aboutBtn");
const installBtn = document.getElementById("installBtn");

const aboutModal = document.getElementById("aboutModal");
const closeAboutBtn = document.getElementById("closeAboutBtn");

function showOnly(section) {
    intro.classList.add("hidden");
    stepSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    aboutModal.classList.add("hidden");
    section.classList.remove("hidden");
}

function renderStep() {
    const meal = meals[currentStep];
    mealTitle.textContent = meal.title;
    mealInput.value = records[currentStep] || "";
    suggestionGrid.innerHTML = "";

    meal.suggestions.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "suggestion-box";
        btn.type = "button";
        btn.textContent = item;
        btn.addEventListener("click", () => {
            mealInput.value = mealInput.value
                ? `${mealInput.value}، ${item}`
                : item;
        });
        suggestionGrid.appendChild(btn);
    });

    nextBtn.textContent = currentStep === meals.length - 1 ? "مشاهده نتیجه" : "مرحله بعد";
    showOnly(stepSection);
}

function renderReport() {
    const html = meals.map((meal, index) => {
        const value = records[index]?.trim() || "ثبت نشده";
        return `
      <div class="report-item">
        <strong>${meal.title}</strong>
        <p>${value}</p>
      </div>
    `;
    }).join("");

    reportBox.innerHTML = html;
    showOnly(resultSection);
}

function resetApp() {
    currentStep = 0;
    records = new Array(meals.length).fill("");
    mealInput.value = "";
    showOnly(intro);
}

startBtn.addEventListener("click", () => {
    currentStep = 0;
    renderStep();
});

nextBtn.addEventListener("click", () => {
    records[currentStep] = mealInput.value.trim();

    if (currentStep < meals.length - 1) {
        currentStep += 1;
        renderStep();
    } else {
        renderReport();
    }
});

copyBtn.addEventListener("click", async () => {
    const text = meals.map((meal, index) => {
        const value = records[index]?.trim() || "ثبت نشده";
        return `${meal.title}: ${value}`;
    }).join("\n");

    try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "کپی شد";
        setTimeout(() => {
            copyBtn.textContent = "کپی";
        }, 1500);
    } catch {
        copyBtn.textContent = "خطا";
        setTimeout(() => {
            copyBtn.textContent = "کپی";
        }, 1500);
    }
});

homeBtn.addEventListener("click", () => {
    showOnly(intro);
});

resetBtn.addEventListener("click", resetApp);

aboutBtn.addEventListener("click", () => {
    aboutModal.classList.remove("hidden");
});

closeAboutBtn.addEventListener("click", () => {
    aboutModal.classList.add("hidden");
});

/* PWA install */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
    installBtn.classList.add("hidden");
});


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => console.log("Service Worker registered"))
            .catch(err => console.log("SW registration failed:", err));
    });
}

showOnly(intro);
