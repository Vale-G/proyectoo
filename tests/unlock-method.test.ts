import test from "node:test";
import assert from "node:assert/strict";
import { intakeOrderSchema } from "../src/lib/intake";
import { fixture } from "./fixture";
test("unlock choice accepts only a method and strips credential fields",()=>{
  const raw=fixture();
  const parsed=intakeOrderSchema.parse({...raw,intake:{...raw.intake,unlockMethod:"pin",pin:"1234",password:"secret",pattern:[1,2,3]}});
  assert.equal(parsed.intake.unlockMethod,"pin");
  for(const key of ["pin","password","pattern"]) assert.equal(key in parsed.intake,false);
  assert.throws(()=>intakeOrderSchema.parse({...raw,intake:{...raw.intake,unlockMethod:"1234"}}));
  assert.equal(intakeOrderSchema.parse(raw).intake.unlockMethod,undefined);
});

test("unlock metadata persists with the intake and stays out of public tracking",async()=>{
  const {testDatabase}=await import("./database");
  const {repairStore}=await import("../src/lib/repair-store");
  const {workshops}=await import("../src/db/schema");
  const env=await testDatabase();
  try{
    const [workshop]=await env.database.insert(workshops).values({name:"Taller QA",publicName:"Taller QA"}).returning();
    const store=repairStore(env.database);
    const input=fixture();
    const order=await store.createOrder(workshop.id,{...input,intake:{...input.intake,unlockMethod:"pattern"}});
    const saved=await store.getOrder(workshop.id,order.id);
    assert.equal(saved?.intakeData?.unlockMethod,"pattern");
    const publicOrder=await store.getPublicOrder(order.publicToken);
    assert.equal("intakeData" in publicOrder!,false);
    assert.equal(JSON.stringify(publicOrder).includes("unlockMethod"),false);
  }finally{await env.close()}
});
