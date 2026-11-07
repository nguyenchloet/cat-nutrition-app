
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
    { id: "annie", name: "Annie", species: "cat", dailyCalories: 235.9 },
    { id: "gus", name: "Gus", species: "cat", dailyCalories: 262.1 }
];

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

/* Recipes for canned Halo cat food. Add other types later */
const cannedRecipes = {
    chicken: { caloriesPerGram: 1.025 },
    salmon: { caloriesPerGram: 1.047 },
    turkey: { caloriesPerGram: 0.985 }
};

const dryFoodContainer = document.getElementById("dryFoodCalculator");
const dinnerContainer = document.getElementById("dinnerRecipes");

const feedingData = {};
const wetFoodOverrides = {};
const wetFoodCompleted = {};

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
            feeding.grams = Math.max(0, Number(gramsInput.value) || 0);
            calculate();
          });

          /* Complete a feeding button */
          checkbox.addEventListener("change", () => {
            feeding.completed = checkbox.checked;
            calculate();
          });
          
          /* Remove a feeding button */
          removeButton.addEventListener("click", () => {
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
            const totalDryGrams = feedingData[pet.id].reduce((total, feeding) => {
              return total + (feeding.completed ? feeding.grams : 0);
            }, 0);

            const dryCalories = totalDryGrams * dryFoodCaloriesPerGram;
            const remainingCalories = Math.max(0, pet.dailyCalories - dryCalories);

            const progress = Math.min(
                100,
                (dryCalories / pet.dailyCalories) * 100
                );

                result.innerHTML = `
                    <div class="calorie-stats">

                        <div class="calorie-stat">
                            <span>Dry food</span>
                            <strong>${dryCalories.toFixed(1)}</strong>
                            <small>kcal</small>
                        </div>

                        <div class="calorie-stat">
                            <span>Remaining Calories</span>
                            <strong>${remainingCalories.toFixed(1)}</strong>
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
                        aria-label="${pet.name} dry food calorie progress"
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

                if (selectWetFoodType === "canned") {
                  recipeIngredients.replaceChildren();
                  const selectedCanned = cannedRecipes[selectedProtein];
                  const wetFoodGrams = remainingCalories / selectedCanned.caloriesPerGram;
                  dinnerResult.replaceChildren();

                  const totalLabel = document.createElement("span");
                  totalLabel.textContent = "Total meal weight";

                  const totalAmount = document.createElement("span");
                  totalAmount.textContent = `${wetFoodGrams.toFixed(1)} g`;

                  dinnerResult.append(totalLabel, totalAmount);
                } else if (selectWetFoodType === "homemade") { 
                  const selectedRecipe = recipes[selectedProtein][pet.name];
                 
                  const scaleFactor = remainingCalories / selectedRecipe.calories;

                  recipeIngredients.replaceChildren(); 
                  
                  selectedRecipe.ingredients.forEach(ingredient => {
                    const item = document.createElement("li");

                    const name = document.createElement("span");
                    name.textContent = ingredient.name;

                    const amount = document.createElement("span");
                    const adjustedGrams = ingredient.grams * scaleFactor; 
                    amount.textContent = `${adjustedGrams.toFixed(2)} g`;

                    item.append(name, amount);

                    recipeIngredients.appendChild(item);
                  });
                  const recipeGrams = selectedRecipe.ingredients.reduce(
                    (sum, ingredient) => sum + ingredient.grams,
                    0
                  );
                  const wetFoodGrams = (remainingCalories / selectedRecipe.calories) * recipeGrams;
                  dinnerResult.replaceChildren();

                  const totalLabel = document.createElement("span");
                  totalLabel.textContent = "Total meal weight";

                  const totalAmount = document.createElement("span");
                  totalAmount.textContent = `${wetFoodGrams.toFixed(1)} g`;

                  dinnerResult.append(totalLabel, totalAmount);
                } else {
                    dinnerResult.textContent = "No recipe available for this protein.";
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
        wetFoodCheckbox.checked = wetFoodCompleted[pet.id] || false;

        wetFoodCheckbox.addEventListener("change", () => {
            wetFoodCompleted[pet.id] = wetFoodCheckbox.checked;
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
const saveFeedingsButton = document.getElementById("saveFeedings");

saveFeedingsButton.addEventListener("click", () => {
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

            const dryCalories = dryFeedings.reduce(
                (total, feeding) =>
                    total + (feeding.completed
                        ? feeding.grams * dryFoodCaloriesPerGram
                        : 0),
                0
            );

            const override = wetFoodOverrides[pet.id];

            return {
                id: pet.id,
                name: pet.name,
                dailyCalories: pet.dailyCalories,
                dryFeedings,
                dryCalories,
                usesSharedWetFood: !override,
                wetFoodType: override?.type || wetFoodSelect.value,
                wetFoodFlavor: override?.flavor || proteinSelect.value,
                wetFoodCompleted: wetFoodCompleted[pet.id] || false
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
        history[existingIndex] = dailyRecord;
    } else {
        history.push(dailyRecord);
    }

    localStorage.setItem("feedingHistory", JSON.stringify(history));

    saveFeedingsButton.textContent = "Feedings Saved";
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

        wetFoodCompleted[savedPet.id] =
            savedPet.wetFoodCompleted || false;

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

loadTodaysFeedings();
displayDryFoodCalculator();