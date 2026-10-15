import {
  nameIn,
  type BackupFieldNames,
  type BackupListNames,
  type KnownTextRender,
  type WaitUnitNames,
} from "./known-text-types";

/**
 * `known-text`의 포르투갈어(브라질). 규칙(정규식)은 `known-text`의 영어 표에
 * 한 벌만 있고, 여기는 **같은 순서의** 번역 함수만 둔다 — 순서·개수가 어긋나면 테스트가 잡는다.
 */

const BACKUP_LISTS: BackupListNames = {
  구독: "da assinatura",
  "체크인 기록": "do registro de uso",
  "연동 계정": "da conta vinculada",
};
const BACKUP_FIELDS: BackupFieldNames = {
  형식: "formato",
  ID: "ID",
  이름: "nome",
  금액: "valor",
  통화: "moeda",
  결제일: "dia de cobrança",
  "결제 주기": "frequência de cobrança",
  "결제 월": "mês de cobrança",
  카테고리: "categoria",
  상태: "status",
  등록일: "data de cadastro",
  해지일: "data de cancelamento",
  "숨긴 날": "data em que foi oculta",
  "요금 확인일": "data de conferência do preço",
  "함께 쓰는 사람 수": "número de pessoas que dividem",
  "내 몫": "minha parte",
  "결제 수단": "forma de pagamento",
  "해지 링크": "link de cancelamento",
  "해지 안내": "guia de cancelamento",
  아이콘: "ícone",
  "아이콘 색": "cor do ícone",
  요금제: "plano",
  "요금제 이름": "nome do plano",
  세금: "imposto",
  "연동 계정": "conta vinculada",
  "연동 계정 이름": "nome da conta vinculada",
  메모: "anotação",
  "무료 요금제로 충분했는지": "se o plano grátis bastava",
  "토큰 사용량": "tokens usados",
  "체크인 기기": "Dispositivo do check-in",
  "다시 살펴볼 날": "data de revisão",
  "해지 기록": "registro de cancelamento",
  "주문 메일 근거": "evidência de e-mails de pedido",
  "결제 메일 기록": "histórico de e-mails de pagamento",
  "구독 ID": "ID da assinatura",
  월: "mês",
  "사용 횟수": "número de usos",
  "1회당 비용": "custo por uso",
  위험도: "nível de risco",
  "체크인 시각": "hora do registro",
  "체크인 출처": "origem do registro",
  "체크인 지표": "indicador do registro",
  "로그인 제공자": "provedor de login",
  칭호: "título",
  "이메일/ID": "e-mail/ID",
  색: "cor",
};
const UNITS: WaitUnitNames = { 초: "segundos", 분: "minutos", 시간: "horas" };

