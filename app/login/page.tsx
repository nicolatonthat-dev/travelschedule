import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const password = formData.get("password") as string;
    if (password === process.env.SITE_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        path: "/",
      });
      redirect("/");
    }
    redirect("/login?error=1");
  }

  return (
    <main
      style={{
        background: "var(--bg-primary)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #5e6ad2, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            N
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
            Nicolas&apos;s Travel
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              Enter password
            </div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              This page is private.
            </div>
          </div>

          <form action={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoFocus
              required
              style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
                width: "100%",
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: "#f87171" }}>
                Incorrect password. Try again.
              </div>
            )}
            <button
              type="submit"
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
