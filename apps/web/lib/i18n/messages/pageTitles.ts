import type { Widen } from "../types";

/**
 * 브라우저 탭 제목. 페이지의 `metadata.title`은 서버에서 한국어로 정해지므로, 화면 언어가 다르면
 * `LocaleEffects`가 이 표로 바꾼다. 페이지의 metadata도 이 표의 한국어를 쓴다 — 두 곳에 적으면 어긋난다.
 * 주소가 표에 없으면 사이트 제목(`site`)이다.
 */
export const ko = {
  site: "SubSlash - 구독, 끊을 용기",
  paths: {
    "/forgot-password": "비밀번호 재설정 · SubSlash",
    "/import": "Gmail에서 구독 찾기 · SubSlash",
    "/login": "로그인 · SubSlash",
    "/me": "내 정보 · SubSlash",
    "/offline": "오프라인 - SubSlash",
    "/oauth/done": "로그인 · SubSlash",
    "/privacy": "개인정보처리방침 · SubSlash",
    "/reset-password": "새 비밀번호 정하기 · SubSlash",
    "/signup": "회원가입 · SubSlash",
    "/storage-quota/done": "용량 측정 · SubSlash",
    "/verify-email": "이메일 확인 · SubSlash",
  },
};

export const en: Widen<typeof ko> = {
  site: "SubSlash - The nerve to cut subscriptions",
  paths: {
    "/forgot-password": "Reset password · SubSlash",
    "/import": "Find subscriptions in Gmail · SubSlash",
    "/login": "Log in · SubSlash",
    "/me": "My account · SubSlash",
    "/offline": "Offline - SubSlash",
    "/oauth/done": "Log in · SubSlash",
    "/privacy": "Privacy Policy · SubSlash",
    "/reset-password": "Set a new password · SubSlash",
    "/signup": "Sign up · SubSlash",
    "/storage-quota/done": "Storage check · SubSlash",
    "/verify-email": "Verify email · SubSlash",
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
export const zh: Widen<typeof ko> = {
  site: "SubSlash - 敢于砍掉订阅",
  paths: {
    "/forgot-password": "重置密码 · SubSlash",
    "/import": "在 Gmail 中查找订阅 · SubSlash",
    "/login": "登录 · SubSlash",
    "/me": "我的信息 · SubSlash",
    "/offline": "离线 - SubSlash",
    "/oauth/done": "登录 · SubSlash",
    "/privacy": "隐私政策 · SubSlash",
    "/reset-password": "设置新密码 · SubSlash",
    "/signup": "注册 · SubSlash",
    "/storage-quota/done": "存储空间测量 · SubSlash",
    "/verify-email": "确认邮箱 · SubSlash",
  },
};

export const ja: Widen<typeof ko> = {
  site: "SubSlash - サブスクを断ち切る勇気",
  paths: {
    "/forgot-password": "パスワードの再設定 · SubSlash",
    "/import": "Gmail でサブスクを探す · SubSlash",
    "/login": "ログイン · SubSlash",
    "/me": "マイ情報 · SubSlash",
    "/offline": "オフライン - SubSlash",
    "/oauth/done": "ログイン · SubSlash",
    "/privacy": "プライバシーポリシー · SubSlash",
    "/reset-password": "新しいパスワードの設定 · SubSlash",
    "/signup": "会員登録 · SubSlash",
    "/storage-quota/done": "容量の測定 · SubSlash",
    "/verify-email": "メールアドレスの確認 · SubSlash",
  },
};

export const vi: Widen<typeof ko> = {
  site: "SubSlash - Dũng khí cắt bớt gói đăng ký",
  paths: {
    "/forgot-password": "Đặt lại mật khẩu · SubSlash",
    "/import": "Tìm gói đăng ký trong Gmail · SubSlash",
    "/login": "Đăng nhập · SubSlash",
    "/me": "Thông tin của tôi · SubSlash",
    "/offline": "Ngoại tuyến - SubSlash",
    "/oauth/done": "Đăng nhập · SubSlash",
    "/privacy": "Chính sách quyền riêng tư · SubSlash",
    "/reset-password": "Đặt mật khẩu mới · SubSlash",
    "/signup": "Đăng ký · SubSlash",
    "/storage-quota/done": "Đo dung lượng · SubSlash",
    "/verify-email": "Xác nhận email · SubSlash",
  },
};

export const fr: Widen<typeof ko> = {
  site: "SubSlash - Le courage de couper ses abonnements",
  paths: {
    "/forgot-password": "Réinitialiser le mot de passe · SubSlash",
    "/import": "Trouver des abonnements dans Gmail · SubSlash",
    "/login": "Connexion · SubSlash",
    "/me": "Mon compte · SubSlash",
    "/offline": "Hors ligne - SubSlash",
    "/oauth/done": "Connexion · SubSlash",
    "/privacy": "Politique de confidentialité · SubSlash",
    "/reset-password": "Nouveau mot de passe · SubSlash",
    "/signup": "Inscription · SubSlash",
    "/storage-quota/done": "Mesure du stockage · SubSlash",
    "/verify-email": "Confirmer l'e-mail · SubSlash",
  },
};

export const es: Widen<typeof ko> = {
  site: "SubSlash - El valor de recortar suscripciones",
  paths: {
    "/forgot-password": "Restablecer contraseña · SubSlash",
    "/import": "Buscar suscripciones en Gmail · SubSlash",
    "/login": "Iniciar sesión · SubSlash",
    "/me": "Mi cuenta · SubSlash",
    "/offline": "Sin conexión - SubSlash",
    "/oauth/done": "Iniciar sesión · SubSlash",
    "/privacy": "Política de privacidad · SubSlash",
    "/reset-password": "Nueva contraseña · SubSlash",
    "/signup": "Registrarse · SubSlash",
    "/storage-quota/done": "Medir almacenamiento · SubSlash",
    "/verify-email": "Confirmar correo · SubSlash",
  },
};

export const de: Widen<typeof ko> = {
  site: "SubSlash - Der Mut, Abos zu kündigen",
  paths: {
    "/forgot-password": "Passwort zurücksetzen · SubSlash",
    "/import": "Abos in Gmail finden · SubSlash",
    "/login": "Anmelden · SubSlash",
    "/me": "Mein Konto · SubSlash",
    "/offline": "Offline - SubSlash",
    "/oauth/done": "Anmelden · SubSlash",
    "/privacy": "Datenschutzerklärung · SubSlash",
    "/reset-password": "Neues Passwort festlegen · SubSlash",
    "/signup": "Registrieren · SubSlash",
    "/storage-quota/done": "Speicher messen · SubSlash",
    "/verify-email": "E-Mail bestätigen · SubSlash",
  },
};

export const pt: Widen<typeof ko> = {
  site: "SubSlash - A coragem de cortar assinaturas",
  paths: {
    "/forgot-password": "Redefinir senha · SubSlash",
    "/import": "Encontrar assinaturas no Gmail · SubSlash",
    "/login": "Entrar · SubSlash",
    "/me": "Minha conta · SubSlash",
    "/offline": "Offline - SubSlash",
    "/oauth/done": "Entrar · SubSlash",
    "/privacy": "Política de privacidade · SubSlash",
    "/reset-password": "Definir nova senha · SubSlash",
    "/signup": "Cadastrar · SubSlash",
    "/storage-quota/done": "Medir armazenamento · SubSlash",
    "/verify-email": "Confirmar e-mail · SubSlash",
  },
};
