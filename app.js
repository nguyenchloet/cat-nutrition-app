
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

const proteinSelect = document.getElementById("protein");

const cats = [
    { id: "annie", name: "Annie", dailyCalories: 235.9 },
    { id: "gus", name: "Gus", dailyCalories: 262.1 }
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
const dryFoodContainer = document.getElementById("dryFoodCalculator");
const dinnerContainer = document.getElementById("dinnerRecipes");

const feedingData = {};

function displayDryFoodCalculator() {
    dryFoodContainer.replaceChildren();

    cats.forEach(cat => {
       if (!feedingData[cat.id]) {
            feedingData[cat.id] = [
              { id: 1, grams: 10, completed: false },
              { id: 2, grams: 10, completed: false }
          ];
        }

        const section = document.createElement("div");
        section.className = "cat-feeding";

        const heading = document.createElement("h3");
        heading.textContent = cat.name;

        feedingData[cat.id].forEach(feeding => {
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

          gramsInput.addEventListener("input", () => {
            feeding.grams = Math.max(0, Number(gramsInput.value) || 0);
            calculate();
          });

          // complete a feeding button
          checkbox.addEventListener("change", () => {
            feeding.completed = checkbox.checked;
            calculate();
          });
          
          // remove a feeding button
          removeButton.addEventListener("click", () => {
            feedingData[cat.id] = feedingData[cat.id].filter(
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
          const feedings = feedingData[cat.id];

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

        const result = document.createElement("p");

        const dinnerResult = document.createElement("p");
        const proteinOverrideLabel = document.createElement("label");
        proteinOverrideLabel.textContent = "Different wet food protein:";
        const proteinOverrideSelect = document.createElement("select");

        proteinOverrideSelect.innerHTML = `
            <option value="chicken">Chicken</option>
            <option value="turkey">Turkey</option>
        `;

        proteinOverrideLabel.appendChild(proteinOverrideSelect);

        function calculate() {
            const totalDryGrams = feedingData[cat.id].reduce((total, feeding) => {
              return total + (feeding.completed ? feeding.grams : 0);
            }, 0);

            const dryCalories = totalDryGrams * dryFoodCaloriesPerGram;
            const remainingCalories = Math.max(0, cat.dailyCalories - dryCalories);

            result.textContent =
                `Daily target: ${cat.dailyCalories.toFixed(1)} kcal | ` + 
                `Dry food calories: ${dryCalories.toFixed(1)} kcal | ` +
                `Remaining calories for wet food: ${remainingCalories.toFixed(1)} kcal`;

                const selectedProtein = proteinSelect.value || proteinOverrideSelect.value;
                const selectedRecipe = recipes[selectedProtein][cat.name];

                if (selectedRecipe) {
                    const wetFoodCalories = remainingCalories;
                    const wetFoodGrams = (wetFoodCalories / selectedRecipe.calories) * selectedRecipe.ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);
                    dinnerResult.textContent = `Wet food portion: ${wetFoodGrams.toFixed(1)} grams of ${selectedProtein}`;
                } else {
                    dinnerResult.textContent = "No recipe available for this protein.";
                }
        }

        proteinSelect.addEventListener("change", calculate);

        section.prepend(heading);
        section.append(result, proteinOverrideLabel, dinnerResult);
        dryFoodContainer.appendChild(section);
        
        calculate();
    });
}

displayDryFoodCalculator();

const haloRecipes = {
    chicken: { caloriesPerGram: 1.025 },
    salmon: { caloriesPerGram: 1.047 },
    turkey: { caloriesPerGram: 0.985 }
};

const haloGrams = remainingCalories / haloRecipes[selectedFlavor].caloriesPerGram;