
const navButtons = document.querySelectorAll("nav button");
const pages = document.querySelectorAll(".page");

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedPage = button.dataset.page;

    pages.forEach(page => {
      page.classList.toggle(
        "active",
        page.id === selectedPage
      );
    });

    navButtons.forEach(navButton => {
      navButton.classList.toggle(
        "active",
        navButton === button
      );
    });
  });
});

const feedingsHeading = document.querySelector("#tonight h2");

const today = new Date();

const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
});

feedingsHeading.textContent = `Today's Feedings — ${formattedDate}`;

const proteinSelect = document.getElementById("protein");

const wetFoodSelect = document.getElementById("wetFoodType");

/* Update wet food flavors based on selection: Balance.IT or canned food (Halo) */
function updateWetFoodFlavors() {
    const selectedType = wetFoodSelect.value;

    proteinSelect.replaceChildren();

    const flavors = selectedType === "canned" ? ["chicken", "salmon", "turkey"] : ["chicken", "turkey"];

    flavors.forEach(flavor => {
        const option = document.createElement("option");
        option.value = flavor;
        option.textContent = flavor.charAt(0).toUpperCase() + flavor.slice(1);
        proteinSelect.appendChild(option);
    });
}

wetFoodSelect.addEventListener("change", updateWetFoodFlavors);

updateWetFoodFlavors();

/* Data for pets and their recipes 20261106 */

const DEFAULT_PETS = [
    { id: "annie", name: "Annie", species: "cat", birthdate: "2017-12-24", dailyCalories: 235.9 },
    { id: "gus", name: "Gus", species: "cat", birthdate: "2023-04-10", dailyCalories: 262.1 }
];

const PETS_STORAGE_KEY = "pets";

function loadPets() {
    const saved = localStorage.getItem(PETS_STORAGE_KEY);

    if (saved === null) {
        return DEFAULT_PETS.map(pet => ({...pet}));
    }

    try {
        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            throw new Error("Saved pets must be an array.");
        }

        return parsed;
    } catch (error) {
        console.error("Unable to load saved pet profiles:", error);
        return DEFAULT_PETS.map(pet => ({...pet}));
    }
}

function savePets() {
    localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets));
}

let pets = loadPets();


const weightForm = document.getElementById("weightForm");
const weightPetSelect = document.getElementById("weightPet");
const weightDateInput = document.getElementById("weightDate");

pets.forEach(pet => {
    const option = document.createElement("option");
    option.value = pet.id;
    option.textContent = pet.name;
    weightPetSelect.appendChild(option);
});

const weightChartFilter = document.getElementById("weightChartFilter");

pets.forEach(pet => {
    const option = document.createElement("option");

    option.value = pet.id;
    option.textContent = pet.name;

    weightChartFilter.appendChild(option);
});

weightDateInput.value = new Date().toLocaleDateString("en-CA");

weightForm.addEventListener("submit", event => {
    event.preventDefault();

    const petId = weightPetSelect.value;
    const enteredWeight = Number(
        document.getElementById("weightValue").value
    );

    const selectedUnit = document.getElementById("weightUnit").value;

    const weight = convertWeight(
        enteredWeight,
        selectedUnit,
        "lb"
    );

    const date = weightDateInput.value;
    const notes = document.getElementById("weightNotes").value.trim();

    const today = new Date().toLocaleDateString("en-CA");

    if (!pets.some(pet => pet.id === petId)) {
        alert("Please select a valid pet.");
        return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
        alert("Please enter a valid weight greater than zero.");
        return;
    }

    if (!date || date > today) {
        alert("Please select a valid date that is not in the future.");
        return;
    }

    const record = {
        id: crypto.randomUUID(),
        petId,
        date,
        weight,
        unit: "lb",
        notes
    };

    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    history.push(record);

    localStorage.setItem(
        "weightHistory",
        JSON.stringify(history)
    );

    weightForm.reset();
    weightDateInput.value = today;

    displayWeightHistory();
    displayWeightChart();
    displayWeighInReminders();
    alert("Weight record saved successfully.");
});

/* Edit and save weight record */
function updateWeightRecord(recordId, changes) {
    const history = JSON.parse(localStorage.getItem("weightHistory") || "[]");

    const record = history.find(item => item.id === recordId);

    if (!record) {
        console.error("Weight record not found.");
        return false;
    }

    Object.assign(record, changes);

    localStorage.setItem(
        "weightHistory",
        JSON.stringify(history)
    );

    displayWeightHistory();
    displayWeightChart();
    displayWeighInReminders();
    return true;
}

/* export weight history to csv */
function exportWeightHistory() {
    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    const exportUnit = document.getElementById("chartWeightUnit").value;

    if (history.length === 0) {
        alert("No weight record available to export.");
        return;
    }

    const headers = ["Date", "Pet", `Weight (${exportUnit})`, "Notes"];

    const escapeCSV = value => {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}`;
    };
    const rows = history
        .sort((a,b) => a.date.localeCompare(b.date))
        .map(record => {
            const pet = pets.find(p => p.id === record.petId);

            const convertedWeight = convertWeight(
                Number(record.weight),
                "lb",
                exportUnit
            );

            return [
                record.date,
                pet?.name || record.petId,
                convertedWeight.toFixed(2),
                record.notes
            ];
        });

        const csv = [
            headers.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        const currentDate = new Date().toLocaleDateString("en-CA");
        link.download = `pet-weight-history-${exportUnit}-${currentDate}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
}

/* Weigh-in reminder preference logic */
const REMINDER_SETTINGS_KEY = "weighInReminderSettings";

const weighInReminderEnabled = document.getElementById("weighInReminderEnabled");
const weighInReminderDay = document.getElementById("weighInReminderDay");
const weighInReminderSettings = document.getElementById("weighInReminderSettings");

function getWeighInReminderSettings() {
    const saved = JSON.parse(
        localStorage.getItem(REMINDER_SETTINGS_KEY) || "{}"
    );

    return {
        enabled: saved.enabled !== false,
        day: Number.isInteger(saved.day) && saved.day >= 1 && saved.day <= 31
            ? saved.day
            : 1,
        dismissed: saved.dismissed || {}
    };
}

function saveWeighInReminderSettings(settings) {
    localStorage.setItem(
        REMINDER_SETTINGS_KEY,
        JSON.stringify(settings)
    );
}

function initializeWeighInReminderSettings() {
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement("option");
        option.value = String(day);
        option.textContent = String(day);
        weighInReminderDay.appendChild(option);
    }
    const settings = getWeighInReminderSettings();

    weighInReminderEnabled.checked = settings.enabled;
    weighInReminderDay.value = String(settings.day);
    weighInReminderSettings.hidden = !settings.enabled;

    weighInReminderEnabled.addEventListener("change", () => {
        const updated = getWeighInReminderSettings();
        updated.enabled = weighInReminderEnabled.checked;

        /* toggle weigh-in reminders to reset dismissals */
        if (updated.enabled) {
            updated.dismissed = {};
        }

        saveWeighInReminderSettings(updated);

        weighInReminderSettings.hidden = !updated.enabled;
        displayWeighInReminders();
    });

    weighInReminderDay.addEventListener("change", () => {
        const updated = getWeighInReminderSettings();
        updated.day = Number(weighInReminderDay.value);

        saveWeighInReminderSettings(updated);
        displayWeighInReminders();
    });
}

/* Get last weigh in to calculate weigh in alert scheduling */
function getLastWeighIn(petId) {
    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    const petRecords = history.filter(record =>
        record.petId === petId && record.date
    );

    if (petRecords.length === 0) {
        return null;
    }

    petRecords.sort((a,b) => b.date.localeCompare(a.date));

    return petRecords[0].date;
}

function displayWeighInReminders() {
    const container = document.getElementById("weighInReminders");
    if (!container) return;

    container.replaceChildren();

    const settings = getWeighInReminderSettings();
    if (!settings.enabled) {
        const message = document.createElement("p");
        message.textContent = "Monthly weigh-in reminders are disabled.";
        container.appendChild(message);
        return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    // Clamp the selected day to the last day of shorter months.
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const reminderDay = Math.min(settings.day, lastDayOfMonth);

    const reminderDate = new Date(year, month, reminderDay);
    const reminderDateText = reminderDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });

    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    pets.forEach(pet => {
        const monthlyRecords = history
            .filter(record =>
                record.petId === pet.id &&
                typeof record.date === "string" &&
                record.date.startsWith(`${monthKey}-`)
            )
            .sort((a,b) => b.date.localeCompare(a.date));

            const latest = monthlyRecords[0];

        const dismissalKey = `${monthKey}:${pet.id}`;

        const dismissed = Boolean(settings.dismissed[dismissalKey]);

        const reminder = document.createElement("div");
        reminder.className = "weigh-in-reminder";

        const message = document.createElement("p");

        if (latest) {
            message.textContent =
                `${pet.name}: Complete — weighed ${latest.date}, ${latest.weight} ${latest.unit || "lb"}`;
        } else if (dismissed) {
            message.textContent = `${pet.name}: Dismissed this month`;
        } else if (today.getDate() < reminderDay) {
            message.textContent =
                `${pet.name}: Not weighed this month — due ${reminderDateText}`;
        } else {
            message.textContent = `${pet.name}: Weigh-in due`;
        }

        reminder.appendChild(message);

        if (!latest && !dismissed && today.getDate() >= reminderDay) {
            const dismissButton = document.createElement("button");
            dismissButton.type = "button";
            dismissButton.textContent = "Dismiss";

            dismissButton.addEventListener("click", () => {
                const updated = getWeighInReminderSettings();

                updated.dismissed[dismissalKey] = true;

                saveWeighInReminderSettings(updated);
                displayWeighInReminders();
            });

            reminder.appendChild(dismissButton);
        }
        container.appendChild(reminder);
    });
}