export const KNOWN_TEXT_PT: KnownTextRender[] = [
  // 아이디
  () => "Digite um nome de usuário.",
  (min, max) => `O nome de usuário deve ter de ${min} a ${max} caracteres.`,
  () => "O nome de usuário só pode ter letras minúsculas, números e sublinhado (_).",
  () => "Digite seu nome de usuário ou e-mail.",
  () => "Esse nome de usuário já está em uso.",
  () => "O formato está certo. A disponibilidade é verificada no cadastro.",
  // Gmail 가져오기
  () =>
    "Não foi possível ler os e-mails importados. Toque de novo no botão da tela do Apps Script.",
  // 서비스 주소
  () => "Confira o endereço (ex.: service.com).",
  // 이메일
  () => "Digite seu endereço de e-mail.",
  () => "O endereço de e-mail é longo demais.",
  () => "O endereço de e-mail não é válido (ex.: you@example.com).",
  () =>
    "O endereço de e-mail não é válido. Confira o domínio depois do @ (ex.: gmail.com, naver.com).",
  (s) => `O endereço de e-mail parece errado. Você quis dizer ${s}?`,
  () =>
    "Não é possível se cadastrar com este e-mail. Use um endereço comum como naver.com, gmail.com ou daum.net.",
  () => "O e-mail é válido. Se já está em uso é verificado no cadastro.",
  () => "Esse e-mail já está em uso.",
  () => "Já existe uma conta com este e-mail aguardando confirmação.",
  // 비밀번호
  () => "Digite uma senha.",
  (more, min) => `Digite mais ${more} caractere(s) (pelo menos ${min}).`,
  (max) => `A senha pode ter no máximo ${max} caracteres.`,
  () => "A senha não pode ser um único caractere repetido.",
  () => "A senha é longa demais.",
  () => "Digite a senha de novo.",
  () => "As senhas não coincidem.",
  () => "As senhas não coincidem.",
  () => "As senhas coincidem.",
  () => "A senha é válida.",
  // 만 14세
  (age) => `Confirme que você tem pelo menos ${age} anos.`,
  // 서버 응답
  () => "Não foi possível entender a solicitação.",
  () => "Confira os dados informados.",
  () => "O nome de usuário ou a senha está incorreto.",
  () => "Não foi possível entrar.",
  () => "Alguns dados já estão em uso.",
  () => "Não foi possível concluir o cadastro.",
  (m) => `Solicitações demais. Tente de novo em ${m} minuto(s).`,
  () => "Solicitações demais. Tente de novo em instantes.",
  // 확인 메일
  (email) =>
    `Enviamos um e-mail de confirmação para ${email}. Se não estiver na caixa de entrada, confira o spam.`,
  (n, unit) =>
    `E-mails foram enviados a este endereço com frequência demais. Você poderá reenviar em ${n} ${nameIn(UNITS, unit)}.`,
  () =>
    "O envio de e-mails não está configurado neste servidor, então não foi possível enviar a confirmação.",
  () => "Não foi possível enviar o e-mail de confirmação. Tente de novo em instantes.",
  () => "Não foi possível enviar o e-mail de confirmação.",
  // 비밀번호 재설정 메일
  (email, m) =>
    `Enviamos um e-mail para redefinir a senha para ${email}. O link só pode ser usado uma vez por ${m} minutos. Se não estiver na caixa de entrada, confira o spam.`,
  (n, unit) =>
    `E-mails foram enviados a este endereço com frequência demais. Você poderá pedir de novo em ${n} ${nameIn(UNITS, unit)}.`,
  () =>
    "O envio de e-mails não está configurado neste servidor, então não foi possível enviar o e-mail de redefinição.",
  () => "Não foi possível enviar o e-mail de redefinição. Peça de novo em instantes.",
  () => "Não foi possível enviar o e-mail de redefinição.",
  () => "Não há conta cadastrada com este e-mail.",
  // 내 정보·비밀번호·탈퇴·로그인 방법
  () => "Você precisa entrar.",
  () => "Digite sua senha atual.",
  () => "A senha atual está incorreta.",
  () => "Escolha uma senha diferente da atual.",
  () => "A senha já foi alterada em outro lugar. Entre de novo com a senha nova.",
  () => "Não foi possível alterar a senha. Tente de novo em instantes.",
  () => "Não foi possível alterar a senha.",
  () => "A senha está incorreta.",
  () => "Não foi possível processar o link de redefinição.",
  () => "Não foi possível processar o link de confirmação.",
  () => "Esta conta já está confirmada e não pode ser excluída por este link.",
  () => "Não foi possível excluir a conta. Tente de novo em instantes.",
  () => "Digite 'DELETE' para confirmar.",
  () => "Não foi possível carregar os métodos de login.",
  () => "Não foi possível começar a vincular.",
  () => "Não foi possível desvincular.",
  () => "Já está vinculado.",
  () => "Não é possível vincular agora.",
  () =>
    "É seu único método de login, então não dá para desvincular. Crie uma senha ou vincule outra conta primeiro.",
  // Gmail 자동 가져오기
  () => "Este recurso ainda não começou.",
  () => "Não foi possível ler o status da conexão.",
  () => "Não foi possível criar um token de conexão.",
  () => "Não foi possível começar a conectar o Gmail.",
  () => "A conexão com um clique não está configurada. Instale o script você mesmo.",
  () => "Não foi possível ler as assinaturas encontradas.",
  () => "Não foi possível apagar as assinaturas encontradas.",
  // 구글 캘린더 등록
  () => "A sincronização com o Google Agenda não está configurada neste servidor.",
  () => "Não foi possível ler a lista de assinaturas enviada.",
  () => "Não há assinaturas para adicionar à agenda.",
  () => "Não foi possível começar a sincronizar a agenda.",
  // 여러 기기 사용 측정
  () => "Não foi possível abrir as configurações de acesso aos dados de uso.",
  () => "Não foi possível enviar os dados de uso.",
  () => "Não foi possível ler os dados de uso.",
  () => "Não foi possível ler os dados de uso enviados.",
  () => "Não foi possível salvar os dados de uso.",
  () => "Não foi possível apagar os dados de uso.",
  // 토큰·기록 지우기
  () => "O token está faltando.",
  () => "Não foi possível apagar o registro.",
  // 물어보기·도움말 AI
  () => "Este recurso ainda não está pronto.",
  () => "Não é possível responder agora.",
  () => "Não é possível responder agora. Pergunte de novo em instantes.",
  () => "Digite uma pergunta.",
  (max) => `A pergunta pode ter no máximo ${max} caracteres.`,
  () => "Há muitas perguntas agora. Pergunte de novo em instantes.",
  // 계정 저장
  () => "Não há dados salvos na conta.",
  () => "Não foi possível ler os dados salvos na conta.",
  () => "Os dados são grandes demais para a conta. Salve um arquivo de backup em vez disso.",
  () => "Não foi possível salvar na conta.",
  () => "Não foi possível apagar os dados salvos na conta.",
  () => "Outro dispositivo alterou os dados da conta antes.",
  () =>
    "O banco de dados não está configurado neste servidor, então os recursos de conta não estão disponíveis. Sua lista de assinaturas continua neste navegador.",
  // 백업 파일 복원
  () => "Não é um arquivo JSON. Escolha um arquivo de backup salvo pelo SubSlash.",
  () => "Não é um arquivo de backup do SubSlash.",
  () => "Não foi possível identificar a versão do formato do backup.",
  () => "Este backup tem um formato mais novo que o app. Recarregue a página e tente de novo.",
  () => "O arquivo de backup deve ter as listas de assinaturas, registros e contas vinculadas.",
  (list, index, field) =>
    `O campo “${nameIn(BACKUP_FIELDS, field)}” ${nameIn(BACKUP_LISTS, list)} nº ${index} não é válido.`,
  (index) => `A assinatura nº ${index} tem o mesmo ID de outra assinatura.`,
  () => "A configuração da taxa de câmbio não é válida.",
];
