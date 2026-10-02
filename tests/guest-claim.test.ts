import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { GuestUsage } from "@/lib/database/models/guest-usage";
import { GUEST_CONVERSION_LIMIT, GUEST_WINDOW_MS, claimGuestSlot } from "@/lib/usage/guest-usage";

let mongod: MongoMemoryServer;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: "guest-claim-test" });
  await GuestUsage.init();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("claimGuestSlot", () => {
  it("grants exactly the limit under 10 parallel claims from a fresh guest", async () => {
    const id = "fresh-guest";
    const results = await Promise.all(Array.from({ length: 10 }, () => claimGuestSlot(id)));
    const granted = results.filter((r) => r !== null);
    assert.equal(granted.length, GUEST_CONVERSION_LIMIT);
    assert.deepEqual([...granted].sort(), [1, 2, 3]);
    assert.equal(await GuestUsage.countDocuments({ _id: id }), 1);
    assert.equal((await GuestUsage.findById(id))?.conversionsUsed, GUEST_CONVERSION_LIMIT);
  });

  it("rejects a guest already at the limit and leaves the count unchanged", async () => {
    const id = "at-limit-guest";
    await GuestUsage.create({ _id: id, conversionsUsed: GUEST_CONVERSION_LIMIT, windowStartAt: new Date() });
    assert.equal(await claimGuestSlot(id), null);
    const doc = await GuestUsage.findById(id);
    assert.equal(doc?.conversionsUsed, GUEST_CONVERSION_LIMIT);
    assert.equal(await GuestUsage.countDocuments({ _id: id }), 1);
  });

  it("resets an expired window once, then enforces the limit under parallel claims", async () => {
    const id = "expired-guest";
    await GuestUsage.create({
      _id: id,
      conversionsUsed: GUEST_CONVERSION_LIMIT,
      windowStartAt: new Date(Date.now() - GUEST_WINDOW_MS - 1000),
    });
    const results = await Promise.all(Array.from({ length: 10 }, () => claimGuestSlot(id)));
    const granted = results.filter((r) => r !== null);
    assert.equal(granted.length, GUEST_CONVERSION_LIMIT);
    assert.deepEqual([...granted].sort(), [1, 2, 3]);
    assert.equal((await GuestUsage.findById(id))?.conversionsUsed, GUEST_CONVERSION_LIMIT);
  });
});