function displayWeightHistory() {
    const container = document.getElementById("weightHistory");
    const displayUnit = document.getElementById("chartWeightUnit").value;

    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    container.replaceChildren();

    if (history.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No weight records saved yet.";
        container.appendChild(message);
        return;
    }

    history.sort((a, b) => b.date.localeCompare(a.date));

    const table = document.createElement("table");
    table.className = "weight-history-table";

    const header = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["Date", "Pet", "Weight", "Notes", "Actions"].forEach(label => {
        const th = document.createElement("th");
        th.textContent = label;
        headerRow.appendChild(th);
    });

    header.appendChild(headerRow);
    table.appendChild(header);

    const tbody = document.createElement("tbody");

    history.forEach(record => {
        const row = document.createElement("tr");

        const pet = pets.find(pet => pet.id === record.petId);

        const dateCell = document.createElement("td");
        dateCell.textContent = record.date || "Unknown date";

        const petCell = document.createElement("td");
        petCell.textContent = pet?.name || record.petId || "Unknown pet";

        const weightCell = document.createElement("td");
        weightCell.textContent = formatWeight(
            convertWeight(Number(record.weight), "lb", displayUnit), displayUnit
        );

        const notesCell = document.createElement("td");
        notesCell.textContent = record.notes || "—";

        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit"; 
        editButton.addEventListener("click", () => {
            const newWeightInput = prompt(`Enter a new weight for ${pet?.name || "this pet"} (${displayUnit}):`,
                convertWeight(Number(record.weight), "lb", displayUnit).toFixed(2));

            if (newWeightInput === null) return;
            if (
                newWeightInput.trim() === "" ||
                !Number.isFinite(Number(newWeightInput)) ||
                Number(newWeightInput) <= 0
            ) {
                alert("Please enter a valid weight greater than zero.");
                return;
            }

            const newWeight = convertWeight(
                Number(newWeightInput),
                displayUnit,
                "lb"
            );

            const newDate = prompt(
                "Enter the weigh-in date (YYYY-MM-DD):", 
                record.date
            );

            if (newDate === null) return;

            const today = new Date().toLocaleDateString("en-CA");
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            const parsedDate = new Date(`${newDate}T12:00:00`);

            if (
                !datePattern.test(newDate) ||
                Number.isNaN(parsedDate.getTime()) ||
                parsedDate.toLocaleDateString("en-CA") !== newDate ||
                newDate > today
            ) {
                alert("Enter a valid date that is not in the future.");
                return;
            }

            const newNotes = prompt(
                "Enter notes for this weight record:",
                record.notes || ""
            );

            if (newNotes === null) return;

            updateWeightRecord(record.id, {
                weight: newWeight,
                date: newDate,
                notes: newNotes.trim()
            });
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Permanently delete ${pet?.name || "this pet"}'s weight record from ${record.date}?`
            );
            if (!confirmed) return;

            const deleted = deleteWeightRecord(record.id);

            if (!deleted) {
                alert("Unable to delete the weight record.");
            }
        });

        actionsCell.append(editButton, deleteButton);

        row.append(dateCell, petCell, weightCell, notesCell, actionsCell);
        tbody.appendChild(row);

    });

    table.appendChild(tbody);
    container.appendChild(table);

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.textContent = "Export Weight History (CSV)";
    exportButton.className = "export-weight-button";

    exportButton.addEventListener("click", exportWeightHistory);

    container.appendChild(exportButton);
}

function deleteWeightRecord(recordId) {
    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    const updatedHistory = history.filter(
        record => record.id !== recordId
    );

    if (updatedHistory.length === history.length) {
        console.error("Weight record not found:", recordId);
        return false;
    }

    localStorage.setItem(
        "weightHistory",
        JSON.stringify(updatedHistory)
    );

    displayWeightHistory();
    displayWeightChart();
    displayWeighInReminders();

    return true;
}

let weightChart = null;

function displayWeightChart() {
    const canvas = document.getElementById("weightChart");
    const selectedPetId = weightChartFilter.value;
    const displayUnit = document.getElementById("chartWeightUnit").value;

    const history = JSON.parse(
        localStorage.getItem("weightHistory") || "[]"
    );

    const visiblePets = selectedPetId === "all"
        ? pets
        : pets.filter(pet => pet.id === selectedPetId);

    const colors = [
        "#2563eb",
        "#dc2626",
        "#16a34a",
        "#9333ea",
        "#ea580c",
        "#0891b2"
    ];

    const datasets = visiblePets.map((pet, index) => {
        const records = history
            .filter(record =>
                record.petId === pet.id &&
                record.date &&
                Number.isFinite(Number(record.weight)) &&
                Number(record.weight) > 0
            )
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            petId: pet.id,
            label: pet.name,
            data: records.map(record => ({
                x: record.date,
                y: convertWeight(Number(record.weight),
                "lb",
                displayUnit)
            })),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length],
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
        };
    });

    if (weightChart) {
        weightChart.destroy();
    }

    weightChart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "nearest",
                intersect: false
            },
            plugins: {
                legend: {
                    display: datasets.length > 1
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const petId = context.dataset.petId;
                            const pet = pets.find(p => p.id === petId);

                        const measurementDate = context.raw.x;

                        const age = calculateAgeOnDate(
                            pet?.birthdate,
                            measurementDate
                        );

                        return [
                            `Weight: ${formatWeight(context.parsed.y, displayUnit)}`,
                            `Age: ${age}`
                        ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "year",
                        tooltipFormat: "MMM d, yyyy"
                    },
                    title: {
                        display: true,
                        text: "Date"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `Weight (${displayUnit})`
                    }
                }
            }
        }
    });
}

const KG_PER_LB = 0.45359237;

function convertWeight(weight, fromUnit, toUnit) {
    if (fromUnit === toUnit) {
        return weight;
    }

    if (fromUnit === "lb" && toUnit === "kg") {
        return weight * KG_PER_LB;
    }

    if (fromUnit === "kg" && toUnit === "lb") {
        return weight / KG_PER_LB;
    }

    throw new Error("Unsupported weight unit");
}

function formatWeight(weight, unit) {
    return `${weight.toFixed(2)} ${unit}`;
}

function calculateAgeOnDate(birthDate, measurementDate) {
    if (!birthDate || !measurementDate) {
        return "Age unknown";
    }

    const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
    const [year, month, day] = measurementDate.split("-").map(Number);

    let years = year - birthYear;
    let months = month - birthMonth;

    if (day < birthDay) {
        months--;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years < 0) {
        return "Age unknown";
    }

    return `${years} years, ${months} months`;
}

weightChartFilter.addEventListener("change", displayWeightChart);
document
    .getElementById("chartWeightUnit")
    .addEventListener("change", () => {
        displayWeightChart();
        displayWeightHistory();
    });

displayWeightChart();
displayWeightHistory();
initializeWeighInReminderSettings();
displayWeighInReminders();

const recipes = {
  chicken: {
    Annie: {
       id: "14940796",
            calories: 235.9,
            ingredients: [
                { name: "Chicken breast, skinless, boneless, cooked, roasted", grams: 99 },
                { name: "Canola oil", grams: 6 },
                { name: "Nordic Naturals Omega-3 Pet Liquid", grams: 2.1 },
                { name: "Balance IT Carnivore Blend", grams: 2.84 }
            ]
    },
    Gus: {
       id: "14940974",
            calories: 262.1,
            ingredients: [
                { name: "Chicken breast, skinless, boneless, cooked, roasted", grams: 92 },
                { name: "Canola oil", grams: 5 },
                { name: "Nordic Naturals Omega-3 Pet Liquid", grams: 1.66 },
                { name: "White long-grain rice, cooked", grams: 40 },
                { name: "Balance IT Carnivore Blend", grams: 3.14 }
            ]
    }
  },
  turkey: {
    Annie: {
      id: "14941082",
      calories: 241.6,
      ingredients: [
        { name: "Turkey breast, from whole bird, non-enhanced, meat only, cooked, roasted", grams: 117 },
        { name: "Corn oil, all-purpose salad or cooking", grams: 5 },
        { name: "Nordic Naturals Omega-3 Pet Liquid", grams: 3.4 },
        { name: "Balance IT Carnivore Blend", grams: 3.2 }
      ]
    },
    Gus: {
      id: "14941056",
      calories: 261.3,
      ingredients: [
        { name: "Turkey breast, from whole bird, non-enhanced, meat only, cooked, roasted", grams: 128 },
        { name: "Nordic Naturals Omega-3 Pet Liquid", grams: 1.56 },
        { name: "Canola oil", grams: 4 },
        { name: "White long-grain rice, cooked", grams: 20 },
        { name: "Balance IT Carnivore Blend", grams: 3.6 }
      ]
    }
  }
};

