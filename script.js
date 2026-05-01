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
const analysisSection = document.getElementById("analysis");
const mealTitle = document.getElementById("mealTitle");
const mealInput = document.getElementById("mealInput");
const suggestionGrid = document.getElementById("suggestionGrid");
const reportBox = document.getElementById("reportBox");
const analysisResult = document.getElementById("analysisResult");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const copyBtn = document.getElementById("copyBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const homeBtn = document.getElementById("homeBtn");
const resetBtn = document.getElementById("resetBtn");
const aboutBtn = document.getElementById("aboutBtn");
const installBtn = document.getElementById("installBtn");
const backFromAnalysisBtn = document.getElementById("backFromAnalysisBtn");

const aboutModal = document.getElementById("aboutModal");
const closeAboutBtn = document.getElementById("closeAboutBtn");

// دیتابیس کالری و پروتئین
const foodDatabase = {
    // نان‌ها
    "نان سنگک": { calories: 80, protein: 2.5, unit: "کف دست" },
    "نان سنگل": { calories: 85, protein: 2.8, unit: "کف دست" },
    "نان رژیمی": { calories: 140, protein: 5, unit: "55 گرم" },
    "نان": { calories: 80, protein: 2.5, unit: "کف دست" },

    // پروتئین‌ها
    "تخم مرغ": { calories: 70, protein: 6, unit: "عدد" },
    "پنیر": { calories: 60, protein: 4, unit: "30 گرم" },
    "گوشت": { calories: 250, protein: 26, unit: "100 گرم" },
    "مرغ": { calories: 165, protein: 31, unit: "100 گرم" },
    "فیله مرغ": { calories: 165, protein: 31, unit: "100 گرم" },
    "تن ماهی": { calories: 180, protein: 25, unit: "کامل" },

    // غذاها
    "قرمه": { calories: 350, protein: 15, unit: "پرس" },
    "قیمه": { calories: 380, protein: 18, unit: "پرس" },
    "برنج": { calories: 35, protein: 0.8, unit: "قاشق" },
    "سالاد": { calories: 50, protein: 2, unit: "بشقاب" },

    // میان‌وعده‌ها
    "پروتئین": { calories: 120, protein: 18, unit: "30 گرم" },
    "شیر": { calories: 64, protein: 3.2, unit: "100 میلی‌لیتر" },
    "موز": { calories: 105, protein: 1.3, unit: "عدد" },
    "سیب": { calories: 95, protein: 0.5, unit: "عدد" },
    "پرو میلک": { calories: 160, protein: 40, unit: "بطری" },
    "چای": { calories: 2, protein: 0, unit: "لیوان" }
};

function showOnly(section) {
    intro.classList.add("hidden");
    stepSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    analysisSection.classList.add("hidden");
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

function parseFood(text) {
    let totalCalories = 0;
    let totalProtein = 0;
    const items = [];

    // تمیز کردن متن
    text = text.toLowerCase().trim();

    // جدا کردن آیتم‌ها با کاما یا و
    const parts = text.split(/[،,و]+/).map(p => p.trim()).filter(p => p);

    parts.forEach(part => {
        // استخراج عدد
        const numberMatch = part.match(/(\d+(?:\.\d+)?)/);
        let quantity = numberMatch ? parseFloat(numberMatch[1]) : 1;

        // پیدا کردن غذا در دیتابیس
        let found = false;
        for (let [key, value] of Object.entries(foodDatabase)) {
            if (part.includes(key)) {
                let multiplier = 1;

                // محاسبه ضریب بر اساس واحد
                if (value.unit === "100 گرم" && part.includes("گرم")) {
                    multiplier = quantity / 100;
                } else if (value.unit === "کف دست" && part.includes("کف")) {
                    multiplier = quantity;
                } else if (value.unit === "قاشق" && part.includes("قاشق")) {
                    multiplier = quantity;
                } else if (value.unit === "عدد") {
                    multiplier = quantity;
                } else if (value.unit === "55 گرم" && part.includes("گرم")) {
                    multiplier = quantity / 55;
                } else if (value.unit === "100 میلی‌لیتر" && part.includes("میلی")) {
                    multiplier = quantity / 100;
                } else if (value.unit === "کامل") {
                    if (part.includes("نصف")) multiplier = 0.5;
                    else multiplier = quantity;
                } else if (value.unit === "بطری" || value.unit === "پرس" || value.unit === "بشقاب" || value.unit === "لیوان") {
                    multiplier = quantity;
                } else {
                    multiplier = quantity;
                }

                const cal = Math.round(value.calories * multiplier);
                const prot = Math.round(value.protein * multiplier * 10) / 10;

                totalCalories += cal;
                totalProtein += prot;

                items.push({
                    name: part,
                    calories: cal,
                    protein: prot
                });

                found = true;
                break;
            }
        }

        if (!found && part.length > 2) {
            items.push({
                name: part,
                calories: 0,
                protein: 0,
                unknown: true
            });
        }
    });

    return { totalCalories, totalProtein, items };
}

function analyzeDaily() {
    let totalCalories = 0;
    let totalProtein = 0;
    const allItems = [];

    records.forEach((record, index) => {
        if (record && record.trim() !== "") {
            const parsed = parseFood(record);
            totalCalories += parsed.totalCalories;
            totalProtein += parsed.totalProtein;
            allItems.push({
                meal: meals[index].title,
                items: parsed.items
            });
        }
    });

    // محاسبات BMR و TDEE
    const weight = 118; // kg
    const height = 180; // cm
    const age = 26;

    // فرمول Mifflin-St Jeor برای مرد
    const BMR = Math.round(10 * weight + 6.25 * height - 5 * age + 5);

    // TDEE با فعالیت پیاده‌روی روزانه (ضریب 1.4)
    const TDEE = Math.round(BMR * 1.4);

    // کالری هدف برای کاهش 5 کیلو در 30 روز (کسری 800 کالری)
    const targetCalories = TDEE - 800;

    // پروتئین هدف (1.6 گرم به ازای هر کیلو)
    const targetProtein = Math.round(weight * 1.6);

    return {
        totalCalories,
        totalProtein,
        targetCalories,
        targetProtein,
        BMR,
        TDEE,
        allItems
    };
}

function generateAnalysisReport(data) {
    const calorieDiff = data.totalCalories - data.targetCalories;
    const proteinDiff = data.totalProtein - data.targetProtein;

    let verdict = "";
    if (Math.abs(calorieDiff) <= 100 && proteinDiff >= -10) {
        verdict = "عالی بود! 🎉 رژیمت دقیقاً روی هدفه";
    } else if (calorieDiff > 200) {
        verdict = "کالری زیاد بود ⚠️ فردا کمتر بخور";
    } else if (calorieDiff < -200) {
        verdict = "کالری خیلی کم بود! 😟 بدن نیاز به انرژی داره";
    } else if (proteinDiff < -20) {
        verdict = "پروتئین کمه! 💪 عضله از دست میدی";
    } else {
        verdict = "خوب بود ✅ ادامه بده";
    }

    const goodFoods = [];
    const badFoods = [];

    data.allItems.forEach(meal => {
        meal.items.forEach(item => {
            if (item.name.includes("سالاد") || item.name.includes("سیب") ||
                item.name.includes("پروتئین") || item.name.includes("مرغ") ||
                item.name.includes("تخم مرغ")) {
                goodFoods.push(item.name);
            }
            if (item.name.includes("قیمه") || item.name.includes("قرمه") ||
                (item.name.includes("برنج") && item.calories > 300)) {
                badFoods.push(item.name);
            }
        });
    });

    let report = `<div class="analysis-header">📊 تحلیل رژیم امروز</div>\n\n`;

    report += `<div class="stat-box">`;
    report += `<div class="stat-item">`;
    report += `<span class="stat-label">کالری دریافتی:</span>`;
    report += `<span class="stat-value ${calorieDiff > 100 ? 'bad' : 'good'}">${data.totalCalories} کالری</span>`;
    report += `</div>`;
    report += `<div class="stat-item">`;
    report += `<span class="stat-label">کالری هدف:</span>`;
    report += `<span class="stat-value">${data.targetCalories} کالری</span>`;
    report += `</div>`;
    report += `</div>\n\n`;

    report += `<div class="stat-box">`;
    report += `<div class="stat-item">`;
    report += `<span class="stat-label">پروتئین دریافتی:</span>`;
    report += `<span class="stat-value ${proteinDiff < -10 ? 'bad' : 'good'}">${data.totalProtein}g</span>`;
    report += `</div>`;
    report += `<div class="stat-item">`;
    report += `<span class="stat-label">پروتئین هدف:</span>`;
    report += `<span class="stat-value">${data.targetProtein}g</span>`;
    report += `</div>`;
    report += `</div>\n\n`;

    report += `<div class="verdict-box ${calorieDiff > 100 ? 'warning' : 'success'}">${verdict}</div>\n\n`;

    if (goodFoods.length > 0) {
        report += `<div class="food-section good">`;
        report += `<div class="section-title">✅ چیزای خوب که خوردی:</div>`;
        goodFoods.slice(0, 3).forEach(food => {
            report += `<div class="food-item">• ${food} - عالیه! پروتئین بالا و کالری مناسب</div>`;
        });
        report += `</div>\n\n`;
    }

    if (badFoods.length > 0) {
        report += `<div class="food-section bad">`;
        report += `<div class="section-title">❌ چیزایی که بهتره کمتر بخوری:</div>`;
        badFoods.slice(0, 2).forEach(food => {
            report += `<div class="food-item">• ${food} - کالری زیاد، چربی بالا</div>`;
        });
        report += `</div>\n\n`;
    }

    report += `<div class="tips-box">`;
    report += `<div class="tips-title">💡 توصیه‌های امروز:</div>`;
    if (proteinDiff < -10) {
        report += `<div class="tip">• پروتئین بیشتر بخور (تخم مرغ، مرغ، پروتئین پودر)</div>`;
    }
    if (calorieDiff > 100) {
        report += `<div class="tip">• فردا برنج و نان رو کم کن</div>`;
    }
    report += `<div class="tip">• حداقل 2.5 لیتر آب بخور 💧</div>`;
    report += `<div class="tip">• خواب 7-8 ساعته رو فراموش نکن 😴</div>`;
    report += `</div>`;

    return report;
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
        copyBtn.textContent = "کپی شد ✓";
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

analyzeBtn.addEventListener("click", () => {
    const analysis = analyzeDaily();
    const report = generateAnalysisReport(analysis);
    analysisResult.innerHTML = report;
    showOnly(analysisSection);
});

backFromAnalysisBtn.addEventListener("click", () => {
    showOnly(resultSection);
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
