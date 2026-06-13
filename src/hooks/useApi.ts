"use client";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { params, ...init } = options;
    let url = path;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      if (qs) url += "?" + qs;
    }
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init.headers },
      ...init,
    });
    const json = await res.json();
    if (!json.success) return { data: null, error: json.message || "เกิดข้อผิดพลาด" };
    return { data: json.data, error: null };
  } catch (e: any) {
    console.error("[apiFetch]", e?.message || e);
    return { data: null, error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}