const dryFoodCaloriesPerGram = 3.674;

function calculateDryFoodCalories(feedings) {
    return feedings.reduce((total, feeding) => {
        if (!feeding.completed) return total;

        return total + feeding.grams * dryFoodCaloriesPerGram;
    }, 0);
}


/* Recipes for canned Halo cat food. Add other types later */
const cannedRecipes = {
    chicken: { caloriesPerGram: 1.025 },
    salmon: { caloriesPerGram: 1.047 },
    turkey: { caloriesPerGram: 0.985 }
};

const recipeDisclaimers = {
    canned: "Portions are estimated using Balance IT daily calorie targets and may not reflect your pet's actual calorie needs.",
    homemade: "Recipes are sourced from Balance IT using each pet's sex, neuter status, age and weight. Displayed portions may be adjusted to account for dry food consumed. Nutritional balance of the combined diet has not been verified."
};

function displayFeedingDisclaimers() {
    const container = document.getElementById("feedingDisclaimers");

    if (!container) return;

    container.replaceChildren();
    const selectedTypes = new Set(
        pets.map(pet =>
            wetFoodOverrides[pet.id]?.type || wetFoodSelect.value
        )
    );

    const heading = document.createElement("h4");
    heading.textContent = "About these estimates:";
    container.appendChild(heading);

    selectedTypes.forEach(type => {
        const disclaimer = document.createElement("p");
        disclaimer.textContent = recipeDisclaimers[type] || "";
        container.appendChild(disclaimer);
    });
}

function calculateWetFood(pet, remainingCalories, type, flavor) {
    if (type === "canned") {
        const canned = cannedRecipes[flavor];

        return {
            type,
            flavor,
            grams: remainingCalories / canned.caloriesPerGram,
            calories: remainingCalories,
            ingredients: []
        };
    }

    if (type === "homemade") {
        const recipe = recipes[flavor]?.[pet.name];

        if (!recipe) {
            return null;
        }

        const scaleFactor = remainingCalories / recipe.calories;

        const ingredients = recipe.ingredients.map(ingredient => ({
            name: ingredient.name,
            grams: ingredient.grams * scaleFactor
        }));

        return {
            type,
            flavor,
            recipeId: recipe.id,
            grams: ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0),
            calories: remainingCalories,
            ingredients
        };
    }

    return null;
}

const dryFoodContainer = document.getElementById("dryFoodCalculator");
const dinnerContainer = document.getElementById("dinnerRecipes");

const feedingData = {};
const wetFoodOverrides = {};
const wetFoodEaten = {};
const wetFoodRecordedMeal = {};
const wetFeedings = {};

/* Allow for multiple wet feedings */
function createWetFeeding(type, flavor, grams, calories) {
    return {
        id: crypto.randomUUID(),
        time: new Date().toTimeString().slice(0,5),
        type,
        flavor,
        grams,
        calories,
        completed: false
    };
}

function calculateWetServingCalories(pet, type, flavor, grams) {
    if (!Number.isFinite(grams) || grams < 0) {
        return 0;
    }

    if (type === "canned") {
        const recipe = cannedRecipes[flavor];

        if (!recipe) return 0;

        return grams * recipe.caloriesPerGram;
    }

    if (type === "homemade") {
        const recipe = recipes[flavor]?.[pet.name];

        /* ne exception when new pet doesn't have predefined homemade recipe */
        if (!recipe) return 0;

        const recipeGrams = recipe.ingredients.reduce(
            (total, ingredient) => total + ingredient.grams,
            0
        );

        if (recipeGrams <= 0) return 0;

        return (grams / recipeGrams) * recipe.calories;
    }

    return 0;
}

pets.forEach(pet => {
    wetFeedings[pet.id] = [];
});

/* Manually unchecking an autofeeder entry overrides automatic completion for that day only */
function getAutomaticFeedingOverrides() {
    const today = new Date().toLocaleDateString("en-CA");

    return JSON.parse(
        localStorage.getItem(`autoFeedingOverrides:${today}`) || "{}"
    );
}

function saveAutomaticFeedingOverride(petId, feedingId, unchecked) {
    const today = new Date().toLocaleDateString("en-CA");
    const key = `autoFeedingOverrides:${today}`;
    const overrides = getAutomaticFeedingOverrides();

    overrides[`${petId}:${feedingId}`] = unchecked;

    localStorage.setItem(key, JSON.stringify(overrides));
}

/* Update automatic feeding */
function updateAutomaticFeedings() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const overrides = getAutomaticFeedingOverrides();

    pets.forEach(pet => {
        const feedings = feedingData[pet.id] || [];

        feedings.forEach(feeding => {
            if (
                feeding.method !== "auto" || !feeding.time) {
                    return;
                }
                
                const manuallyUnchecked = overrides[`${pet.id}:${feeding.id}`] === true;
                
                feeding.manuallyUnchecked = manuallyUnchecked;

                if (manuallyUnchecked) {
                    feeding.completed = false;
                } else if (currentTime >= feeding.time) {
                    feeding.completed = true;
                }
        });
    });
}

