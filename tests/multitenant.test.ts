import test from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { testDatabase } from "./database";
import { workshopMembers, workshops, customers, devices, repairOrders } from "../src/db/schema";
import { resolveWorkshop } from "../src/lib/workshop-membership";
import { repairStore } from "../src/lib/repair-store";
import { fixture } from "./fixture";

test("verified memberships isolate two workshops and deny escalation", async () => {
  const env=await testDatabase();
  try {
    const [a,b]=await env.database.insert(workshops).values([{name:"Uno",publicName:"Uno"},{name:"Dos",publicName:"Dos"}]).returning();
    const alice="10000000-0000-4000-8000-000000000001", bob="10000000-0000-4000-8000-000000000002";
    await env.database.insert(workshopMembers).values([{workshopId:a.id,userId:alice,role:"owner"},{workshopId:b.id,userId:bob,role:"admin"}]);
    assert.equal((await resolveWorkshop(env.database,alice)).workshop.id,a.id);
    await assert.rejects(resolveWorkshop(env.database,alice,b.id));
    await assert.rejects(resolveWorkshop(env.database,bob,a.id));
    await env.database.insert(workshopMembers).values({workshopId:b.id,userId:alice,role:"technician"});
    await assert.rejects(resolveWorkshop(env.database,alice,b.id));
    await assert.rejects(resolveWorkshop(env.database,alice));
    const store=repairStore(env.database);
    const order=await store.createOrder(a.id,fixture());
    assert.equal(await store.getOrder(b.id,order.id),null);
    assert.deepEqual(await store.listOrders(b.id),[]);
    assert.deepEqual(await store.listCustomers(b.id),[]);
    await assert.rejects(store.changeStatus(b.id,order.id,0,"diagnosing",""));
    await assert.rejects(store.addPayment(b.id,order.id,0,{amountCents:"100",method:"cash",note:""}));
    await assert.rejects(store.addPart(b.id,order.id,0,{description:"Pantalla",supplier:"",quality:"",costCents:null,priceCents:null,warrantyUntil:null}));
    assert.equal(await store.getPhoto(b.id,order.id,"10000000-0000-4000-8000-000000000009"),null);
    const [customer]=await env.database.insert(customers).values({workshopId:a.id,fullName:"QA",phone:"12345678"}).returning();
    await assert.rejects(env.database.insert(devices).values({workshopId:b.id,customerId:customer.id,category:"phone",model:"QA"}));
    const [device]=await env.database.insert(devices).values({workshopId:a.id,customerId:customer.id,category:"phone",model:"QA"}).returning();
    await assert.rejects(env.database.insert(repairOrders).values({workshopId:b.id,deviceId:device.id,orderNumber:"wrong",publicToken:"f".repeat(64),reportedIssue:"QA"}));
    await env.database.update(workshopMembers).set({active:false}).where(eq(workshopMembers.userId,alice));
    await assert.rejects(resolveWorkshop(env.database,alice,a.id));
  } finally {await env.close()}
});
