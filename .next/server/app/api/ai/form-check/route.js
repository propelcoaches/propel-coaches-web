"use strict";(()=>{var e={};e.id=1434,e.ids=[1434],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},81275:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>y,requestAsyncStorage:()=>f,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>_});var s={};r.r(s),r.d(s,{GET:()=>m,POST:()=>p,dynamic:()=>u});var o=r(49303),a=r(88716),n=r(60670),i=r(87070),c=r(65655),l=r(21664);let u="force-dynamic",d=new l.ZP({apiKey:process.env.OPENAI_API_KEY||"sk-placeholder"});async function p(e){let t;try{let r=(0,c.e)(),{data:{user:s},error:o}=await r.auth.getUser();if(o||!s)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{form_check_id:a}=await e.json();if(t=a,!a)return i.NextResponse.json({error:"Missing form_check_id"},{status:400});let{data:n,error:l}=await r.from("form_checks").select("*").eq("id",a).single();if(l||!n)return i.NextResponse.json({error:"Form check not found"},{status:404});await r.from("form_checks").update({ai_status:"processing"}).eq("id",a);let u=await d.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:`You are an expert strength coach and biomechanics analyst. You analyze exercise form from video descriptions and provide detailed, actionable feedback. Always return valid JSON.

Your analysis should cover:
1. Overall movement quality (score 1-10)
2. Specific form cues (what's good, what needs work)
3. Safety concerns if any
4. Coaching cues the athlete should focus on

Be constructive and specific. Reference body positions, joint angles, bar path, tempo, and common compensations.`},{role:"user",content:`Analyze the form for this exercise submission:

EXERCISE: ${n.exercise_name}
${n.weight_used?`WEIGHT: ${n.weight_used}`:""}
${n.reps_performed?`REPS: ${n.reps_performed}`:""}
${n.set_number?`SET: ${n.set_number}`:""}

VIDEO URL: ${n.video_url}

Please analyze the exercise form and return JSON with this EXACT structure:
{
  "overall_score": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": [
    {"cue": "<what they're doing well>", "detail": "<specific explanation>"}
  ],
  "improvements": [
    {"cue": "<what needs work>", "detail": "<specific explanation>", "priority": "<high|medium|low>", "drill": "<corrective exercise or drill to fix this>"}
  ],
  "safety_concerns": [
    {"concern": "<safety issue>", "recommendation": "<what to do>"}
  ],
  "coaching_cues": ["<short, memorable cue 1>", "<cue 2>", "<cue 3>"],
  "recommended_deload": <boolean - true if form is compromised enough to suggest reducing weight>
}`}],response_format:{type:"json_object"},temperature:.5,max_tokens:3e3}),p=JSON.parse(u.choices[0].message.content||"{}"),{error:m}=await r.from("form_checks").update({ai_analysis:p,ai_status:"completed",ai_model:"gpt-4o",ai_processed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",a);if(m)return console.error("Error saving analysis:",m),i.NextResponse.json({error:"Failed to save analysis"},{status:500});return i.NextResponse.json({analysis:p,form_check_id:a})}catch(e){console.error("Form check analysis error:",e);try{if(t){let e=(0,c.e)();await e.from("form_checks").update({ai_status:"failed"}).eq("id",t)}}catch{}return i.NextResponse.json({error:"Failed to analyze form"},{status:500})}}async function m(e){try{let t=(0,c.e)(),{data:{user:r}}=await t.auth.getUser();if(!r)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:s}=new URL(e.url),o=s.get("client_id"),a=s.get("status"),n=t.from("form_checks").select("*, client:profiles!form_checks_client_id_fkey(full_name, avatar_url)").eq("coach_id",r.id).order("created_at",{ascending:!1});o&&(n=n.eq("client_id",o)),a&&(n=n.eq("ai_status",a));let{data:l,error:u}=await n.limit(50);if(u)return i.NextResponse.json({error:"Failed to fetch form checks"},{status:500});return i.NextResponse.json({form_checks:l})}catch(e){return i.NextResponse.json({error:"Server error"},{status:500})}}let h=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/ai/form-check/route",pathname:"/api/ai/form-check",filename:"route",bundlePath:"app/api/ai/form-check/route"},resolvedPagePath:"/Users/charlesbettiol/.openclaw/workspace/web/src/app/api/ai/form-check/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:f,staticGenerationAsyncStorage:_,serverHooks:g}=h,x="/api/ai/form-check/route";function y(){return(0,n.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:_})}},65655:(e,t,r)=>{r.d(t,{e:()=>a});var s=r(67721),o=r(71615);function a(){let e=(0,o.cookies)();return(0,s.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:s})=>e.set(t,r,s))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,3786,9702,5972,1664],()=>r(81275));module.exports=s})();