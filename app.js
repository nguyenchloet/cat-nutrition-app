
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
const pets = [
    { id: "annie", name: "Annie", species: "cat", birthdate: "2017-12-24", dailyCalories: 235.9 },
    { id: "gus", name: "Gus", species: "cat", birthdate: "2023-04-10", dailyCalories: 262.1 }
];

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
    alert("Weight record saved successfully.");
});

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

    ["Date", "Pet", "Weight", "Notes"].forEach(label => {
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

        row.append(dateCell, petCell, weightCell, notesCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
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
        const recipe = recipes[flavor][pet.name];
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

/* Display the dry food calculator for each pet */
function displayDryFoodCalculator() {
    dryFoodContainer.replaceChildren();
    dinnerContainer.replaceChildren();

    pets.forEach(pet => {
       if (!feedingData[pet.id]) {
            feedingData[pet.id] = [
              { id: 1, grams: 10, completed: false },
              { id: 2, grams: 10, completed: false }
          ];
        }

        const section = document.createElement("div");
        section.className = "pet-feeding";

        const heading = document.createElement("h3");
        heading.textContent = pet.name;

        feedingData[pet.id].forEach(feeding => {
          const row = document.createElement("div");
          row.className = "feeding-row";

          const label = document.createElement("span");
          label.textContent = `Dry Food ${feeding.id}`;

          const gramsInput = document.createElement("input");
          gramsInput.type = "number";
          gramsInput.min = "0";
          gramsInput.step = "0.1";
          gramsInput.value = feeding.grams;

          const unit = document.createElement("span");
          unit.textContent = "g";

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.textContent = "×";
          removeButton.className = "remove-feeding";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = feeding.completed;

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
          
          row.append(label, gramsInput, unit, removeButton, checkbox);
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
              grams: 0,
              completed: false
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
            const consumedWetCalories = wetFoodEaten[pet.id] ? (wetFoodRecordedMeal[pet.id]?.calories ?? 0) : 0;
            const totalConsumedCalories = dryCalories + consumedWetCalories;

            const progress = pet.dailyCalories > 0
            ? Math.min(100, (totalConsumedCalories / pet.dailyCalories) * 100)
            : 0;

                result.innerHTML = `
                    <div class="calorie-stats">

                        <div class="calorie-stat">
                            <span>Dry food</span>
                            <strong>${dryCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>

                        <div class="calorie-stat">
                            <span>Wet food</span>
                            <strong>${consumedWetCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>

                         <div class="calorie-stat">
                            <span>Daily Target</span>
                            <strong>${pet.dailyCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>
                    </div>

                    <div class="calorie-progress"
                        role="progressbar"
                        aria-label="${pet.name} total calorie consumption"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="${progress.toFixed(0)}">
                        <div class="calorie-progress-fill"
                            style="width: ${progress}%"></div>
                    </div>
                    
                `;
                const override = wetFoodOverrides[pet.id];
                const selectedProtein = override
                    ? override.flavor
                    : proteinSelect.value;

                const selectWetFoodType = override
                    ? override.type
                    : wetFoodSelect.value;

                /* Preserve recorded meal in saved data even when eaten checkbox is unchecked */
                const wetFood = wetFoodEaten[pet.id] && wetFoodRecordedMeal[pet.id]
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
        <option value="canned">Canned</option>
`;

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
        wetFoodCheckbox.checked = wetFoodEaten[pet.id] || false;

        wetFoodCheckbox.addEventListener("change", () => {
            if (wetFoodCheckbox.checked) {
                const dryCalories = calculateDryFoodCalories(feedingData[pet.id]);

                const remainingCalories = Math.max(
                    0,
                    pet.dailyCalories - dryCalories
                );
                const override = wetFoodOverrides[pet.id];

                const type = override?.type || wetFoodSelect.value;
                const flavor = override?.flavor || proteinSelect.value;

                wetFoodRecordedMeal[pet.id] =
                    calculateWetFood(
                        pet,
                        remainingCalories,
                        type,
                        flavor
                    );

                wetFoodEaten[pet.id] = true;
            } else {
                const confirmed = confirm(
                    `Unmark ${pet.name}'s wet food as eaten? The recorded amount will be preserved.`
                );
                if (!confirmed) {
                    wetFoodCheckbox.checked = true;
                    return;
                }

                wetFoodEaten[pet.id] = false;
            }
            calculate();
        });

        wetFoodCheckboxLabel.append(
            wetFoodCheckbox,
            " Wet food eaten"
        );

        const recipeBox = document.createElement("div");
        recipeBox.className = "recipe-box";

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
            recipeRow);
        dinnerContainer.appendChild(wetFoodSection);
        
        calculate();
    });
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
                completed: feeding.completed
            }));

            const dryCalories = calculateDryFoodCalories(dryFeedings);

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

            const totalCaloriesConsumed =
                dryCalories + (hasEatenWetFood ? wetFood?.calories || 0 : 0);

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

                usesSharedWetFood: !override,
                wetFoodType: wetFood.type,
                wetFoodFlavor: wetFood.flavor,
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
        feedingData[savedPet.id] = savedPet.dryFeedings;

        wetFoodEaten[savedPet.id] =
            savedPet.wetFoodCompleted ?? savedPet.wetFoodEaten ?? false;

            if (savedPet.wetFood) {
                wetFoodRecordedMeal[savedPet.id] = savedPet.wetFood;
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

function displayFeedingHistory() {
    const container = document.getElementById("feedingHistory");
    const history = getFeedingHistory();

    container.replaceChildren();

    if (history.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No feeding history saved yet.";
        container.appendChild(message);
        return;
    }

    history.forEach(record => {
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

        savedPets.forEach(pet => {
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

            const dryHeading = document.createElement("h4");
            dryHeading.textContent = "Dry Food";
            details.appendChild(dryHeading);

            (pet.dryFeedings || []).forEach(feeding => {
                const feedingItem = document.createElement("p");

                const calories = feeding.calories ??
                    feeding.grams * (pet.dryFoodCaloriesPerGram ?? 3.674);

                feedingItem.textContent =
                    `Feeding ${feeding.id}: ${feeding.grams} g ` +
                    `(${calories.toFixed(1)} kcal) — ` +
                    (feeding.completed ? "Eaten" : "Not eaten");

                details.appendChild(feedingItem);
            });

            const wetHeading = document.createElement("h4");
            wetHeading.textContent = "Wet Food";
            details.appendChild(wetHeading);

            const wetDescription = document.createElement("p");

            if (pet.wetFood) {
                wetDescription.textContent =
                    `${pet.wetFood.flavor} (${pet.wetFood.type}) — ` +
                    `${pet.wetFood.grams.toFixed(1)} g, ` +
                    `${pet.wetFood.calories.toFixed(1)} kcal — ` +
                    ((pet.wetFoodCompleted ?? pet.wetFoodEaten ?? false) ? "Eaten" : "Not eaten");
            } else {
                wetDescription.textContent =
                    "Detailed wet food quantities unavailable for this record.";
            }

            details.appendChild(wetDescription);

            if (
                pet.wetFood?.type === "homemade" &&
                pet.wetFood.ingredients?.length > 0
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

loadTodaysFeedings();
displayDryFoodCalculator();
displayFeedingHistory();