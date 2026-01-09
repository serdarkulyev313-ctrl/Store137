import { NextResponse } from "next/server";
import { getProducts } from "@/lib/store";

export async function GET() {
  const products = getProducts().filter((item) => item.active);
  return NextResponse.json(products);
}
