const meals = window.MEALS || [];
const foodDatabase = window.FOOD_DATABASE || {};
const defaultProfile = window.DEFAULT_PROFILE || {};
const PROFILE_STORAGE_KEY = "food_profile_v1";

let currentStep = 0;
let records = new Array(meals.length).fill("");
let profile = loadProfile();

const intro = document.getElementById("intro");
const stepSection = document.getElementById("step");
const resultSection = document.getElementById("result");
const analysisSection = document.getElementById("analysis");
const profileSection = document.getElementById("profile");
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
const profileBtn = document.getElementById("profileBtn");
const resetBtn = document.getElementById("resetBtn");
const aboutBtn = document.getElementById("aboutBtn");
const installBtn = document.getElementById("installBtn");
const backFromAnalysisBtn = document.getElementById("backFromAnalysisBtn");

const profileName = document.getElementById("profileName");
const profileAge = document.getElementById("profileAge");
const profileWeight = document.getElementById("profileWeight");
const profileHeight = document.getElementById("profileHeight");
const profileActivity = document.getElementById("profileActivity");
const profileGender = document.getElementById("profileGender");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const aboutModal = document.getElementById("aboutModal");
const closeAboutBtn = document.getElementById("closeAboutBtn");

const numberWords = {
    "یک": 1,
    "دو": 2,
    "سه": 3,
    "چهار": 4,
    "پنج": 5,
    "شش": 6,
    "هفت": 7,
    "هشت": 8,
    "نه": 9,
    "ده": 10,
    "نصف": 0.5
};

const sortedFoodKeys = Object.keys(foodDatabase).sort((a, b) => b.length - a.length);

function normalizeDigits(value) {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
    let output = value;
    for (let i = 0; i < 10; i += 1) {
        output = output.replaceAll(persianDigits[i], String(i));
        output = output.replaceAll(arabicDigits[i], String(i));
    }
    return output;
}

function loadProfile() {
    try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) {
            return { ...defaultProfile };
        }
        const parsed = JSON.parse(raw);
        return { ...defaultProfile, ...parsed };
    } catch {
        return { ...defaultProfile };
    }
}

function saveProfile() {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function fillProfileForm() {
    profileName.value = profile.name || "";
    profileAge.value = profile.age || 26;
    profileWeight.value = profile.weightKg || 117;
    profileHeight.value = profile.heightCm || 180;
    profileActivity.value = profile.activityFactor || 1.4;
    profileGender.value = profile.gender || "male";
}

function applyProfileForm() {
    profile = {
        ...profile,
        name: profileName.value.trim() || "کاربر",
        age: Number(profileAge.value) || 26,
        weightKg: Number(profileWeight.value) || 117,
        heightCm: Number(profileHeight.value) || 180,
        activityFactor: Number(profileActivity.value) || 1.4,
        gender: profileGender.value || "male"
    };
    saveProfile();
}

function showOnly(section) {
    intro.classList.add("hidden");
    stepSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    analysisSection.classList.add("hidden");
    profileSection.classList.add("hidden");
    aboutModal.classList.add("hidden");
    section.classList.remove("hidden");
}

function renderStep() {
    const meal = meals[currentStep];
    mealTitle.textContent = meal.title;
    mealInput.value = records[currentStep] || "";
    suggestionGrid.innerHTML = "";

    meal.suggestions.forEach((item, index) => {
        const btn = document.createElement("button");
        btn.className = "suggestion-box";
        btn.type = "button";
        btn.textContent = `${index + 1}) ${item}`;
        btn.addEventListener("click", () => {
            mealInput.value = mealInput.value ? `${mealInput.value}، ${item}` : item;
        });
        suggestionGrid.appendChild(btn);
    });

    nextBtn.textContent = currentStep === meals.length - 1 ? "مشاهده نتیجه" : "مرحله بعد";
    showOnly(stepSection);
}

function expandNumberReference(part, mealIndex) {
    const normalizedPart = normalizeDigits(part);
    const match = normalizedPart.match(/شماره\s*(\d+)/);
    if (!match) {
        return normalizedPart;
    }
    const suggestionIndex = Number(match[1]) - 1;
    const suggestion = meals[mealIndex]?.suggestions?.[suggestionIndex];
    return suggestion || normalizedPart;
}

function extractQuantity(text) {
    const normalized = normalizeDigits(text);
    const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
        return Number(numberMatch[1]);
    }

    for (const [word, value] of Object.entries(numberWords)) {
        if (normalized.includes(word)) {
            return value;
        }
    }
    return 1;
}

