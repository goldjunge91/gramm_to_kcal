import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schemas";

export async function GET() {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's products
    const userProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.userId, session.user.id),
          eq(products.isDeleted, false)
        )
      )
      .orderBy(desc(products.createdAt));

    return NextResponse.json(userProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productData = await request.json();
    console.log("Creating product with user ID:", session.user.id);
    console.log("Product data:", productData);

    // Insert new product
    const inserted = await db
      .insert(products)
      .values({
        ...productData,
        userId: session.user.id,
        id: crypto.randomUUID(),
        version: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (inserted.length === 0) {
      console.error("Failed to insert product, no data returned.");
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    const newProduct = inserted[0];

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product - full error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}