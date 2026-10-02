import { redirect } from "next/navigation";

import { isAuthConfigured, isAuthenticated } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect("/");
  }

  const params = await searchParams;
  const configured = isAuthConfigured();

  return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="brand loginBrand">
          <span className="brandMark">F</span>
          <span>
            <strong>FragmentHub</strong>
            <small>Private fragment workspace</small>
          </span>
        </div>

        <div>
          <p className="eyebrow">Private access</p>
          <h1 className="loginTitle">登入 FragmentHub</h1>
          <p className="subtle">
            Web 只負責瀏覽與管理 GitHub 中的 Fragment，不執行任何 AI 分析。
          </p>
        </div>

        {!configured ? (
          <div className="notice danger">
            <strong>尚未設定登入資訊</strong>
            <p>
              請在環境變數設定 FRAGMENTHUB_PASSWORD 與
              FRAGMENTHUB_SESSION_SECRET。
            </p>
          </div>
        ) : (
          <form className="loginForm" action="/api/auth/login" method="post">
            <label>
              <span>密碼</span>
              <input
                autoComplete="current-password"
                name="password"
                type="password"
                required
                autoFocus
              />
            </label>

            {params.error ? (
              <p className="formError">密碼不正確，請重新輸入。</p>
            ) : null}

            <button className="primaryButton" type="submit">
              登入
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
