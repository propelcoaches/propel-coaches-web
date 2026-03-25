"use strict";(()=>{var e={};e.id=6386,e.ids=[6386],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63248:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>b,patchFetch:()=>E,requestAsyncStorage:()=>y,routeModule:()=>g,serverHooks:()=>f,staticGenerationAsyncStorage:()=>h});var r={};t.r(r),t.d(r,{POST:()=>d,dynamic:()=>p});var n=t(49303),s=t(88716),i=t(60670),o=t(87070),l=t(65655),c=t(21664);let p="force-dynamic",m=new c.ZP({apiKey:process.env.OPENAI_API_KEY||"sk-placeholder"}),u={3:["breakfast","lunch","dinner"],4:["breakfast","snack_1","lunch","dinner"],5:["breakfast","snack_1","lunch","snack_2","dinner"],6:["breakfast","snack_1","lunch","snack_2","dinner","snack_3"]},_=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];async function d(e){try{var a;let t=(0,l.e)(),{data:{user:r},error:n}=await t.auth.getUser();if(n||!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{client_id:s,title:i,target_calories:c,target_protein_g:p,target_carbs_g:d,target_fat_g:g,dietary_preferences:y=[],allergies:h=[],cuisine_preferences:f=[],meals_per_day:b=4,notes:E}=await e.json();if(!s||!c||!p||!d||!g)return o.NextResponse.json({error:"Missing required fields"},{status:400});let A=u[b]||u[4],x=(a={target_calories:c,target_protein_g:p,target_carbs_g:d,target_fat_g:g,dietary_preferences:y,allergies:h,cuisine_preferences:f,meals_per_day:b,mealTypes:A,notes:E},`Generate a complete 7-day meal plan with the following requirements:

DAILY MACRO TARGETS:
- Calories: ${a.target_calories} kcal (\xb150 kcal tolerance per day)
- Protein: ${a.target_protein_g}g (\xb15g tolerance)
- Carbs: ${a.target_carbs_g}g (\xb110g tolerance)
- Fat: ${a.target_fat_g}g (\xb15g tolerance)

MEALS PER DAY: ${a.meals_per_day}
MEAL TYPES TO USE: ${a.mealTypes.join(", ")}

${a.dietary_preferences.length>0?`DIETARY PREFERENCES: ${a.dietary_preferences.join(", ")}`:""}
${a.allergies.length>0?`ALLERGIES/INTOLERANCES (MUST AVOID): ${a.allergies.join(", ")}`:""}
${a.cuisine_preferences.length>0?`CUISINE PREFERENCES: ${a.cuisine_preferences.join(", ")}`:""}
${a.notes?`ADDITIONAL NOTES: ${a.notes}`:""}

Return JSON with this EXACT structure:
{
  "days": [
    {
      "day_number": 1,
      "total_calories": <number>,
      "total_protein_g": <number>,
      "total_carbs_g": <number>,
      "total_fat_g": <number>,
      "meals": [
        {
          "meal_type": "<one of: ${a.mealTypes.join(", ")}>",
          "name": "<meal name>",
          "description": "<1-2 sentence description>",
          "prep_time_minutes": <number>,
          "cook_time_minutes": <number>,
          "servings": 1,
          "calories": <number>,
          "protein_g": <number>,
          "carbs_g": <number>,
          "fat_g": <number>,
          "fiber_g": <number>,
          "ingredients": [
            {"name": "<ingredient>", "amount": "<quantity>", "unit": "<unit>"}
          ],
          "instructions": ["<step 1>", "<step 2>"]
        }
      ]
    }
  ],
  "shopping_list": [
    {"category": "<Produce|Protein|Dairy|Grains|Pantry|Frozen|Other>", "name": "<item>", "amount": "<total for week>", "unit": "<unit>", "checked": false}
  ]
}

RULES:
- Each day must have exactly ${a.meals_per_day} meals
- Day numbers go from 1 (Monday) to 7 (Sunday)
- Vary meals across days — do not repeat the same meal more than twice in the week
- Shopping list should aggregate ingredients across all 7 days
- All macro values must be numbers (not strings)
- Include fiber for each meal
- Keep recipes practical — under 30 min prep for most meals
- Snacks should be quick and simple`),k=await m.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:`You are an expert sports nutritionist and meal planning AI. You create detailed, practical meal plans with accurate macro counts. Always return valid JSON matching the exact schema requested. Be creative with meals — avoid repeating the same meal across days. Use whole, minimally processed foods where possible.`},{role:"user",content:x}],response_format:{type:"json_object"},temperature:.8,max_tokens:16e3}),S=JSON.parse(k.choices[0].message.content||"{}");if(!S.days||!Array.isArray(S.days))return o.NextResponse.json({error:"AI returned invalid format"},{status:500});let{data:v,error:w}=await t.from("meal_plans").insert({coach_id:r.id,client_id:s,title:i||`${c}kcal Meal Plan`,status:"draft",target_calories:c,target_protein_g:p,target_carbs_g:d,target_fat_g:g,dietary_preferences:y,allergies:h,cuisine_preferences:f,meals_per_day:b,notes:E,ai_model:"gpt-4o"}).select().single();if(w)return console.error("Error creating meal plan:",w),o.NextResponse.json({error:"Failed to save meal plan"},{status:500});for(let e of S.days){let{data:a,error:r}=await t.from("meal_plan_days").insert({meal_plan_id:v.id,day_number:e.day_number,day_label:_[e.day_number-1],total_calories:e.total_calories,total_protein_g:e.total_protein_g,total_carbs_g:e.total_carbs_g,total_fat_g:e.total_fat_g}).select().single();if(r){console.error("Error creating meal plan day:",r);continue}for(let r=0;r<e.meals.length;r++){let n=e.meals[r];await t.from("meal_plan_meals").insert({meal_plan_day_id:a.id,meal_type:n.meal_type,sort_order:r,name:n.name,description:n.description,prep_time_minutes:n.prep_time_minutes,cook_time_minutes:n.cook_time_minutes,servings:n.servings||1,calories:n.calories,protein_g:n.protein_g,carbs_g:n.carbs_g,fat_g:n.fat_g,fiber_g:n.fiber_g,ingredients:n.ingredients,instructions:n.instructions})}}S.shopping_list&&await t.from("meal_plan_shopping_lists").insert({meal_plan_id:v.id,items:S.shopping_list});let{data:P}=await t.from("meal_plans").select(`
        *,
        meal_plan_days (
          *,
          meal_plan_meals (*)
        ),
        meal_plan_shopping_lists (*)
      `).eq("id",v.id).single();return o.NextResponse.json({meal_plan:P})}catch(e){return console.error("Meal plan generation error:",e),o.NextResponse.json({error:"Failed to generate meal plan"},{status:500})}}let g=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/ai/meal-plan/route",pathname:"/api/ai/meal-plan",filename:"route",bundlePath:"app/api/ai/meal-plan/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/ai/meal-plan/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:y,staticGenerationAsyncStorage:h,serverHooks:f}=g,b="/api/ai/meal-plan/route";function E(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:h})}},65655:(e,a,t)=>{t.d(a,{e:()=>s});var r=t(67721),n=t(71615);function s(){let e=(0,n.cookies)();return(0,r.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(a){try{a.forEach(({name:a,value:t,options:r})=>e.set(a,t,r))}catch{}}}})}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[8948,3786,9702,5972,1664],()=>t(63248));module.exports=r})();