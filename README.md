# Pet Nutrition Tracker

A mobile-friendly web application for managing homemade pet food recipes, tracking daily nutrition, monitoring weight changes, and recording dietary and behavioral observations.

Designed for my cats, with an emphasis on accurate nutritional information and evidence-based pet food safety monitoring.

[App Link](https://nguyenchloet.github.io/pet-nutrition-app/)

## Planned Features & Roadmap

- **Daily Recipes:** View Balance IT recipes for chicken and turkey, with ingredient quantities measured in grams. Recipes for salmon could not be generated. Calculate adjusted dinner portions based on recorded dry food consumption. Reference: https://balance.it/recipes
- **Meal Tracking:** Track and save homemade meals, canned food, dry kibble, snacks, and daily calorie intake. Support multiple dry and wet feedings, editable feeding times, completion tracking, and historical records. Snack tracking remains planned.
- **Weight Tracking:** Record weigh-ins, set individual target weights, and visualize weight history.
- **Food Product Library:** Save commercial cat foods with product photos, nutritional information, and calorie densities.
- **Product Safety Monitoring:** Track FDA recalls, independent laboratory findings, and credible consumer investigations.
- **Safety Classifications:** Automatically categorize products as Verified Low-Risk, No Verified Concerns, Under Review, Confirmed Concern, or Not Yet Checked.
- **Health Journal:** Record appetite, digestive symptoms, dietary changes, and behavioral observations.
- **Data Management:** Store records locally with options to export and import backups. Daily feeding records are currently stored in browser localStorage; export and import remain planned.

## Technology

- HTML5
- CSS3
- JavaScript
- GitHub Pages
- GitHub Actions (planned for automated safety monitoring)
- Chart.js for weight visualization
- Browser localStorage for feeding history persistence

## Development Status

Active development. The initial responsive layout is complete. Interactive features, nutritional calculations, and local feeding history persistence have been implemented.

Implemented or substantially developed:
- Daily feeding interface with individual cat calorie targets.
- Dry and wet food quantity and calorie calculations.
- Multiple feeding records with editable times and completion status.
- Daily feeding history saved in localStorage.
- History editing, completion toggles, and individual feeding deletion.
- Support for displaying older saved feeding records.
- Weight tracking and visualization.

In progress:
- Synchronizing changes between today's History records and the Tonight page.

Planned:
- Food product library and evidence-based safety monitoring.
- Health journal and dietary observations.
- Data export and import.
- Automated safety monitoring using GitHub Actions.

## Nutritional Accuracy

Homemade recipes are based on saved Balance IT formulations. Ingredient substitutions and nutritional adjustments must be verified rather than assumed.

The application calculates calories from recorded feeding quantities and saved nutritional values. These calculations do not independently verify the nutritional completeness or appropriateness of a modified recipe.

Commercial food calorie information will be sourced from manufacturer labels or other identifiable product documentation.

This application is intended for personal dietary tracking and does not replace veterinary nutritional assessment.

## Product Safety

Safety classifications will be evidence-based and linked to identifiable sources. A product without reported recalls or contamination findings is not necessarily free of contaminants.

## Hosting

The application runs on GitHub Pages.

## License

Personal project. No license has been assigned.
