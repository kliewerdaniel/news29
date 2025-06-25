import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_NEWS_API}/broadcast/${params.id}`
  );
  const data = await res.json();
  return NextResponse.json(data);
}