function computeMultiplier(food, part, quantity) {
    let multiplier = quantity;

    if (food.unit === "100 گرم" && part.includes("گرم")) {
        multiplier = quantity / 100;
    } else if (food.unit === "55 گرم" && part.includes("گرم")) {
        multiplier = quantity / 55;
    } else if (food.unit === "100 میلی لیتر" && (part.includes("میلی") || part.includes("ml"))) {
        multiplier = quantity / 100;
    } else if (food.unit === "کامل") {
        multiplier = part.includes("نصف") ? 0.5 : quantity;
    } else if (part.includes("نصف")) {
        multiplier = quantity === 1 ? 0.5 : quantity * 0.5;
    }

    if (part.includes("قاشق") && part.includes("ماست یونانی")) {
        multiplier = (quantity * 15) / 100;
    }

    if (food.unit === "بطری" || food.unit === "پرس" || food.unit === "بشقاب" || food.unit === "لیوان") {
        multiplier = quantity;
    }

    if (food.unit === "30 گرم" && part.includes("گرم")) {
        multiplier = quantity / 30;
    }

    return multiplier;
}

function parseFood(text, mealIndex) {
    let totalCalories = 0;
    let totalProtein = 0;
    const items = [];

    const normalized = normalizeDigits(text.toLowerCase().trim());
    const parts = normalized.split(/[،,]+|\s+و\s+/).map((p) => p.trim()).filter(Boolean);

    parts.forEach((rawPart) => {
        const part = expandNumberReference(rawPart, mealIndex);
        const quantity = extractQuantity(part);

        let foundKey = "";
        for (const key of sortedFoodKeys) {
            if (part.includes(key)) {
                foundKey = key;
                break;
            }
        }

        if (!foundKey) {
            items.push({ name: part, calories: 0, protein: 0, unknown: true });
            return;
        }

        const food = foodDatabase[foundKey];
        const multiplier = computeMultiplier(food, part, quantity);
        const calories = Math.round(food.calories * multiplier);
        const proteinValue = Math.round(food.protein * multiplier * 10) / 10;

        totalCalories += calories;
        totalProtein += proteinValue;
        items.push({
            name: part,
            matched: foundKey,
            calories,
            protein: proteinValue
        });
    });

    return { totalCalories, totalProtein, items };
}

function renderReport() {
    const html = meals.map((meal, index) => {
        const value = records[index]?.trim() || "ثبت نشده";
        const suggestions = meal.suggestions.slice(0, 3).map((item, i) => `${i + 1}) ${item}`).join(" | ");
        return `
      <div class="report-item">
        <strong>${meal.title}</strong>
        <p>${value}</p>
        <p>پیشنهادهای این وعده: ${suggestions}</p>
      </div>
    `;
    }).join("");

    reportBox.innerHTML = html;
    showOnly(resultSection);
}

function analyzeDaily() {
    let totalCalories = 0;
    let totalProtein = 0;
    const allItems = [];
    let saladCount = 0;
    let completedMeals = 0;

    records.forEach((record, index) => {
        if (!record || record.trim() === "") {
            return;
        }

        completedMeals += 1;
        const parsed = parseFood(record, index);
        totalCalories += parsed.totalCalories;
        totalProtein += parsed.totalProtein;
        allItems.push({ meal: meals[index].title, items: parsed.items });

        parsed.items.forEach((item) => {
            if (item.matched === "سالاد") {
                saladCount += 1;
            }
        });
    });

    const sparklingWaterCalories = (profile.sparklingWaterCaloriesPer240ml || 0) * completedMeals;
    const dressingCalories = (profile.dressingCaloriesPer15g || 4) * saladCount;

    totalCalories += sparklingWaterCalories + dressingCalories;

    const weight = Number(profile.weightKg) || 117;
    const height = Number(profile.heightCm) || 180;
    const age = Number(profile.age) || 26;
    const activityFactor = Number(profile.activityFactor) || 1.4;
    const genderShift = profile.gender === "female" ? -161 : 5;

    const BMR = Math.round((10 * weight) + (6.25 * height) - (5 * age) + genderShift);
    const TDEE = Math.round(BMR * activityFactor);

    const aggressiveDeficit = Math.round((5 * 7700) / 30);
    const minimumSafe = profile.gender === "female" ? 1200 : 1500;
    const targetCalories = Math.max(minimumSafe, TDEE - aggressiveDeficit);
    const targetProtein = Math.round(weight * 1.8);

    return {
        totalCalories,
        totalProtein,
        targetCalories,
        targetProtein,
        BMR,
        TDEE,
        allItems,
        completedMeals,
        extras: {
            sparklingWaterCalories,
            dressingCalories
        }
    };
}

function evaluateFoods(allItems) {
    const goodFoods = [];
    const badFoods = [];

    allItems.forEach((meal) => {
        meal.items.forEach((item) => {
            const name = item.name;
            if (name.includes("سالاد") || name.includes("سیب") || name.includes("پروتئین") || name.includes("مرغ") || name.includes("تخم مرغ")) {
                goodFoods.push(name);
            }
            if (name.includes("قیمه") || name.includes("قرمه") || (name.includes("برنج") && item.calories >= 300)) {
                badFoods.push(name);
            }
        });
    });

    return { goodFoods, badFoods };
}

