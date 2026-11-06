
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
const recipeContainer = document.getElementById("recipes");

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

function displayRecipes() {
  const selectedProtein = proteinSelect.value;
  const selectedRecipes = recipes[selectedProtein];

  recipeContainer.replaceChildren(); // clear the previous recipes

  // if no recipes are found for the selected protein, display a message
  if (!selectedRecipes) {
    recipeContainer.textContent = "No verified Balance IT recipe saved for the selected protein.";
    return;
  }

  for (const [cat, recipe] of Object.entries(selectedRecipes)) {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const heading = document.createElement("h3");
    heading.textContent = cat;

    const details = document.createElement("p");
    details.textContent = `Balance IT Recipe #${recipe.id} | ${recipe.calories} kcal`;

    const ingredientsList = document.createElement("ul");

    for (const ingredient of recipe.ingredients) {
      const item = document.createElement("li");
      item.textContent = `${ingredient.name}: ${ingredient.grams} grams`;
      ingredientsList.appendChild(item);
    }
    
    card.append(heading, details, ingredientsList);
    recipeContainer.appendChild(card);
  }
}

proteinSelect.addEventListener("change", displayRecipes);
displayRecipes(); // Display recipes for the default selected protein on page load