function $(input) { return document.querySelector(input) }

const STORAGE_KEY = "bmi_entries";
const THEME_KEY = "bmi_theme";
const form = $("#form");
const options = document.querySelectorAll(".opt");
const heightInput = $("#height");
const weightInput = $("#weight");
const nameInput = $("#name");
const resetButton = $("#resetBtn");
const clearEntriesButton = $("#clearEntriesBtn");
const resultBox = $("#resultBox");
const entriesBox = $("#entriesBox");
const entriesList = $("#entriesList");
const heightLabel = document.querySelector('label[for="Height"]');
const weightLabel = document.querySelector('label[for="weigght"]');
const htmlRoot = document.documentElement;
const themeLamp = $("#themeLamp");
const lampPull = $("#lampPull");
const lampCordPath = $("#lampCordPath");

let isMetric = true;

resultBox.style.display = "none";

function applyTheme(theme) {
    htmlRoot.setAttribute("data-theme", theme);
}

function getCurrentTheme() {
    return htmlRoot.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function toggleTheme() {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
        return;
    }
    applyTheme("light");
}

function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

let entries = loadEntries();

function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries() {
    if (!entries.length) {
        entriesBox.style.display = "none";
        entriesList.innerHTML = "";
        return;
    }

    entriesBox.style.display = "block";
    entriesList.innerHTML = "";

    entries.forEach(function (entry) {
        const item = document.createElement("li");
        item.className = "entryItem";

        const top = document.createElement("div");
        top.className = "entryTop";
        top.textContent = `${entry.name} - BMI ${entry.bmi} - ${entry.category}`;

        const meta = document.createElement("div");
        meta.className = "entryMeta";
        meta.textContent = `${entry.height} ${entry.heightUnit}, ${entry.weight} ${entry.weightUnit} - ${entry.createdAt}`;

        item.appendChild(top);
        item.appendChild(meta);
        entriesList.appendChild(item);
    });
}

function getCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
}

function getResultClass(category) {
    if (category === "Underweight") return "underweight";
    if (category === "Normal weight") return "normal";
    if (category === "Overweight") return "overweight";
    return "obese";
}

function initLampPull() {
    if (!themeLamp || !lampPull || !lampCordPath) return;

    const PULL_TRIGGER = 80;
    const MAX_PULL_X = 70;
    const MAX_PULL_Y = 120;
    const START_X = 80;
    const START_Y = 24;
    const END_X_BASE = 80;
    const END_Y_BASE = 108;
    let isPulling = false;
    let startX = 0;
    let startY = 0;
    let hasToggledOnThisPull = false;
    let releaseTimer = null;

    function drawCord(offsetX, offsetY) {
        const endX = END_X_BASE + offsetX;
        const endY = END_Y_BASE + offsetY;
        const controlX = START_X + offsetX * 0.45;
        const controlY = START_Y + 30 + offsetY * 0.6;
        lampCordPath.setAttribute("d", `M${START_X} ${START_Y} Q${controlX} ${controlY} ${endX} ${endY}`);
    }

    drawCord(0, 0);

    lampPull.addEventListener("pointerdown", function (event) {
        isPulling = true;
        startX = event.clientX;
        startY = event.clientY;
        hasToggledOnThisPull = false;
        if (releaseTimer) {
            clearTimeout(releaseTimer);
            releaseTimer = null;
        }
        themeLamp.classList.remove("justReleased");
        themeLamp.classList.add("isPulling");
        lampPull.setPointerCapture(event.pointerId);
    });

    lampPull.addEventListener("pointermove", function (event) {
        if (!isPulling) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        const clampedX = Math.max(-MAX_PULL_X, Math.min(MAX_PULL_X, deltaX));
        const clampedY = Math.max(0, Math.min(MAX_PULL_Y, deltaY));
        const pullDistance = Math.hypot(clampedX, clampedY);

        themeLamp.style.setProperty("--pull-x", `${clampedX}px`);
        themeLamp.style.setProperty("--pull-y", `${clampedY}px`);
        drawCord(clampedX, clampedY);

        if (pullDistance >= PULL_TRIGGER && !hasToggledOnThisPull) {
            toggleTheme();
            hasToggledOnThisPull = true;
            lampPull.classList.add("flash");
        }
    });

    function resetPullState() {
        if (!isPulling) return;
        isPulling = false;
        themeLamp.classList.remove("isPulling");
        themeLamp.style.setProperty("--pull-x", "0px");
        themeLamp.style.setProperty("--pull-y", "0px");
        drawCord(0, 0);
        themeLamp.classList.add("justReleased");
        if (releaseTimer) clearTimeout(releaseTimer);
        releaseTimer = setTimeout(function () {
            themeLamp.classList.remove("justReleased");
            releaseTimer = null;
        }, 260);
        setTimeout(function () {
            lampPull.classList.remove("flash");
        }, 180);
    }

    lampPull.addEventListener("pointerup", resetPullState);
    lampPull.addEventListener("pointercancel", resetPullState);
}