/* Display the dry food calculator for each pet */
function displayDryFoodCalculator() {
    dryFoodContainer.replaceChildren();
    dinnerContainer.replaceChildren();

    pets.forEach(pet => {
       if (!feedingData[pet.id]) {
            feedingData[pet.id] = [
              { id: 1, grams: 10, completed: false, method: "auto", time: "04:45" },
              { id: 2, grams: 10, completed: false, method: "manual", time: "10:30" }
          ];
        }

        if (!wetFeedings[pet.id]) {
            wetFeedings[pet.id] = [];
        }

        if (wetFeedings[pet.id].length === 0) {
            const dryCalories = calculateDryFoodCalories(feedingData[pet.id]);
            const remainingCalories = Math.max(0, pet.dailyCalories - dryCalories);

            const override = wetFoodOverrides[pet.id];
            const type = override?.type || wetFoodSelect.value;
            const flavor = override?.flavor || proteinSelect.value;

            const recommended = calculateWetFood(
                pet,
                remainingCalories,
                type,
                flavor
            );

            if (recommended) {
                wetFeedings[pet.id].push(
                    createWetFeeding(
                        type,
                        flavor,
                        recommended.grams,
                        recommended.calories
                    )
                );
            }
        }
        
        const section = document.createElement("div");
        section.className = "pet-feeding";

        const heading = document.createElement("h3");
        heading.textContent = pet.name;

        feedingData[pet.id].forEach(feeding => {
          const row = document.createElement("div");
          row.className = "feeding-row";

          const label = document.createElement("span");
          label.className = "feeding-name";
          label.textContent = `Dry Food ${feeding.id}`;

          const gramsInput = document.createElement("input");
          gramsInput.type = "number";
          gramsInput.className = "feeding-grams";
          gramsInput.min = "0";
          gramsInput.step = "0.1";
          gramsInput.value = Number(feeding.grams.toFixed(1));
          gramsInput.setAttribute(
            "aria-label",
            `${pet.name} dry food feeding ${feeding.id} grams`
          );

          const unit = document.createElement("span");
          unit.className = "feeding-unit";
          unit.textContent = "g";

         /* auto feeder versus manual feeder selection */
          const methodSelect = document.createElement("select");
          methodSelect.className = "feeding-method";
          [
            { value: "auto", label: "Auto Feeder" },
            { value: "manual", label: "Manual" }
          ].forEach(method => {
            const option = document.createElement("option");
            option.value = method.value;
            option.textContent = method.label;
            methodSelect.appendChild(option);
          });
          methodSelect.value = feeding.method ?? "manual";

          methodSelect.setAttribute(
            "aria-label",
            `${pet.name} dry food feeding ${feeding.id} method`
          );

          methodSelect.addEventListener("change", () => {
            feeding.method = methodSelect.value;
          });

          const timeInput = document.createElement("input");
          timeInput.type = "time";
          timeInput.className = "feeding-time";
          timeInput.value = feeding.time ?? "10:30";

          timeInput.setAttribute(
            "aria-label",
            `${pet.name} dry food feeding ${feeding.id} time`
          );

          timeInput.addEventListener("change", () => {
            feeding.time = timeInput.value;
          });

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.textContent = "×";
          removeButton.className = "remove-feeding";
          removeButton.setAttribute(
            "aria-label",
            `Remove ${pet.name} dry food feeding ${feeding.id}`
          );

          const completionLabel = document.createElement("label");
          completionLabel.className = "feeding-complete";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = feeding.completed;
          checkbox.setAttribute(
            "aria-label",
            `Mark ${pet.name} dry food feeding ${feeding.id} as eaten`
          );
          completionLabel.appendChild(checkbox);

          /* Update feeding grams and recalculate when input changes */
          gramsInput.addEventListener("input", () => {
            feeding.grams = gramsInput.value.trim() === ""
            ? NaN
            : Number(gramsInput.value);

            if (Number.isFinite(feeding.grams) && feeding.grams >= 0) {
                calculate();
            }
          });

          /* Complete a feeding button */
          checkbox.addEventListener("change", () => {
            if (feeding.completed && !checkbox.checked) {
                const confirmed = confirm(
                    `Unmark ${pet.name}'s dry food feeding ${feeding.id} as eaten?`
                );
                if (!confirmed) {
                    checkbox.checked = true;
                    return;
                }
            }
            feeding.completed = checkbox.checked;

            if (feeding.method === "auto") {
                feeding.manuallyUnchecked = !checkbox.checked;

                saveAutomaticFeedingOverride(
                    pet.id,
                    feeding.id,
                    !checkbox.checked
                );
            }
            calculate();
          });
          
          /* Remove a feeding button */
          removeButton.addEventListener("click", () => {

            if (feeding.completed) {
                const confirmed = confirm(
                    `Remove ${pet.name}'s completed dry-food feeding ${feeding.id}? This will remove its recorded quantity and eaten status.`
                );
                if (!confirmed) {
                    return;
                }
            }
            feedingData[pet.id] = feedingData[pet.id].filter(
            item => item.id !== feeding.id
          );

          displayDryFoodCalculator();
    });
          
          row.append(
            label,
            gramsInput,
            unit,
            methodSelect,
            timeInput,
            removeButton,
            completionLabel
          );
          section.appendChild(row);
    });

    // Allow the user to add a new feeding
    const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.textContent = "+ Add dry food feeding";

      addButton.addEventListener("click", () => {
          const feedings = feedingData[pet.id];

          const nextId = Math.max(
              0,
              ...feedings.map(feeding => feeding.id)
          ) + 1;

          feedings.push({
              id: nextId,
              grams: 10,
              completed: false,
              method: "manual",
              time: new Date().toTimeString().slice(0,5)
          });

          displayDryFoodCalculator();
      });

        section.appendChild(addButton);

        const result = document.createElement("div");
        result.className = "calorie-summary";
        const dinnerResult = document.createElement("p");
        const recipeIngredients = document.createElement("ul");

        dinnerResult.className = 'calculated-total';

        function calculate() {

            const dryCalories = calculateDryFoodCalories(feedingData[pet.id]);
            const remainingCalories = Math.max(0, pet.dailyCalories - dryCalories);

            const firstWetFeeding = wetFeedings[pet.id]?.[0];

            if (firstWetFeeding && !firstWetFeeding.completed) {

                const override = wetFoodOverrides[pet.id];
                const type = override?.type || wetFoodSelect.value;
                const flavor = override?.flavor || proteinSelect.value;
                const recommended = calculateWetFood(
                    pet,
                    remainingCalories,
                    type,
                    flavor
                );

                if (recommended) {
                    firstWetFeeding.type = type;
                    firstWetFeeding.flavor = flavor;
                    firstWetFeeding.grams = recommended.grams;
                    firstWetFeeding.calories = recommended.calories;
                }
            }

            const consumedWetCalories = (wetFeedings[pet.id] || []).reduce(
                 (total, feeding) => {
                    if (!feeding.completed) return total;

                    return total + feeding.calories;
                 }, 
                 0 
                );
            const totalConsumedCalories = dryCalories + consumedWetCalories;          
            
            /* Calculate how many calories pet has consumed over daily target */
            const excessCalories = Math.max(0, totalConsumedCalories - pet.dailyCalories);

            const progressBarWidth = pet.dailyCalories > 0
            ? Math.min(100, (totalConsumedCalories / pet.dailyCalories) * 100)
            : 0;

            const actualProgress = pet.dailyCalories > 0
                ? (totalConsumedCalories / pet.dailyCalories) * 100
                : 0;

                result.innerHTML = `
                    <div class="calorie-stats">

                        <div class="calorie-stat calorie-stat-dry">
                            <span>Dry food</span>
                            <strong>${dryCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>

                        <div class="calorie-stat calorie-stat-wet">
                            <span>Wet food</span>
                            <strong>${consumedWetCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>

                         <div class="calorie-stat ${
                                excessCalories > 0.05
                                    ? 'calorie-target-over'
                                    : actualProgress >= 100
                                        ? 'calorie-target-reached'
                                        : 'calorie-target-default'
                            }">
                            <span>Daily Target</span>
                            <strong>${pet.dailyCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>
                    </div>

                    <div class="calorie-progress ${excessCalories > 0.05 ? 'is-over' : actualProgress >= 100 ? 'is-complete' : ''}"
                        role="progressbar"
                        aria-label="${pet.name} total calorie consumption"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="${Math.min(100, actualProgress).toFixed(0)}">
                        
                        <div class="calorie-progress-dry"
                            style="width: ${pet.dailyCalories > 0
                                ? Math.min(100, dryCalories / pet.dailyCalories * 100)
                                : 0}%">
                        </div>

                        <div class="calorie-progress-wet"
                            style="width: ${pet.dailyCalories > 0
                                ? Math.min(
                                    100 - Math.min(100, dryCalories / pet.dailyCalories * 100),
                                    consumedWetCalories / pet.dailyCalories * 100
                                )
                                : 0}%">
                    </div>

                    <p class="calorie-total">
                        ${totalConsumedCalories.toFixed(1)} / 
                        ${pet.dailyCalories.toFixed(1)} kcal consumed
                        (${actualProgress.toFixed(1)}%)
                    </p>

                    ${excessCalories > 0.05
                        ? `<p class="calorie-overage">
                            ${excessCalories.toFixed(1)} kcal over daily target </p>`
                        : ''
                    }
                `;
                
                const override = wetFoodOverrides[pet.id];
                const selectedProtein = override
                    ? override.flavor
                    : proteinSelect.value;
                const selectWetFoodType = override
                    ? override.type
                    : wetFoodSelect.value;

                /* Preserve recorded meal in saved data even when eaten checkbox is unchecked */
                const completedFirstFeeding = wetFeedings[pet.id]?.[0];

                const wetFood = completedFirstFeeding?.completed 
                    ? (
                        wetFoodRecordedMeal[pet.id] || 
                        calculateWetFood(
                            pet,
                            completedFirstFeeding.calories,
                            completedFirstFeeding.type,
                            completedFirstFeeding.flavor
                        )
                    )
                    : calculateWetFood(
                        pet,
                        remainingCalories,
                        selectWetFoodType,
                        selectedProtein
                    );
                
                wetFoodEaten[pet.id] && wetFoodRecordedMeal[pet.id]
                    ? wetFoodRecordedMeal[pet.id]
                    : calculateWetFood(
                        pet,
                        remainingCalories,
                        selectWetFoodType,
                        selectedProtein
                );
                    recipeIngredients.replaceChildren();
                    dinnerResult.replaceChildren();

                    if (wetFood) {
                        wetFood.ingredients.forEach(ingredient => {
                            const item = document.createElement("li");

                            const name = document.createElement("span");
                            name.textContent = ingredient.name;

                            const amount = document.createElement("span");
                            amount.textContent = `${ingredient.grams.toFixed(2)} g`;

                            item.append(name, amount);
                            recipeIngredients.appendChild(item);
                        });

                    const totalLabel = document.createElement("span");
                    totalLabel.textContent = "Total meal weight";

                    const totalAmount = document.createElement("span");
                    totalAmount.textContent = `${wetFood.grams.toFixed(1)} g`;

                    dinnerResult.append(totalLabel, totalAmount);
                } else {
                    dinnerResult.textContent = "No recipe available.";
                }
        }

        section.prepend(heading);
        section.append(result);
        dryFoodContainer.appendChild(section);

        const wetFoodSection = document.createElement("div");
        wetFoodSection.className = "pet-feeding";

        const overrideLabel = document.createElement("label");
        overrideLabel.textContent = "Wet food selection";

        const overrideSelect = document.createElement("select");

        overrideSelect.innerHTML = `
        <option value="shared">Use shared selection</option>
        <option value="homemade">Homemade (Balance.IT)</option>
        <option value="canned">Canned</option>`;

        overrideSelect.value = wetFoodOverrides[pet.id]?.type || "shared";

        const flavorLabel = document.createElement("label");
        flavorLabel.textContent = " Protein/flavor: ";

        const flavorSelect = document.createElement("select");
        function updateOverrideFlavors() {
          const overrideType = overrideSelect.value;

          flavorSelect.replaceChildren();

          if (overrideType === "shared") {
              flavorLabel.hidden = true;
              flavorSelect.hidden = true;
              return;
          }

          flavorLabel.hidden = false;
          flavorSelect.hidden = false;

          const flavors = overrideType === "canned"
              ? ["chicken", "salmon", "turkey"]
              : ["chicken", "turkey"];

          flavors.forEach(flavor => {
              const option = document.createElement("option");
              option.value = flavor;
              option.textContent =
                  flavor.charAt(0).toUpperCase() + flavor.slice(1);

              flavorSelect.appendChild(option);
          });

          const savedFlavor = wetFoodOverrides[pet.id]?.flavor;

          if (savedFlavor && flavors.includes(savedFlavor)) {
              flavorSelect.value = savedFlavor;
          }
      }

      overrideSelect.addEventListener("change", () => {
          if (overrideSelect.value === "shared") {
              delete wetFoodOverrides[pet.id];
          } else {
              wetFoodOverrides[pet.id] = {
                  type: overrideSelect.value,
                  flavor: "chicken"
              };
          }

          updateOverrideFlavors();
          calculate();
          displayFeedingDisclaimers();
      });

      flavorSelect.addEventListener("change", () => {
          wetFoodOverrides[pet.id].flavor = flavorSelect.value;
          calculate();
      });

      updateOverrideFlavors();

        const wetFoodHeading = document.createElement("h3");

        wetFoodHeading.textContent = pet.name;
        overrideLabel.appendChild(overrideSelect);
        flavorLabel.appendChild(flavorSelect);

        const wetFoodCheckboxLabel = document.createElement("label");

        const wetFoodCheckbox = document.createElement("input");
        wetFoodCheckbox.type = "checkbox";
        wetFoodCheckbox.checked = false;
        wetFoodCheckbox.checked = wetFeedings[pet.id][0]?.completed ?? false;

        wetFoodCheckbox.addEventListener("change", () => {
             const firstFeeding = wetFeedings[pet.id][0];

            if (!firstFeeding) {
                console.error("Feeding 1 record is missing:", pet.id);
                wetFoodCheckbox.checked = false;
                return;
            }

            firstFeeding.completed = wetFoodCheckbox.checked;
            wetFoodEaten[pet.id] = wetFoodCheckbox.checked;

            calculate();
        });

        wetFoodCheckboxLabel.append(
            wetFoodCheckbox,
            " Wet food eaten"
        );

        function createWetFeedingRow(feeding) {
            const row = document.createElement("div");
            row.className = "wet-feeding-row";
            const feedingNumber = wetFeedings[pet.id].findIndex(
                item => item.id === feeding.id
            ) + 1;

            const feedingLabel = document.createElement("span");
            feedingLabel.textContent = `Wet Feeding ${feedingNumber}`;
            feedingLabel.className = "wet-feeding-heading-label";

            const gramsInput = document.createElement("input");
            gramsInput.type = "number";
            gramsInput.min = "0";
            gramsInput.step = "0.1";
            gramsInput.value = Number(feeding.grams.toFixed(1));
            gramsInput.className = "wet-feeding-grams";
            gramsInput.setAttribute(
                "aria-label",
                `${pet.name} wet feeding grams`
            );

            const gramsUnit = document.createElement("span");
            gramsUnit.className = "wet-feeding-unit";
            gramsUnit.textContent = "(g)";

            const timeInput = document.createElement("input");
            timeInput.type = "time";
            timeInput.value = feeding.time || "";
            timeInput.className = "wet-feeding-time";
            timeInput.setAttribute(
                "aria-label",
                `${pet.name} wet feeding time`
            );

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = feeding.completed;

            const isFirstFeeding = wetFeedings[pet.id][0]?.id === feeding.id;

            if (isFirstFeeding) {
                checkbox.hidden = true;
            }

            checkbox.setAttribute(
                "aria-label",
                `${pet.name} wet feeding completed`
            );

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "×";
            removeButton.className = "remove-feeding wet-feeding-remove";
            removeButton.setAttribute(
                "aria-label",
                `Remove ${pet.name} wet feeding`
            );

            gramsInput.addEventListener("change", () => {
                const grams = Number(gramsInput.value);

                if (!Number.isFinite(grams) || grams < 0 ||
                    gramsInput.value.trim() === "") {
                    alert("Enter a valid wet food quantity.");
                    gramsInput.value = feeding.grams;
                    return;
                }

                feeding.grams = grams;
                feeding.calories = calculateWetServingCalories(
                    pet,
                    feeding.type,
                    feeding.flavor,
                    grams
                );

                calculate();
            });

            timeInput.addEventListener("change", () => {
                feeding.time = timeInput.value;
            });

            checkbox.addEventListener("change", () => {
                feeding.completed = checkbox.checked;
                calculate();
            });

            removeButton.addEventListener("click", () => {
                const confirmed = confirm(
                    `Remove this wet feeding for ${pet.name}?`
                );

                if (!confirmed) return;

                wetFeedings[pet.id] = wetFeedings[pet.id].filter(
                    item => item.id !== feeding.id
                );

                renderWetFeedingRows();
                calculate();
            });

            row.append(
                feedingLabel,
                gramsInput,
                gramsUnit,
                timeInput,
                checkbox,
                removeButton
            );

            return row;
        }

        const wetFeedingList = document.createElement("div");
        wetFeedingList.className = "wet-feeding-list";

        function renderWetFeedingRows() {
            wetFeedingList.replaceChildren();

            wetFeedings[pet.id].slice(1).forEach(feeding => {
                wetFeedingList.appendChild(
                    createWetFeedingRow(feeding)
                );
            });
        }

        const addWetFeedingButton = document.createElement("button");
        addWetFeedingButton.type = "button";
        addWetFeedingButton.className = "add-wet-feeding";
        addWetFeedingButton.textContent = "+ Add feeding";

        addWetFeedingButton.addEventListener("click", () => {
            const dryCalories = calculateDryFoodCalories(
                feedingData[pet.id]
            );

            const allocatedWetCalories = wetFeedings[pet.id].reduce(
                (total, feeding) =>
                    total + feeding.calories,
                0
            );

            const remainingCalories = Math.max(
                0,
                pet.dailyCalories - dryCalories - allocatedWetCalories
            );

            const override = wetFoodOverrides[pet.id];
            const type = override?.type || wetFoodSelect.value;
            const flavor = override?.flavor || proteinSelect.value;
            const recommended = calculateWetFood(
                pet,
                remainingCalories,
                type,
                flavor
            );

            if (!recommended) return;

            wetFeedings[pet.id].push(
                createWetFeeding(
                    type,
                    flavor,
                    recommended.grams,
                    recommended.calories
                )
            );

            renderWetFeedingRows();
        });

        renderWetFeedingRows();

        const recipeBox = document.createElement("div");
        recipeBox.className = "recipe-box";

        const recipeDisclaimer = document.createElement("p");
        recipeDisclaimer.className = "recipe-disclaimer";

        recipeBox.append(recipeIngredients, dinnerResult);

        const recipeRow = document.createElement("div");
        recipeRow.className = "recipe-row";

        wetFoodCheckbox.setAttribute(
            "aria-label",
            `Mark ${pet.name}'s wet food as eaten`
        );

        wetFoodCheckboxLabel.replaceChildren(wetFoodCheckbox);
        recipeRow.append(recipeBox, wetFoodCheckboxLabel);

        wetFoodSection.append(
            wetFoodHeading, 
            overrideLabel, 
            flavorLabel, 
            recipeRow,
            wetFeedingList,
            addWetFeedingButton
        );
        dinnerContainer.appendChild(wetFoodSection);
        
        calculate();
    });
    displayFeedingDisclaimers();
}

