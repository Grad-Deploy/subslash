import type { Widen } from "../types";

/** 계정 페이지들의 제목·한 줄 설명(`AccountPageHeading`). 페이지는 서버 컴포넌트라 제목만 이 칸으로 그린다. */
export const ko = {
  accountPages: {
    me: { title: "내 정보", body: "계정과 기록을 관리해요." },
    forgot: {
      title: "비밀번호 재설정",
      body: "가입한 이메일로 새 비밀번호를 정할 수 있는 링크를 보내드립니다.",
    },
    reset: {
      title: "새 비밀번호 정하기",
      body: "메일로 받은 링크의 계정에 쓸 새 비밀번호를 정하세요.",
    },
    verify: {
      title: "가입 이메일 확인",
      body: "이 주소로 가입한 계정이 본인 것인지 알려주세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  accountPages: {
    me: { title: "My account", body: "Manage your account and records." },
    forgot: {
      title: "Reset password",
      body: "We'll send a link to the email you signed up with so you can set a new password.",
    },
    reset: {
      title: "Set a new password",
      body: "Set a new password for the account the emailed link belongs to.",
    },
    verify: {
      title: "Confirm sign-up email",
      body: "Let us know whether the account signed up with this address is yours.",
    },
  },
};

export const zh: Widen<typeof ko> = {
  accountPages: {
    me: { title: "我的信息", body: "管理你的账户和记录。" },
    forgot: { title: "重置密码", body: "我们会向你注册的邮箱发送一个可以设置新密码的链接。" },
    reset: { title: "设置新密码", body: "为邮件链接对应的账户设置新密码。" },
    verify: { title: "确认注册邮箱", body: "请告诉我们用此地址注册的账户是否属于你。" },
  },
};

export const ja: Widen<typeof ko> = {
  accountPages: {
    me: { title: "マイ情報", body: "アカウントと記録を管理します。" },
    forgot: {
      title: "パスワードの再設定",
      body: "登録したメールアドレスに、新しいパスワードを設定できるリンクを送ります。",
    },
    reset: {
      title: "新しいパスワードの設定",
      body: "メールで届いたリンクのアカウントに使う新しいパスワードを決めてください。",
    },
    verify: {
      title: "登録メールアドレスの確認",
      body: "このアドレスで登録されたアカウントがご本人のものか教えてください。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  accountPages: {
    me: { title: "Thông tin của tôi", body: "Quản lý tài khoản và dữ liệu của bạn." },
    forgot: {
      title: "Đặt lại mật khẩu",
      body: "Chúng tôi sẽ gửi đường dẫn đặt mật khẩu mới đến email bạn đã đăng ký.",
    },
    reset: {
      title: "Đặt mật khẩu mới",
      body: "Đặt mật khẩu mới cho tài khoản của đường dẫn trong email.",
    },
    verify: {
      title: "Xác nhận email đăng ký",
      body: "Hãy cho chúng tôi biết tài khoản đăng ký bằng địa chỉ này có phải của bạn không.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  accountPages: {
    me: { title: "Mon compte", body: "Gérez votre compte et vos données." },
    forgot: {
      title: "Réinitialiser le mot de passe",
      body: "Nous enverrons à l'adresse d'inscription un lien pour définir un nouveau mot de passe.",
    },
    reset: {
      title: "Nouveau mot de passe",
      body: "Choisissez un nouveau mot de passe pour le compte du lien reçu par e-mail.",
    },
    verify: {
      title: "Confirmer l'e-mail d'inscription",
      body: "Dites-nous si le compte créé avec cette adresse est bien le vôtre.",
    },
  },
};

export const es: Widen<typeof ko> = {
  accountPages: {
    me: { title: "Mi cuenta", body: "Gestiona tu cuenta y tus registros." },
    forgot: {
      title: "Restablecer contraseña",
      body: "Enviaremos al correo con el que te registraste un enlace para crear una nueva contraseña.",
    },
    reset: {
      title: "Nueva contraseña",
      body: "Elige una nueva contraseña para la cuenta del enlace que recibiste por correo.",
    },
    verify: {
      title: "Confirmar correo de registro",
      body: "Dinos si la cuenta registrada con esta dirección es tuya.",
    },
  },
};

export const de: Widen<typeof ko> = {
  accountPages: {
    me: { title: "Mein Konto", body: "Verwalte dein Konto und deine Daten." },
    forgot: {
      title: "Passwort zurücksetzen",
      body: "Wir senden dir an die registrierte E-Mail einen Link, mit dem du ein neues Passwort festlegen kannst.",
    },
    reset: {
      title: "Neues Passwort festlegen",
      body: "Leg ein neues Passwort für das Konto aus dem E-Mail-Link fest.",
    },
    verify: {
      title: "Registrierungs-E-Mail bestätigen",
      body: "Sag uns, ob das mit dieser Adresse registrierte Konto dir gehört.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  accountPages: {
    me: { title: "Minha conta", body: "Gerencie sua conta e seus registros." },
    forgot: {
      title: "Redefinir senha",
      body: "Vamos enviar ao e-mail cadastrado um link para você definir uma nova senha.",
    },
    reset: {
      title: "Definir nova senha",
      body: "Defina uma nova senha para a conta do link recebido por e-mail.",
    },
    verify: {
      title: "Confirmar e-mail de cadastro",
      body: "Diga se a conta cadastrada com este endereço é sua.",
    },
  },
};
