"use client";

import { Spinner } from "@/components/spinner";
import { useMutation } from "@tanstack/react-query";

interface MealPlanInput {
  dietType: string;
  calories: number;
  allergies: string;
  cuisine: string;
  snacks: boolean;
  days?: number;
}

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

interface WeeklyMealPlan {
  [day: string]: DailyMealPlan;
}

interface MealPlanResponse {
  mealPlan?: WeeklyMealPlan;
  error?: string;
}

async function generateMealPlan(payload: MealPlanInput) {
  const response = await fetch("/api/generate-mealplan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export default function MealPlanDashboard() {
  const { isPending, mutate, isSuccess, data } = useMutation<MealPlanResponse, Error, MealPlanInput>({
    mutationFn: generateMealPlan,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const payload: MealPlanInput = {
      dietType: formData.get("dietType")?.toString() || "",
      calories: Number(formData.get("calories")) || 2000,
      allergies: formData.get("allergies")?.toString() || "",
      cuisine: formData.get("cuisine")?.toString() || "",
      snacks: formData.get("snacks") === "on",
      days: 7,
    };

    mutate(payload);
  }

  const daysOfTheWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const getMealPlanForDay = (day: string): DailyMealPlan | undefined => {
    if (!data?.mealPlan) return;
    return data?.mealPlan?.[day] || {};
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/3 lg:w-1/4 p-6 bg-rose-500 text-white">
          <h1 className="text-2xl font-bold mb-6 text-center">Meal Plan Dashboard</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="dietType" className="block text-sm font-medium mb-2">
                Diet Type
              </label>
              <input
                type="text"
                id="dietType"
                name="dietType"
                className="w-full px-4 py-2 bg-white text-gray-800 border border-rose-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
                placeholder="e.g. Vegetarian, Vegan, Keto..."
              />
            </div>
            <div>
              <label htmlFor="calories" className="block text-sm font-medium mb-2">
                Daily Calorie Goal
              </label>
              <input
                type="number"
                id="calories"
                name="calories"
                required
                min={500}
                max={15000}
                className="w-full px-4 py-2 bg-white text-gray-800 border border-rose-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="e.g. 2000"
              />
            </div>
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium mb-2">
                Allergies
              </label>
              <input
                type="text"
                id="allergies"
                name="allergies"
                className="w-full px-4 py-2 bg-white text-gray-800 border border-rose-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
                placeholder="e.g. nuts, dairy, none"
              />
            </div>
            <div>
              <label htmlFor="cuisine" className="block text-sm font-medium mb-2">
                Preferred Cuisine
              </label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                className="w-full px-4 py-2 bg-white text-gray-800 border border-rose-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
                placeholder="e.g. Indian, Persian, Chinese"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="snacks" name="snacks" className="h-4 w-4 text-rose-400" />
              <label htmlFor="snacks" className="text-sm font-medium">
                Include Snacks
              </label>
            </div>
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-rose-400"
              >
                {isPending ? "Generating..." : "Generate Meal Plan"}
              </button>
            </div>
          </form>
        </div>

        {/* Weekly Meal Plan Section */}
        <div className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6 text-rose-600">Weekly Meal Plan</h2>

          {data?.mealPlan && isSuccess ? (
            <div className="grid gap-6">
              {daysOfTheWeek.map((day, key) => {
                const mealplan = getMealPlanForDay(day);
                return (
                  <div
                    key={key}
                    className="p-4 bg-rose-50 rounded-lg shadow-md border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-rose-500 mb-3">{day}</h3>
                    {mealplan ? (
                      <ul className="space-y-2 text-gray-800">
                        {mealplan.Breakfast && (
                          <li>
                            <span className="font-medium text-rose-600">Breakfast:</span> {mealplan.Breakfast}
                          </li>
                        )}
                        {mealplan.Lunch && (
                          <li>
                            <span className="font-medium text-rose-600">Lunch:</span> {mealplan.Lunch}
                          </li>
                        )}
                        {mealplan.Dinner && (
                          <li>
                            <span className="font-medium text-rose-600">Dinner:</span> {mealplan.Dinner}
                          </li>
                        )}
                        {mealplan.Snacks && (
                          <li>
                            <span className="font-medium text-rose-600">Snacks:</span> {mealplan.Snacks}
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No meal plan available for this day.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : isPending ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            <p className="text-gray-600 text-center">Please generate a meal plan to see it here.</p>
          )}
        </div>
      </div>
    </div>
  );
}