proteinSelect.addEventListener("change", displayDryFoodCalculator);
wetFoodSelect.addEventListener("change", displayDryFoodCalculator);

/* Save the date, each pet's calorie target, dry food feedings and completion status, dry food calories, and selected wet food type and flavor */
function validateFeedings() {
    const errors = [];

    pets.forEach(pet => {
        const feedings = feedingData[pet.id] || [];

        feedings.forEach(feeding => {
            if (
                !Number.isFinite(feeding.grams) ||
                feeding.grams < 0
            ) {
                errors.push(
                    `${pet.name}: Feeding ${feeding.id} must have a valid, non-negative quantity.`
                );
            }
        });
    });
    return errors;
}
const saveFeedingsButton = document.getElementById("saveFeedings");

saveFeedingsButton.addEventListener("click", () => {
    const errors = validateFeedings();

    if (errors.length > 0) {
        alert("Cannot save feedings:\n\n" + errors.join("\n")
        );
        return;
    }
    const today = new Date().toLocaleDateString("en-CA");

    const dailyRecord = {
        date: today,
        sharedWetFoodType: wetFoodSelect.value,
        sharedWetFoodFlavor: proteinSelect.value,
        pets: pets.map(pet => {
            const dryFeedings = feedingData[pet.id].map(feeding => ({
                id: feeding.id,
                grams: feeding.grams,
                completed: feeding.completed,
                method: feeding.method ?? "manual",
                time: feeding.time ?? null
            }));

            const dryCalories = calculateDryFoodCalories(dryFeedings);

            const savedWetFeedings = wetFeedings[pet.id].map(feeding => ({
                id: feeding.id,
                time: feeding.time,
                type: feeding.type,
                flavor: feeding.flavor,
                grams: feeding.grams,
                calories: feeding.calories,
                completed: feeding.completed
            }));

            const consumedWetCalories = savedWetFeedings.reduce(
                (total, feeding) => {
                    return total + (feeding.completed ? feeding.calories : 0);
                },
                0
            );
            const override = wetFoodOverrides[pet.id];

            const wetFoodType = override?.type || wetFoodSelect.value;
            const wetFoodFlavor = override?.flavor || proteinSelect.value;

            const remainingCalories = Math.max(
                0,
                pet.dailyCalories - dryCalories
            );

            const wetFood = wetFoodEaten[pet.id] && wetFoodRecordedMeal[pet.id]
                ? wetFoodRecordedMeal[pet.id]
                : calculateWetFood(
                    pet,
                    remainingCalories,
                    wetFoodType,
                    wetFoodFlavor
            );

            const hasEatenWetFood = wetFoodEaten[pet.id] || false;

            const totalCaloriesConsumed = dryCalories + consumedWetCalories;

            return {
                id: pet.id,
                name: pet.name,
                species: pet.species,
                dailyCalories: pet.dailyCalories,
                dryFoodProduct: "Blue Buffalo Wilderness Indoor Chicken",
                dryFoodCaloriesPerGram,
                dryFeedings: dryFeedings.map(feeding => ({
                    ...feeding,
                    calories: feeding.grams * dryFoodCaloriesPerGram
                })),
                dryCalories,
                wetFeedings: savedWetFeedings,
                usesSharedWetFood: !override,
                wetFoodType: wetFood?.type ?? wetFoodType,
                wetFoodFlavor: wetFood?.flavor ?? wetFoodFlavor,
                wetFood,

                /* wetFoodCompleted is name used in saved data format, while wetFoodEaten is used by JS code */
                wetFoodCompleted: hasEatenWetFood,
                totalCaloriesConsumed
            };
        })
    };

    const history = JSON.parse(
        localStorage.getItem("feedingHistory") || "[]"
    );

    const existingIndex = history.findIndex(
        record => record.date === today
    );

    if (existingIndex >= 0) {
        const confirmed = confirm("A feeding record already exists for today. Replace it with the current feeding information?"
        );
        if (!confirmed) {
            return;
        }
        history[existingIndex] = dailyRecord;
    } else {
        history.push(dailyRecord);
    }

    const petsWithNoFeedings = pets.filter(pet => (feedingData[pet.id] || []).length === 0);

    if (petsWithNoFeedings.length > 0) {
        const petNames = petsWithNoFeedings
            .map(pet => pet.name)
            .join(", ");

        const confirmed = confirm(
            `${petNames} have no dry food feeding entries. Save anyway?`
        );

        if (!confirmed) {
            return;
        }
    }

    localStorage.setItem("feedingHistory", JSON.stringify(history));
    displayFeedingHistory();
    saveFeedingsButton.textContent = "Feedings Saved";
    alert("Today's feeding record was saved successfully.");
});

