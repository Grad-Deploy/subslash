import type { Widen } from "../types";

/** 간편 로그인 실패 이유(lib/oauth-messages). 서버가 `?oauthError=` 코드로 넘기고 화면이 이 문구로 바꾼다. */
export const ko = {
  errors: {
    unavailable: "지금은 이 방법으로 로그인할 수 없어요.",
    cancelled: "로그인을 취소했어요.",
    state: "로그인 시간이 지났거나 다른 창에서 시작한 로그인이에요. 다시 눌러 주세요.",
    provider: "로그인 서비스에서 정보를 받아 오지 못했어요. 잠시 후 다시 시도해 주세요.",
    "no-email": "이메일 제공에 동의해야 가입할 수 있어요. 다시 누르고 이메일에 동의해 주세요.",
    "email-taken":
      "이 이메일로 이미 가입한 계정이 있어요. 처음 가입한 방법(이메일과 비밀번호, 또는 구글·카카오·네이버)으로 로그인한 뒤 '내 정보'의 로그인 방법에서 이 계정을 연결하면 다음부터 이것으로도 로그인할 수 있어요.",
    "need-age": "처음 가입하시네요. 아래에서 만 14세 이상인지 확인한 뒤 다시 눌러 주세요.",
    "identity-taken":
      "이 계정은 이미 다른 SubSlash 계정에 연결돼 있어요. 그 계정으로 로그인해 연결을 끊은 뒤 다시 시도해 주세요.",
    "provider-linked":
      "이미 같은 회사의 다른 계정이 연결돼 있어요. 연결을 끊은 뒤 다시 연결해 주세요.",
    server: "로그인을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
  providers: { google: "구글", kakao: "카카오", naver: "네이버" },
  /** 목적격 조사까지 붙인 이름. 구글만 받침이 있다. */
  providerObject: { google: "구글을", kakao: "카카오를", naver: "네이버를" },
  password: "이메일(또는 아이디)과 비밀번호",
  /** 로그인 방법 여럿을 잇는 말. */
  or: " 또는 ",
  /**
   * `email-taken`의 문구. 서버가 그 계정의 로그인 방법과 지금 누른 제공자를 넘기면 "구글로 로그인한 뒤
   * 카카오를 연결하세요"처럼 그 계정에 맞는 말을 한다.
   */
  emailTaken: (ways: string, providerObject: string, provider: string) =>
    `이 이메일은 이미 ${ways}로 가입돼 있어요. 그 방법으로 로그인한 뒤 '내 정보'의 로그인 방법에서 ${providerObject} 연결하면 다음부터 ${provider}로도 로그인할 수 있어요.`,
};

export const en: Widen<typeof ko> = {
  errors: {
    unavailable: "This login method isn't available right now.",
    cancelled: "Login was cancelled.",
    state: "The login expired or was started in another window. Please press it again.",
    provider: "Couldn't get your details from the login service. Please try again shortly.",
    "no-email":
      "You need to agree to share your email to sign up. Press it again and allow your email.",
    "email-taken":
      "An account already uses this email. Log in the way you first signed up (email and password, or Google, Kakao or NAVER), then link this account under ‘Login methods’ in ‘My account’ to use it next time.",
    "need-age":
      "Looks like you're new. Confirm below that you're 14 or older, then press it again.",
    "identity-taken":
      "This account is already linked to another SubSlash account. Log in to that account and unlink it, then try again.",
    "provider-linked":
      "Another account from the same provider is already linked. Unlink it, then link again.",
    server: "Couldn't log you in. Please try again shortly.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "email (or username) and password",
  or: " or ",
  emailTaken: (ways, providerObject, provider) =>
    `This email is already registered with ${ways}. Log in that way, then link ${providerObject} under ‘Login methods’ in ‘My account’ to log in with ${provider} next time.`,
};

export const zh: Widen<typeof ko> = {
  errors: {
    unavailable: "现在无法用这种方式登录。",
    cancelled: "已取消登录。",
    state: "登录已超时，或是在其他窗口中开始的登录。请再点一次。",
    provider: "未能从登录服务获取信息。请稍后再试。",
    "no-email": "需要同意提供邮箱才能注册。请再点一次并同意提供邮箱。",
    "email-taken":
      "已有账户使用此邮箱。请用最初注册的方式（邮箱和密码，或 Google、Kakao、NAVER）登录，然后在“我的信息”的“登录方式”中关联此账户，下次就能用它登录。",
    "need-age": "看起来你是第一次注册。请在下方确认你已年满 14 周岁，然后再点一次。",
    "identity-taken": "此账户已关联到另一个 SubSlash 账户。请登录那个账户解除关联后再试。",
    "provider-linked": "已经关联了同一家公司的另一个账户。请先解除关联，再重新关联。",
    server: "无法完成登录。请稍后再试。",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "邮箱（或用户名）和密码",
  or: " 或 ",
  emailTaken: (ways, providerObject, provider) =>
    `此邮箱已通过${ways}注册。请用该方式登录，然后在“我的信息”的“登录方式”中关联 ${providerObject}，下次就能用 ${provider} 登录。`,
};

export const ja: Widen<typeof ko> = {
  errors: {
    unavailable: "今はこの方法でログインできません。",
    cancelled: "ログインをキャンセルしました。",
    state:
      "ログインの有効期限が切れたか、別のウィンドウで始めたログインです。もう一度押してください。",
    provider:
      "ログインサービスから情報を取得できませんでした。しばらくしてからもう一度お試しください。",
    "no-email":
      "登録するにはメールアドレスの提供に同意する必要があります。もう一度押してメールアドレスに同意してください。",
    "email-taken":
      "このメールアドレスで登録済みのアカウントがあります。最初に登録した方法（メールアドレスとパスワード、または Google・Kakao・NAVER）でログインし、「マイ情報」の「ログイン方法」でこのアカウントをつなぐと、次からこれでもログインできます。",
    "need-age":
      "初めての登録のようです。下で満 14 歳以上であることを確認してから、もう一度押してください。",
    "identity-taken":
      "このアカウントはすでに別の SubSlash アカウントにつながっています。そのアカウントでログインして連携を解除してから、もう一度お試しください。",
    "provider-linked":
      "同じ会社の別のアカウントがすでにつながっています。連携を解除してから、もう一度つないでください。",
    server: "ログインを処理できませんでした。しばらくしてからもう一度お試しください。",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "メールアドレス（またはユーザー名）とパスワード",
  or: " または ",
  emailTaken: (ways, providerObject, provider) =>
    `このメールアドレスはすでに${ways}で登録されています。その方法でログインし、「マイ情報」の「ログイン方法」で ${providerObject} をつなぐと、次から ${provider} でもログインできます。`,
};

export const vi: Widen<typeof ko> = {
  errors: {
    unavailable: "Hiện không thể đăng nhập bằng cách này.",
    cancelled: "Đã hủy đăng nhập.",
    state: "Phiên đăng nhập đã hết hạn hoặc được bắt đầu ở cửa sổ khác. Hãy nhấn lại.",
    provider: "Không lấy được thông tin từ dịch vụ đăng nhập. Hãy thử lại sau ít phút.",
    "no-email": "Bạn cần đồng ý chia sẻ email để đăng ký. Hãy nhấn lại và cho phép email.",
    "email-taken":
      "Đã có tài khoản dùng email này. Hãy đăng nhập bằng cách bạn đăng ký đầu tiên (email và mật khẩu, hoặc Google, Kakao, NAVER), rồi liên kết tài khoản này trong “Cách đăng nhập” ở “Thông tin của tôi” để lần sau đăng nhập bằng nó.",
    "need-age":
      "Có vẻ bạn là người mới. Hãy xác nhận bên dưới rằng bạn từ 14 tuổi trở lên, rồi nhấn lại.",
    "identity-taken":
      "Tài khoản này đã được liên kết với một tài khoản SubSlash khác. Hãy đăng nhập tài khoản đó, hủy liên kết rồi thử lại.",
    "provider-linked":
      "Một tài khoản khác của cùng nhà cung cấp đã được liên kết. Hãy hủy liên kết rồi liên kết lại.",
    server: "Không thể đăng nhập. Hãy thử lại sau ít phút.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "email (hoặc tên người dùng) và mật khẩu",
  or: " hoặc ",
  emailTaken: (ways, providerObject, provider) =>
    `Email này đã được đăng ký bằng ${ways}. Hãy đăng nhập bằng cách đó, rồi liên kết ${providerObject} trong “Cách đăng nhập” ở “Thông tin của tôi” để lần sau đăng nhập bằng ${provider}.`,
};

export const fr: Widen<typeof ko> = {
  errors: {
    unavailable: "Ce mode de connexion n'est pas disponible pour le moment.",
    cancelled: "La connexion a été annulée.",
    state: "La connexion a expiré ou a été lancée dans une autre fenêtre. Appuyez à nouveau.",
    provider:
      "Impossible d'obtenir vos informations auprès du service de connexion. Réessayez dans un instant.",
    "no-email":
      "Vous devez accepter de partager votre e-mail pour vous inscrire. Appuyez à nouveau et autorisez l'e-mail.",
    "email-taken":
      "Un compte utilise déjà cet e-mail. Connectez-vous comme lors de votre inscription (e-mail et mot de passe, ou Google, Kakao, NAVER), puis associez ce compte dans « Modes de connexion » de « Mon compte » pour l'utiliser la prochaine fois.",
    "need-age":
      "Vous semblez nouveau. Confirmez ci-dessous que vous avez 14 ans ou plus, puis appuyez à nouveau.",
    "identity-taken":
      "Ce compte est déjà associé à un autre compte SubSlash. Connectez-vous à ce compte, dissociez-le, puis réessayez.",
    "provider-linked":
      "Un autre compte du même fournisseur est déjà associé. Dissociez-le, puis associez à nouveau.",
    server: "Impossible de vous connecter. Réessayez dans un instant.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "e-mail (ou identifiant) et mot de passe",
  or: " ou ",
  emailTaken: (ways, providerObject, provider) =>
    `Cet e-mail est déjà inscrit avec ${ways}. Connectez-vous de cette façon, puis associez ${providerObject} dans « Modes de connexion » de « Mon compte » pour vous connecter avec ${provider} la prochaine fois.`,
};

export const es: Widen<typeof ko> = {
  errors: {
    unavailable: "Este método de inicio de sesión no está disponible ahora.",
    cancelled: "Se canceló el inicio de sesión.",
    state: "El inicio de sesión caducó o se empezó en otra ventana. Vuelve a pulsarlo.",
    provider:
      "No se pudieron obtener tus datos del servicio de inicio de sesión. Inténtalo en un momento.",
    "no-email":
      "Para registrarte debes aceptar compartir tu correo. Vuelve a pulsarlo y permite el correo.",
    "email-taken":
      "Ya hay una cuenta con este correo. Inicia sesión como te registraste la primera vez (correo y contraseña, o Google, Kakao o NAVER) y vincula esta cuenta en «Métodos de inicio de sesión» de «Mi cuenta» para usarla la próxima vez.",
    "need-age":
      "Parece que eres nuevo. Confirma abajo que tienes 14 años o más y vuelve a pulsarlo.",
    "identity-taken":
      "Esta cuenta ya está vinculada a otra cuenta de SubSlash. Inicia sesión en esa cuenta, desvincúlala e inténtalo de nuevo.",
    "provider-linked":
      "Ya hay otra cuenta del mismo proveedor vinculada. Desvincúlala y vuelve a vincular.",
    server: "No se pudo iniciar sesión. Inténtalo en un momento.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "correo (o usuario) y contraseña",
  or: " o ",
  emailTaken: (ways, providerObject, provider) =>
    `Este correo ya está registrado con ${ways}. Inicia sesión de esa forma y vincula ${providerObject} en «Métodos de inicio de sesión» de «Mi cuenta» para entrar con ${provider} la próxima vez.`,
};

export const de: Widen<typeof ko> = {
  errors: {
    unavailable: "Diese Anmeldemethode ist gerade nicht verfügbar.",
    cancelled: "Die Anmeldung wurde abgebrochen.",
    state:
      "Die Anmeldung ist abgelaufen oder wurde in einem anderen Fenster gestartet. Bitte tippe erneut.",
    provider:
      "Deine Daten konnten nicht vom Anmeldedienst abgerufen werden. Bitte versuch es gleich noch einmal.",
    "no-email":
      "Zum Registrieren musst du der Weitergabe deiner E-Mail zustimmen. Tippe erneut und erlaube die E-Mail.",
    "email-taken":
      "Ein Konto nutzt diese E-Mail bereits. Melde dich so an, wie du dich zuerst registriert hast (E-Mail und Passwort oder Google, Kakao, NAVER), und verknüpfe dieses Konto unter „Anmeldemethoden“ in „Mein Konto“, um es künftig zu nutzen.",
    "need-age":
      "Du bist wohl neu hier. Bestätige unten, dass du mindestens 14 Jahre alt bist, und tippe dann erneut.",
    "identity-taken":
      "Dieses Konto ist bereits mit einem anderen SubSlash-Konto verknüpft. Melde dich dort an, heb die Verknüpfung auf und versuch es erneut.",
    "provider-linked":
      "Ein anderes Konto desselben Anbieters ist bereits verknüpft. Heb die Verknüpfung auf und verknüpfe erneut.",
    server: "Anmeldung fehlgeschlagen. Bitte versuch es gleich noch einmal.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "E-Mail (oder Benutzername) und Passwort",
  or: " oder ",
  emailTaken: (ways, providerObject, provider) =>
    `Diese E-Mail ist bereits mit ${ways} registriert. Melde dich so an und verknüpfe ${providerObject} unter „Anmeldemethoden“ in „Mein Konto“, um dich künftig mit ${provider} anzumelden.`,
};

export const pt: Widen<typeof ko> = {
  errors: {
    unavailable: "Este método de login não está disponível agora.",
    cancelled: "O login foi cancelado.",
    state: "O login expirou ou foi iniciado em outra janela. Toque novamente.",
    provider: "Não foi possível obter seus dados do serviço de login. Tente de novo em instantes.",
    "no-email":
      "Para se cadastrar, você precisa concordar em compartilhar seu e-mail. Toque novamente e permita o e-mail.",
    "email-taken":
      "Já existe uma conta com este e-mail. Entre do jeito que você se cadastrou primeiro (e-mail e senha, ou Google, Kakao, NAVER) e vincule esta conta em “Formas de login” em “Minha conta” para usá-la da próxima vez.",
    "need-age":
      "Parece que você é novo. Confirme abaixo que tem 14 anos ou mais e toque novamente.",
    "identity-taken":
      "Esta conta já está vinculada a outra conta SubSlash. Entre nessa conta, desvincule e tente de novo.",
    "provider-linked":
      "Outra conta do mesmo provedor já está vinculada. Desvincule e vincule novamente.",
    server: "Não foi possível entrar. Tente de novo em instantes.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "e-mail (ou usuário) e senha",
  or: " ou ",
  emailTaken: (ways, providerObject, provider) =>
    `Este e-mail já está cadastrado com ${ways}. Entre dessa forma e vincule ${providerObject} em “Formas de login” em “Minha conta” para entrar com ${provider} da próxima vez.`,
};