function generateAnalysisReport(data) {
    const calorieDiff = data.totalCalories - data.targetCalories;
    const proteinDiff = data.totalProtein - data.targetProtein;
    const { goodFoods, badFoods } = evaluateFoods(data.allItems);

    let verdict = "برایند: متوسط ✅ با کمی تنظیم بهتر میشه";
    if (calorieDiff > 250) {
        verdict = "برایند: کالری بالاست ⚠️ بهتره نان و برنج کم بشه";
    } else if (calorieDiff < -350) {
        verdict = "برایند: کالری خیلی پایینه ⚠️ کمبود انرژی نداشته باش";
    } else if (proteinDiff < -20) {
        verdict = "برایند: پروتئین کم بوده 💪 بهتره پروتئین وعده ها بیشتر بشه";
    } else if (Math.abs(calorieDiff) <= 120 && proteinDiff >= -10) {
        verdict = "برایند: خیلی خوب بود 🎉";
    }

    let report = `<div class="analysis-header">📊 تحلیل رژیم امروز</div>`;
    report += `<div class="stat-box"><div class="stat-item"><span class="stat-label">کالری دریافتی</span><span class="stat-value ${calorieDiff > 120 ? "bad" : "good"}">${data.totalCalories}</span></div><div class="stat-item"><span class="stat-label">کالری هدف</span><span class="stat-value">${data.targetCalories}</span></div></div>`;
    report += `<div class="stat-box"><div class="stat-item"><span class="stat-label">پروتئین دریافتی (گرم)</span><span class="stat-value ${proteinDiff < -10 ? "bad" : "good"}">${data.totalProtein.toFixed(1)}</span></div><div class="stat-item"><span class="stat-label">پروتئین هدف (گرم)</span><span class="stat-value">${data.targetProtein}</span></div></div>`;
    report += `<div class="verdict-box ${calorieDiff > 120 ? "warning" : "success"}">${verdict}</div>`;

    if (goodFoods.length) {
        report += `<div class="food-section good"><div class="section-title">✅ غذاهای خوب امروز</div>`;
        goodFoods.slice(0, 3).forEach((food) => {
            report += `<div class="food-item">• ${food} => انتخاب خوب برای کاهش وزن و حفظ عضله</div>`;
        });
        report += `</div>`;
    }

    if (badFoods.length) {
        report += `<div class="food-section bad"><div class="section-title">❌ غذاهایی که بهتره محدود بشه</div>`;
        badFoods.slice(0, 3).forEach((food) => {
            report += `<div class="food-item">• ${food} => کالری متراکم و کنترل اشتها را سخت می کند</div>`;
        });
        report += `</div>`;
    }

    report += `<div class="tips-box"><div class="tips-title">💡 عوامل مهم غیر از کالری و پروتئین</div>`;
    report += `<div class="tip">• فیبر روزانه: 25 تا 35 گرم برای سیری بهتر</div>`;
    report += `<div class="tip">• خواب: 7 تا 8 ساعت برای کنترل هورمون اشتها</div>`;
    report += `<div class="tip">• تمرین مقاومتی: حداقل 2 جلسه در هفته برای حفظ عضله</div>`;
    report += `<div class="tip">• سدیم و آب: کنترل نمک برای جلوگیری از احتباس آب</div>`;
    report += `</div>`;

    report += `<div class="stat-box">`;
    report += `<div class="food-item">امروز ${data.totalCalories} کالری دریافت کردی که نرمالش ${data.targetCalories} تا بوده (برای کم کردن 5 کیلو در 30 روز)</div>`;
    report += `<div class="food-item">امروز ${data.totalProtein.toFixed(1)} پروتئین دریافت کردی که پروتئین نرمالش ${data.targetProtein} تا بوده (برای کم کردن 5 کیلو در 30 روز)</div>`;
    report += `<div class="food-item">${verdict}</div>`;
    report += `<div class="food-item">${badFoods.length ? "اگر این موارد را زیاد خوردی کمترش کن: " + badFoods.slice(0, 2).join("، ") : "غذای خیلی بدی ثبت نشده 👍"}</div>`;
    report += `<div class="food-item">${goodFoods.length ? "نکات خوب امروز: " + goodFoods.slice(0, 2).join("، ") : "غذای مفید بیشتری مثل مرغ/تخم مرغ/سالاد اضافه کن"}</div>`;
    report += `<div class="food-item">توصیه کوتاه: وعده ها را نزدیک ساعت ثابت نگه دار، آب کافی بخور، پیاده رویت عالیه 👏</div>`;
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

profileBtn.addEventListener("click", () => {
    fillProfileForm();
    showOnly(profileSection);
});

saveProfileBtn.addEventListener("click", () => {
    applyProfileForm();
    saveProfileBtn.textContent = "ذخیره شد ✓";
    setTimeout(() => {
        saveProfileBtn.textContent = "ذخیره پروفایل";
    }, 1400);
});

resetBtn.addEventListener("click", resetApp);

aboutBtn.addEventListener("click", () => {
    aboutModal.classList.remove("hidden");
});

closeAboutBtn.addEventListener("click", () => {
    aboutModal.classList.add("hidden");
});

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) {
        return;
    }
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
            .catch((err) => console.log("SW registration failed:", err));
    });
}

fillProfileForm();
showOnly(intro);