options.forEach(function (option, index) {
    option.addEventListener("click", function () {
        options.forEach(function (item) { item.classList.remove("active"); });
        option.classList.add("active");
        isMetric = index === 0;
        heightInput.value = "";
        weightInput.value = "";
        nameInput.value = "";
        resultBox.style.display = "none";
        resultBox.textContent = "";
        resultBox.classList.remove("underweight", "normal", "overweight", "obese");

        if (isMetric) {
            option.textContent = "CMs / KGs";
            options[1].textContent = "Inches / LBs";
            heightLabel.textContent = "Height (cm):";
            weightLabel.textContent = "Weight (kg):";
            heightInput.placeholder = "170";
            weightInput.placeholder = "65";
        } else {
            options[0].textContent = "CMs / KGs";
            option.textContent = "Inches / LBs";
            heightLabel.textContent = "Height (in):";
            weightLabel.textContent = "Weight (lb):";
            heightInput.placeholder = "67";
            weightInput.placeholder = "145";
        }
    });
});

clearEntriesButton.addEventListener("click", function () {
    entries = [];
    saveEntries();
    renderEntries();
});

resetButton.addEventListener("click", function () {
    form.reset();
    resultBox.style.display = "none";
    resultBox.textContent = "";
    resultBox.classList.remove("underweight", "normal", "overweight", "obese");
    options.forEach(function (item) { item.classList.remove("active"); });
    options[0].classList.add("active");
    isMetric = true;
    heightLabel.textContent = "Height (cm):";
    weightLabel.textContent = "Weight (kg):";
    heightInput.placeholder = "170";
    weightInput.placeholder = "65";
    options[0].textContent = "CMs / KGs";
    options[1].textContent = "Inches / LBs";

    resetButton.classList.remove("spinBurst");
    void resetButton.offsetWidth;
    resetButton.classList.add("spinBurst");
});

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const heightValue = Number(heightInput.value);
    const weightValue = Number(weightInput.value);
    const userName = nameInput.value.trim() || "User";

    if (!heightValue || !weightValue || heightValue <= 0 || weightValue <= 0) {
        resultBox.style.display = "block";
        resultBox.textContent = "Please enter valid positive values for height and weight.";
        resultBox.classList.remove("underweight", "normal", "overweight", "obese");
        return;
    }

    const heightInMeters = isMetric ? heightValue / 100 : heightValue * 0.0254;
    const weightInKg = isMetric ? weightValue : weightValue * 0.45359237;
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const roundedBmi = bmi.toFixed(1);
    const category = getCategory(bmi);

    resultBox.style.display = "none";
    resultBox.textContent = "";
    resultBox.classList.remove("underweight", "normal", "overweight", "obese");

    const entry = {
        name: userName,
        height: heightValue,
        weight: weightValue,
        heightUnit: isMetric ? "cm" : "in",
        weightUnit: isMetric ? "kg" : "lb",
        bmi: roundedBmi,
        category,
        createdAt: new Date().toLocaleString()
    };

    entries.unshift(entry);
    saveEntries();
    renderEntries();

    resultBox.classList.remove("underweight", "normal", "overweight", "obese");
    resultBox.classList.add(getResultClass(category));
    resultBox.style.display = "block";
    resultBox.innerHTML = `<h3>${userName}, your BMI is ${roundedBmi}</h3><p>Category: ${category}</p>`;
});

initTheme();
initLampPull();
renderEntries();
