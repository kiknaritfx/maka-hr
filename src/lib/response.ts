import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function unauthorized() { return err("Unauthorized", 401); }
export function forbidden()    { return err("Forbidden",    403); }
export function notFound(r="Not found") { return err(r, 404); }
