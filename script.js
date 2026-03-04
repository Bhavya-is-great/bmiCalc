function $(input) { return document.querySelector(input) }

const loadingElement = $("#loader");

setTimeout(function () {
    loadingElement.classList.add('move');
    setTimeout(function () {
        loadingElement.classList.add("disappear");
    }, 500);
}, 2500);

const STORAGE_KEY = "bmi_entries";
const form = $("#form");
const options = document.querySelectorAll(".opt");
const heightInput = $("#height");
const weightInput = $("#weight");
const nameInput = $("#name");
const submitButton = $("#submit");
const resetButton = $("#resetBtn");
const clearEntriesButton = $("#clearEntriesBtn");
const resultBox = $("#resultBox");
const entriesBox = $("#entriesBox");
const entriesList = $("#entriesList");
const heightLabel = document.querySelector('label[for="Height"]');
const weightLabel = document.querySelector('label[for="weigght"]');
const processingPanel = $("#processingPanel");
const processingType = $("#processingType");
const processingLog = $("#processingLog");

let isMetric = true;
let isProcessing = false;

resultBox.style.display = "none";

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

function wait(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

async function typeLine(text) {
    processingType.textContent = "";
    for (let i = 0; i < text.length; i += 1) {
        processingType.textContent += text[i];
        await wait(25);
    }
    const row = document.createElement("li");
    row.textContent = text;
    processingLog.appendChild(row);
    processingLog.scrollTop = processingLog.scrollHeight;
    await wait(900);
}

async function runProcessingSequence(roundedBmi, category) {
    const lines = [
        "Getting data from the form",
        "Sending data to AWS centers for heavy GPU calculations",
        "Using Quantum physics to calculate",
        "Traning models to calculate BMI",
        "Giving data",
        "Traning......",
        "Calculating",
        "Laws of physics applied",
        "quantam machanics applied",
        `Finally calculated ${roundedBmi} - ${category}`
    ];

    processingLog.innerHTML = "";
    processingType.textContent = "";
    processingPanel.classList.add("show");
    await wait(700);

    for (const line of lines) {
        await typeLine(line);
    }
}

options.forEach(function (option, index) {
    option.addEventListener("click", function () {
        if (isProcessing) return;
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
    if (isProcessing) return;
    entries = [];
    saveEntries();
    renderEntries();
});

resetButton.addEventListener("click", function () {
    if (isProcessing) return;
    form.reset();
    resultBox.style.display = "none";
    resultBox.textContent = "";
    resultBox.classList.remove("underweight", "normal", "overweight", "obese");
    processingPanel.classList.remove("show");
    processingType.textContent = "";
    processingLog.innerHTML = "";
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

form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (isProcessing) return;

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

    isProcessing = true;
    submitButton.disabled = true;
    resetButton.disabled = true;
    clearEntriesButton.disabled = true;
    await runProcessingSequence(roundedBmi, category);

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
    submitButton.disabled = false;
    resetButton.disabled = false;
    clearEntriesButton.disabled = false;
    isProcessing = false;
});

renderEntries();