/* Settings: add a pet */

const petForm = document.getElementById("pet-form");
const petList = document.getElementById("pet-list");
const addPetButton = document.getElementById("add-pet-button");
const cancelPetButton = document.getElementById("cancel-pet-button");

let editingPetId = null;

addPetButton.addEventListener("click", () => {
    editingPetId = null;

    petForm.reset();
    petForm.hidden = false;
    document.getElementById("pet-form-title").textContent = "Add Pet";
});

cancelPetButton.addEventListener("click", () => {
    editingPetId = null; 
    petForm.reset();
    petForm.hidden = true;
});

petForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("pet-name").value.trim();
    const species = document.getElementById("pet-species").value;

    if (!name) {
        alert("Please enter a pet name.");
        return;
    }

    if (editingPetId !== null) {
        // Update existing pet without changing its ID
        const pet = pets.find(pet => pet.id === editingPetId);

        if (!pet) {
            alert("Pet not found");
            return;
        }

        pet.name = name;
        pet.species = species;
    } else {
        const newPet = {
                id: crypto.randomUUID(),
                name,
                species,
                birthdate: "",
                dailyCalories: 0
            };

            pets.push(newPet);
            wetFeedings[newPet.id] = [];
    }
    
    savePets();

    editingPetId = null;
    petForm.reset();
    petForm.hidden = true;

    displayPetList();
    refreshPetViews();
});

function removePet(petId) {
    const pet = pets.find(pet => pet.id === petId);

    if (!pet) {
        alert("Pet not found.");
        return;
    }

    const confirmed = confirm(
        `Remove ${pet.name} from active tracking? ` +
        "Their saved feeding and weight history will be preserved."       
    );

    if (!confirmed) return;

    pets = pets.filter(pet => pet.id !== petId);
    savePets();

    // Clear today's in-memory tracking data
    delete feedingData[petId];
    delete wetFeedings[petId];
    delete wetFoodOverrides[petId];
    delete wetFoodEaten[petId];
    delete wetFoodRecordedMeal[petId];

    // Reset form if this pet was not being edited
    if (editingPetId === petId) {
        editingPetId = null;
        petForm.reset();
        petForm.hidden = true;
    }

    displayPetList();
    refreshPetViews();
}

function displayPetList() {
    petList.replaceChildren();

    pets.forEach(pet => {
        const row = document.createElement("div");
        row.className = "pet-settings-row";

        const name = document.createElement("span");
        name.textContent = `${pet.name} (${pet.species})`;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editingPetId = pet.id;
            document.getElementById("pet-name").value = pet.name;
            document.getElementById("pet-species").value = pet.species;
            document.getElementById("pet-form-title").textContent = `Edit ${pet.name}`;
            petForm.hidden = false;
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.setAttribute("aria-label", `Remove ${pet.name} from active tracking`);

        removeButton.addEventListener("click", () => {
            removePet(pet.id);
        });

        row.append(name, editButton, removeButton);
        petList.appendChild(row);
    });
}

function refreshPetViews() {
    // Refresh pet-dependent interfaces after profile change
    updatePetSelectOptions();
    displayDryFoodCalculator();
    displayWeightHistory();
    displayWeightChart();
    displayWeighInReminders();
    displayFeedingHistory();
}

function updatePetSelectOptions() {
    const selectors = [
        weightPetSelect,
        weightChartFilter,
        document.getElementById("historyPetFilter")
    ];

    selectors.forEach(select => {
        const previousValue = select.value;
        const hasAllOption = select.id !== "weightPet";

        select.replaceChildren();

        if (hasAllOption) {
            const allOption = document.createElement("option");
            allOption.value = "all";
            allOption.textContent = "All Pets";
            select.appendChild(allOption);
        }

        pets.forEach(pet => {
            const option = document.createElement("option");
            option.value = pet.id;
            option.textContent = pet.name;
            select.appendChild(option);
        });

        if ([...select.options].some(option => option.value === previousValue)) {
            select.value = previousValue;
        }
    });
}

displayPetList();
updatePetSelectOptions();

function loadTodaysFeedings() {
    const today = new Date().toLocaleDateString("en-CA");

    const history = JSON.parse(
        localStorage.getItem("feedingHistory") || "[]"
    );

    const todayRecord = history.find(record => record.date === today);

    if (!todayRecord) return;

    /* Restore the shared wet food selection. */
    if (todayRecord.sharedWetFoodType) {
        wetFoodSelect.value = todayRecord.sharedWetFoodType;
        updateWetFoodFlavors();

        if (todayRecord.sharedWetFoodFlavor) {
            proteinSelect.value = todayRecord.sharedWetFoodFlavor;
        }
    }

    /* Support both old and new saved data structures */
    const savedPets = todayRecord.pets || todayRecord.cats || [];
    savedPets.forEach(savedPet => {
        feedingData[savedPet.id] = savedPet.dryFeedings.map(feeding => ({
            ...feeding,
            method: feeding.method ?? (feeding.id === 1 ? "auto" : "manual"),
            time: feeding.time 
                ? feeding.time.padStart(5, "0") 
                : (feeding.id === 1 ? "04:45" : "10:30")
        }));

        wetFoodEaten[savedPet.id] =
            savedPet.wetFoodCompleted ?? savedPet.wetFoodEaten ?? false;

            if (savedPet.wetFood) {
                wetFoodRecordedMeal[savedPet.id] = savedPet.wetFood;
            }

            if (Array.isArray(savedPet.wetFeedings) && savedPet.wetFeedings.length > 0) {
                wetFeedings[savedPet.id] = savedPet.wetFeedings;
            } else if (savedPet.wetFood && wetFoodEaten[savedPet.id]) {
                const meal = savedPet.wetFood;

                wetFeedings[savedPet.id] = [{
                    id: crypto.randomUUID(),
                    time: "",
                    type: meal.type,
                    flavor: meal.flavor,
                    grams: meal.grams,
                    calories: meal.calories,
                    completed: true
                }];
            }

        if (savedPet.usesSharedWetFood === false) {
            wetFoodOverrides[savedPet.id] = {
                type: savedPet.wetFoodType,
                flavor: savedPet.wetFoodFlavor
            };
        } else {
            delete wetFoodOverrides[savedPet.id];
        }
    });
}

