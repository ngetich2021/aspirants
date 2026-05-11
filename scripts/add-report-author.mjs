import "dotenv/config";
const TURSO_URL = `${process.env.TURSO_DATABASE_URL.replace("libsql://","https://")}/v2/pipeline`;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
async function exec(sql){
  const r=await fetch(TURSO_URL,{method:"POST",headers:{Authorization:`Bearer ${TURSO_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({requests:[{type:"execute",stmt:{sql,args:[]}},{type:"close"}]})});
  const d=await r.json();
  const e=d.results?.find(x=>x.type==="error");
  if(e)throw new Error(JSON.stringify(e));
}
try{
  await exec("ALTER TABLE Report ADD COLUMN addedById TEXT REFERENCES User(id) ON DELETE SET NULL");
  console.log("✓ addedById added to Report");
}catch(e){
  if(e.message.includes("duplicate"))console.log("⚠ already exists");
  else{console.error(e.message);process.exit(1);}
}
