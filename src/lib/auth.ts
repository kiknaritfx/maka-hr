import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const ALG = "HS256";

export interface JWTPayload {
  sub: string;       // userId
  email: string;
  role: string;
  name: string;
  companies: string; // "all" | "1,2,3"
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const token = cookies().get("maka_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(...roles: string[]) {
  return async function guard(): Promise<JWTPayload> {
    const session = await getSession();
    if (!session) throw new Error("UNAUTHORIZED");
    if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
    return session;
  };
}

// Parse company access from JWT payload
export function parseCompanyAccess(companies: string): number[] | "all" {
  if (companies === "all") return "all";
  return companies.split(",").map(Number).filter(Boolean);
}
