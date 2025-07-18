/* eslint-disable unused-imports/no-unused-vars */
import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.json({ message: "Products API endpoint" });
}

export function POST(request: NextRequest) {
  return NextResponse.json({ message: "Product created" });
}