function getFeedingHistory() {
    const history = JSON.parse(
        localStorage.getItem("feedingHistory") || "[]"
    );

    return history.sort((a, b) => b.date.localeCompare(a.date));
}

function updateFeedingHistoryRecord(date, petId, feedingType, feedingId, changes) {
    const history = JSON.parse(
        localStorage.getItem("feedingHistory") || "[]"
    );

    const dayRecord = history.find(record => record.date === date);

    if (!dayRecord) {
        /* console.error("Feeding history date not found:", date); */
        return false;
    }

    const savedPets = dayRecord.pets || dayRecord.cats || [];
    const savedPet = savedPets.find(pet => pet.id === petId);

    if (!savedPet) {
        /* console.error("Pet not found in feeding history:", petId); */
        return false;
    }

    const feedings = feedingType === "wet"
        ? savedPet.wetFeedings
        : savedPet.dryFeedings;

    if (!Array.isArray(feedings)) {
        console.error("Feeding records unavailable:", feedingType);
        return false;
    }

    const feeding = feedings.find(item => item.id === feedingId);

    if (!feeding) {
        console.error("Feeding not found:", feedingId);
        return false;
    }

    Object.assign(feeding, changes);
    
    if (feedingType === "dry" && "grams" in changes) {
    feeding.calories = feeding.grams *
        (savedPet.dryFoodCaloriesPerGram ?? dryFoodCaloriesPerGram);
    }
    
    if (feedingType === "wet" && "grams" in changes) {
        feeding.calories = calculateWetServingCalories(
            pets.find(pet => pet.id === petId),
            feeding.type,
            feeding.flavor,
            feeding.grams
        );
    }

    savedPet.dryCalories = calculateDryFoodCalories(savedPet.dryFeedings);

    const wetCalories = Array.isArray(savedPet.wetFeedings)
    ? savedPet.wetFeedings.reduce(
        (total, item) =>
            total + (item.completed ? item.calories : 0),
        0
    )
    : (savedPet.wetFoodCompleted ?? savedPet.wetFoodEaten ?? false)
        ? (savedPet.wetFood?.calories ?? 0)
        : 0;

    savedPet.totalCaloriesConsumed = savedPet.dryCalories + wetCalories;

    localStorage.setItem("feedingHistory", JSON.stringify(history));

    return true;
}

function deleteFeedingHistoryRecord(date, petId, feedingType, feedingId) {
    const history = JSON.parse(
        localStorage.getItem("feedingHistory") || "[]"
    );

    const dayRecord = history.find(record => record.date === date);

    if (!dayRecord) return false;

    const savedPets = dayRecord.pets || dayRecord.cats || [];
    const savedPet = savedPets.find(pet => pet.id === petId);

    if (!savedPet) return false;

    const feedings = feedingType === "dry"
        ? savedPet.dryFeedings
        : savedPet.wetFeedings;

    if (!Array.isArray(feedings)) return false;

    const feedingIndex = feedings.findIndex(
        feeding => feeding.id === feedingId
    );

    if (feedingIndex === -1) return false;

    feedings.splice(feedingIndex, 1);

    savedPet.dryCalories = calculateDryFoodCalories(
        savedPet.dryFeedings || []
    );

    const wetCalories = Array.isArray(savedPet.wetFeedings)
        ? savedPet.wetFeedings.reduce(
            (total, feeding) =>
                total + (feeding.completed ? feeding.calories : 0),
            0
        )
        : (savedPet.wetFoodCompleted ?? savedPet.wetFoodEaten ?? false)
            ? (savedPet.wetFood?.calories ?? 0)
            : 0;

    savedPet.totalCaloriesConsumed =
        savedPet.dryCalories + wetCalories;

    localStorage.setItem(
        "feedingHistory",
        JSON.stringify(history)
    );

    return true;
}

