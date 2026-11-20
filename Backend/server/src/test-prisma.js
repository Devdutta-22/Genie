import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";

import contractJson from "../../../prisma/contract.json" with { type: "json" };

const contract = contractFromJson(contractJson);

const db = postgres({
    contract,
    url: process.env.DATABASE_URL,
});

try {
    const result = await db.orm.core.User.all();

    console.log("✅ Prisma connected successfully!");
    console.log("Users found:", result.length);
} catch (error) {
    console.error("❌ Prisma connection/query failed:");
    console.error(error);
} finally {
    await db.close();
}