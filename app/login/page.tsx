import { redirect } from "next/navigation";

import { isAuthConfigured, isAuthenticated } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  cancelled: "你取消了 GitHub 授權。",
  invalid: "GitHub 登入流程已失效，請重新登入。",
  forbidden: "這個 GitHub 帳號沒有 FragmentHub 存取權。",
  unavailable: "GitHub 登入暫時無法完成，請稍後重試。",
  unconfigured: "FragmentHub 的 GitHub OAuth 尚未設定完成。",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect("/");
  }

  const params = await searchParams;
  const configured = isAuthConfigured();
  const message = params.error ? errorMessages[params.error] : null;

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
            使用 GitHub 確認身分。Web 只負責瀏覽與管理 Fragment，
            不執行任何 AI 分析。
          </p>
        </div>

        {!configured ? (
          <div className="notice danger">
            <strong>GitHub OAuth 尚未設定完成</strong>
            <p>
              請設定 GitHub OAuth Client ID、Client Secret、Public URL、
              Session Secret 與 allowed GitHub user IDs。
            </p>
          </div>
        ) : (
          <>
            {message ? (
              <div className="notice danger">
                <strong>登入未完成</strong>
                <p>{message}</p>
              </div>
            ) : null}

            <a className="primaryButton githubLoginButton" href="/api/auth/login">
              <span className="githubMark" aria-hidden="true">
                GH
              </span>
              使用 GitHub 登入
            </a>

            <p className="loginFootnote">
              GitHub OAuth 只用於確認 FragmentHub 存取身分。
            </p>
          </>
        )}
      </section>
    </main>
  );
}