/* Show saved feeding history */
function displayFeedingHistory() {
    const container = document.getElementById("feedingHistory");
    const history = getFeedingHistory();

    const selectedPet = document.getElementById("historyPetFilter").value;
    const startDate = document.getElementById("historyStartDate").value;
    const endDate = document.getElementById("historyEndDate").value;

    const filteredHistory = history.filter(record =>
        (!startDate || record.date >= startDate) &&
        (!endDate || record.date <= endDate) && 
        (
            selectedPet === "all" ||
            (record.pets || record.cats || []).some(
                pet => pet.id === selectedPet
            )
        )
    );

    container.replaceChildren();

    if (filteredHistory.length === 0) {
        const message = document.createElement("p");
        message.textContent = history.length === 0 
            ? "No feeding history saved yet."
            : "No feeding records match your filters";
        container.appendChild(message);
        return;
    }

    filteredHistory.forEach(record => {
        const card = document.createElement("div");
        card.className = "history-card";

        const heading = document.createElement("h3");

        const date = new Date(`${record.date}T12:00:00`);

        heading.textContent = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

        card.appendChild(heading);

        const savedPets = record.pets || record.cats || [];

        const visiblePets = selectedPet === "all"
            ? savedPets
            : savedPets.filter(pet => pet.id === selectedPet);

        visiblePets.forEach(pet => {
            const summary = document.createElement("p");

            const historicalDryCalories = pet.dryCalories ??
                (pet.dryFeedings || []).reduce((total, feeding) => {
                    if (!feeding.completed) return total;

                    const calories = feeding.calories ??
                        feeding.grams * (pet.dryFoodCaloriesPerGram ?? 3.674);

                    return total + calories;
                }, 0);

            const historicalWetCalories = (pet.wetFoodCompleted ?? pet.wetFoodEaten ?? false)
                ? (pet.wetFood?.calories ?? 0)
                : 0;

            const consumedCalories = pet.totalCaloriesConsumed ??
                (historicalDryCalories + historicalWetCalories);

            summary.textContent =
                `${pet.name}: ${consumedCalories.toFixed(1)} / ${pet.dailyCalories.toFixed(1)} kcal consumed`;

            const details = document.createElement("details");

            const detailsHeading = document.createElement("summary");
            detailsHeading.textContent = "View feeding details";

            details.appendChild(detailsHeading);
            const editButton = document.createElement("button");

            const dryHeading = document.createElement("h4");
            dryHeading.textContent = "Dry Food";
            details.appendChild(dryHeading);

            if (!pet.dryFeedings || pet.dryFeedings.length === 0) {
                const message = document.createElement("p");
                message.textContent = "No dry feedings recorded.";
                details.appendChild(message);
            }

            (pet.dryFeedings || []).forEach(feeding => {

                const feedingItem = document.createElement("p");

                const calories = feeding.calories ??
                    feeding.grams * (pet.dryFoodCaloriesPerGram ?? 3.674);

                const recordedTime = feeding.time
                ? new Date(`2000-01-01T${feeding.time}:00`)
                    .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit"
                    })
                    : "Time not recorded";

                feedingItem.textContent =
                    `Feeding ${feeding.id}: ${feeding.grams} g ` +
                    `(${calories.toFixed(1)} kcal) — ` +
                    `${recordedTime} - ` +
                    (feeding.completed ? "Eaten" : "Not eaten");

                details.appendChild(feedingItem);
                
                const editDryGramsButton = document.createElement("button");
                editDryGramsButton.type = "button";
                editDryGramsButton.textContent = "Edit";

                editDryGramsButton.addEventListener("click", () => {
                    const input = prompt(
                        `Enter the new dry food quantity in grams for ${pet.name}, feeding ${feeding.id}:`,
                        feeding.grams.toFixed(1)
                    );

                    if (input === null) return;

                    if (
                        input.trim() === "" ||
                        !Number.isFinite(Number(input)) ||
                        Number(input) < 0
                    ) {
                        alert("Enter a valid, non-negative quantity.");
                        return;
                    }

                    const updated = updateFeedingHistoryRecord(
                        record.date,
                        pet.id,
                        "dry",
                        feeding.id,
                        { grams: Number(input) }
                    );

                    if (updated) {
                        displayFeedingHistory();
                    }
                });

                details.appendChild(editDryGramsButton); 

                const editDryTimeButton = document.createElement("button");
                editDryTimeButton.type = "button";
                editDryTimeButton.textContent = "Edit Time";

                editDryTimeButton.addEventListener("click", () => {
                    const input = prompt(
                        `Enter the feeding time for ${pet.name}, dry feeding ${feeding.id} (HH:MM, 24-hour format):`,
                        feeding.time || ""
                    );

                    if (input === null) return;

                    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

                    if (!timePattern.test(input)) {
                        alert("Enter a valid time in HH:MM format, such as 10:30.");
                        return;
                    }

                    const updated = updateFeedingHistoryRecord(
                        record.date,
                        pet.id,
                        "dry",
                        feeding.id,
                        { time: input }
                    );

                    if (updated) {
                        displayFeedingHistory();
                    }
                });

                details.appendChild(editDryTimeButton);

                const toggleDryCompletedButton = document.createElement("button");
                toggleDryCompletedButton.type = "button";

                toggleDryCompletedButton.textContent = feeding.completed
                    ? "Mark Not Eaten"
                    : "Mark Eaten";

                toggleDryCompletedButton.addEventListener("click", () => {
                    const updated = updateFeedingHistoryRecord(
                        record.date,
                        pet.id,
                        "dry",
                        feeding.id,
                        { completed: !feeding.completed }
                    );

                    if (updated) {
                        displayFeedingHistory();
                    }
                });

                details.appendChild(toggleDryCompletedButton);

                const deleteDryButton = document.createElement("button");
                deleteDryButton.type = "button";
                deleteDryButton.textContent = "Delete";

                deleteDryButton.addEventListener("click", () => {
                    const confirmed = confirm(
                        `Permanently delete ${pet.name}'s dry feeding ${feeding.id} from ${record.date}?`
                    );

                    if (!confirmed) return;

                    const deleted = deleteFeedingHistoryRecord(
                        record.date,
                        pet.id,
                        "dry",
                        feeding.id
                    );

                    if (deleted) {
                        displayFeedingHistory();
                    } else {
                        alert("Unable to delete the feeding record.");
                    }
                });

                details.appendChild(deleteDryButton);

            });

            const wetHeading = document.createElement("h4");
            wetHeading.textContent = "Wet Food";
            details.appendChild(wetHeading);

            if (Array.isArray(pet.wetFeedings)) {

                if (pet.wetFeedings.length === 0) {
                    const message = document.createElement("p");
                    message.textContent = "No wet feedings recorded.";
                    details.appendChild(message);
                }
                pet.wetFeedings.forEach((feeding, index) => {
                    const feedingItem = document.createElement("p");

                    const recordedTime = feeding.time
                        ? new Date(`2000-01-01T${feeding.time}:00`)
                            .toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit"
                            })
                        : "Time not recorded";

                    feedingItem.textContent =
                        `Wet Feeding ${index + 1}: ` +
                        `${feeding.flavor} (${feeding.type}) — ` +
                        `${feeding.grams.toFixed(1)} g, ` +
                        `${feeding.calories.toFixed(1)} kcal — ` +
                        `${recordedTime} — ` +
                        (feeding.completed ? "Eaten" : "Not eaten");

                    details.appendChild(feedingItem);             
                    
                    const editButton = document.createElement("button");
                    editButton.type = "button";
                    editButton.textContent = "Edit";
                    editButton.setAttribute(
                        "aria-label",
                        `Edit ${pet.name} wet feeding ${index + 1}`
                    );

                    editButton.addEventListener("click", () => {
                        const input = prompt(
                            `Enter the new quantity in grams for ${pet.name}'s wet feeding ${index + 1}:`,
                            feeding.grams.toFixed(1)
                        );

                        if (input === null) return;

                        if (
                            input.trim() === "" ||
                            !Number.isFinite(Number(input)) ||
                            Number(input) < 0
                        ) {
                            alert("Enter a valid, non-negative quantity.");
                            return;
                        }

                        const updated = updateFeedingHistoryRecord(
                            record.date,
                            pet.id,
                            "wet",
                            feeding.id,
                            { grams: Number(input) }
                        );

                        if (updated) {
                            displayFeedingHistory();
                        }
                    });

                    details.appendChild(editButton);

                    const editTimeButton = document.createElement("button");
                    editTimeButton.type = "button";
                    editTimeButton.textContent = "Edit Time";

                    editTimeButton.setAttribute(
                        "aria-label",
                        `Edit ${pet.name} wet feeding ${index + 1} time`
                    );

                    editTimeButton.addEventListener("click", () => {
                        const input = prompt(
                            `Enter the feeding time for ${pet.name} (HH:MM, 24-hour format):`,
                            feeding.time || ""
                        );

                        if (input === null) return;

                        const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

                        if (!timePattern.test(input)) {
                            alert("Enter a valid time in HH:MM format, such as 18:30.");
                            return;
                        }

                        const updated = updateFeedingHistoryRecord(
                            record.date,
                            pet.id,
                            "wet",
                            feeding.id,
                            { time: input }
                        );

                        if (updated) {
                            displayFeedingHistory();
                        }
                    });

                    details.appendChild(editTimeButton);

                    const toggleCompletedButton = document.createElement("button");
                    toggleCompletedButton.type = "button";

                    toggleCompletedButton.textContent = feeding.completed
                        ? "Mark Not Eaten"
                        : "Mark Eaten";

                    toggleCompletedButton.addEventListener("click", () => {
                        const updated = updateFeedingHistoryRecord(
                            record.date,
                            pet.id,
                            "wet",
                            feeding.id,
                            { completed: !feeding.completed }
                        );

                        if (updated) {
                            displayFeedingHistory();
                        }
                    });

                    details.appendChild(toggleCompletedButton);      

                    const deleteWetButton = document.createElement("button");
                    deleteWetButton.type = "button";
                    deleteWetButton.textContent = "Delete";

                    deleteWetButton.addEventListener("click", () => {
                        const confirmed = confirm(
                            `Permanently delete ${pet.name}'s wet feeding ${index + 1} from ${record.date}?`
                        );

                        if (!confirmed) return;

                        const deleted = deleteFeedingHistoryRecord(
                            record.date,
                            pet.id,
                            "wet",
                            feeding.id
                        );

                        if (deleted) {
                            displayFeedingHistory();
                        } else {
                            alert("Unable to delete the wet feeding record.");
                        }
                    });

                    details.appendChild(deleteWetButton);

                    });
                    } else {

                // Support records saved before multiple wet feedings existed.
                const wetDescription = document.createElement("p");

                if (pet.wetFood) {
                    wetDescription.textContent =
                        `${pet.wetFood.flavor} (${pet.wetFood.type}) — ` +
                        `${pet.wetFood.grams.toFixed(1)} g, ` +
                        `${pet.wetFood.calories.toFixed(1)} kcal — ` +
                        ((pet.wetFoodCompleted ?? pet.wetFoodEaten ?? false)
                            ? "Eaten"
                            : "Not eaten");
                } else {
                    wetDescription.textContent =
                        "Detailed wet food quantities unavailable for this record.";
                }

                details.appendChild(wetDescription);
            }

            if (
                pet.wetFood?.type === "homemade" &&
                pet.wetFood.ingredients?.length > 0 &&
                (
                    !Array.isArray(pet.wetFeedings) ||
                    pet.wetFeedings.length > 0
                )
            ) {
                const ingredientsHeading = document.createElement("h5");
                ingredientsHeading.textContent = "Recipe Ingredients";

                const ingredientsList = document.createElement("ul");

                pet.wetFood.ingredients.forEach(ingredient => {
                    const listItem = document.createElement("li");

                    listItem.textContent =
                        `${ingredient.name}: ${ingredient.grams.toFixed(1)} g`;

                    ingredientsList.appendChild(listItem);
                });

                details.append(ingredientsHeading, ingredientsList);
            }

            card.append(summary, details);
        });

        container.appendChild(card);
    });
}

/* Filter the feeding history results */
function initializeFeedingHistoryFilters() {
    const petFilter = document.getElementById("historyPetFilter");
    const startDate = document.getElementById("historyStartDate");
    const endDate = document.getElementById("historyEndDate");
    const clearButton = document.getElementById("clearHistoryFilters");

    document.getElementById("applyHistoryFilters")
        .addEventListener("click", displayFeedingHistory);
    
    clearButton.addEventListener("click", () => {
        petFilter.value = "all";
        startDate.value = "";
        endDate.value = "";
        displayFeedingHistory();
    });
}

loadTodaysFeedings();
displayDryFoodCalculator();
updateAutomaticFeedings();
displayDryFoodCalculator();
initializeFeedingHistoryFilters();
displayFeedingHistory();