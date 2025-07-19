import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ message: "Products API endpoint" });
}

export function POST() {
  return NextResponse.json({ message: "Product created" });
}
