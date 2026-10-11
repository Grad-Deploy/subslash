/**
 * `known-text`의 프랑스어. 규칙(정규식)은 `known-text`의 영어 표에
 * 한 벌만 있고, 여기는 **같은 순서의** 번역 함수만 둔다 — 순서·개수가 어긋나면 테스트가 잡는다.
 */
type Render = (...groups: string[]) => string;

const BACKUP_LISTS: Record<string, string> = {
  구독: "l'abonnement",
  "체크인 기록": "le check-in",
  "연동 계정": "le compte lié",
};
const BACKUP_FIELDS: Record<string, string> = {
  형식: "format",
  ID: "ID",
  이름: "nom",
  금액: "montant",
  통화: "devise",
  결제일: "jour de prélèvement",
  "결제 주기": "fréquence de prélèvement",
  "결제 월": "mois de prélèvement",
  카테고리: "catégorie",
  상태: "statut",
  등록일: "date d'ajout",
  해지일: "date de résiliation",
  "숨긴 날": "date de masquage",
  "요금 확인일": "date de vérification du prix",
  "함께 쓰는 사람 수": "nombre de personnes qui partagent",
  "내 몫": "ma part",
  "결제 수단": "moyen de paiement",
  "해지 링크": "lien de résiliation",
  "해지 안내": "guide de résiliation",
  아이콘: "icône",
  "아이콘 색": "couleur de l'icône",
  요금제: "formule",
  "요금제 이름": "nom de la formule",
  세금: "taxe",
  "연동 계정": "compte lié",
  "연동 계정 이름": "nom du compte lié",
  메모: "note",
  "무료 요금제로 충분했는지": "si la formule gratuite suffisait",
  "토큰 사용량": "jetons utilisés",
  "다시 살펴볼 날": "date de réexamen",
  "해지 기록": "relevé de résiliation",
  "주문 메일 근거": "preuve par e-mails de commande",
  "결제 메일 기록": "historique des e-mails de paiement",
  "구독 ID": "ID d'abonnement",
  월: "mois",
  "사용 횟수": "nombre d'utilisations",
  "1회당 비용": "coût par utilisation",
  위험도: "niveau de risque",
  "체크인 시각": "heure du check-in",
  "체크인 출처": "source du check-in",
  "체크인 지표": "indicateur du check-in",
  "로그인 제공자": "fournisseur de connexion",
  칭호: "titre",
  "이메일/ID": "e-mail/ID",
  색: "couleur",
};
const UNITS: Record<string, string> = { 초: "secondes", 분: "minutes", 시간: "heures" };

export const KNOWN_TEXT_FR: Render[] = [
  // 아이디
  () => "Saisissez un nom d'utilisateur.",
  (min, max) => `Le nom d'utilisateur doit comporter ${min} à ${max} caractères.`,
  () =>
    "Le nom d'utilisateur ne peut contenir que des minuscules, des chiffres et le tiret bas (_).",
  () => "Saisissez votre nom d'utilisateur ou votre e-mail.",
  () => "Ce nom d'utilisateur est déjà pris.",
  () =>
    "Le format est correct. La disponibilité du nom d'utilisateur est vérifiée à l'inscription.",
  // Gmail 가져오기
  () =>
    "Impossible de lire les e-mails importés. Touchez à nouveau le bouton sur l'écran Apps Script.",
  // 서비스 주소
  () => "Vérifiez l'adresse (ex. service.com).",
  // 이메일
  () => "Saisissez votre adresse e-mail.",
  () => "L'adresse e-mail est trop longue.",
  () => "L'adresse e-mail n'est pas valide (ex. you@example.com).",
  () =>
    "L'adresse e-mail n'est pas valide. Vérifiez le domaine après @ (ex. gmail.com, naver.com).",
  (s) => `L'adresse e-mail semble erronée. Vouliez-vous dire ${s} ?`,
  () =>
    "Impossible de s'inscrire avec cette adresse. Utilisez une adresse courante comme naver.com, gmail.com ou daum.net.",
  () => "L'e-mail est valide. Son utilisation est vérifiée à l'inscription.",
  () => "Cet e-mail est déjà utilisé.",
  () => "Un compte avec cet e-mail attend déjà la confirmation de l'adresse.",
  // 비밀번호
  () => "Saisissez un mot de passe.",
  (more, min) => `Encore ${more} caractère(s) (au moins ${min}).`,
  (max) => `Le mot de passe peut comporter au plus ${max} caractères.`,
  () => "Le mot de passe ne peut pas être un seul caractère répété.",
  () => "Le mot de passe est trop long.",
  () => "Saisissez à nouveau le mot de passe.",
  () => "Les mots de passe ne correspondent pas.",
  () => "Les mots de passe ne correspondent pas.",
  () => "Les mots de passe correspondent.",
  () => "Le mot de passe est valide.",
  // 나이·성별·만 14세
  () => "Saisissez votre âge.",
  () => "Saisissez votre âge en chiffres.",
  (age) => `Vous devez avoir au moins ${age} ans pour utiliser SubSlash.`,
  () => "Vérifiez votre âge.",
  () => "Choisissez votre genre.",
  () => "Choisissez à nouveau votre genre.",
  (age) => `Confirmez que vous avez au moins ${age} ans.`,
  // 서버 응답
  () => "La requête n'a pas pu être comprise.",
  () => "Vérifiez les informations saisies.",
  () => "Le nom d'utilisateur ou le mot de passe est incorrect.",
  () => "Connexion impossible.",
  () => "Certaines informations sont déjà utilisées.",
  () => "L'inscription n'a pas pu aboutir.",
  (m) => `Trop de requêtes. Réessayez dans ${m} minute(s).`,
  () => "Trop de requêtes. Réessayez dans un instant.",
  // 확인 메일
  (email) =>
    `E-mail de confirmation envoyé à ${email}. S'il n'est pas dans votre boîte de réception, vérifiez les spams.`,
  (n, unit) =>
    `Des e-mails ont été envoyés trop souvent à cette adresse. Vous pourrez renvoyer dans ${n} ${UNITS[unit] ?? unit}.`,
  () =>
    "L'envoi d'e-mails n'est pas configuré sur ce serveur : impossible d'envoyer l'e-mail de confirmation.",
  () => "Impossible d'envoyer l'e-mail de confirmation. Réessayez dans un instant.",
  () => "Impossible d'envoyer l'e-mail de confirmation.",
  // 비밀번호 재설정 메일
  (email, m) =>
    `E-mail de réinitialisation du mot de passe envoyé à ${email}. Le lien n'est utilisable qu'une fois pendant ${m} minutes. S'il n'est pas dans votre boîte de réception, vérifiez les spams.`,
  (n, unit) =>
    `Des e-mails ont été envoyés trop souvent à cette adresse. Vous pourrez redemander dans ${n} ${UNITS[unit] ?? unit}.`,
  () =>
    "L'envoi d'e-mails n'est pas configuré sur ce serveur : impossible d'envoyer l'e-mail de réinitialisation.",
  () => "Impossible d'envoyer l'e-mail de réinitialisation. Redemandez dans un instant.",
  () => "Impossible d'envoyer l'e-mail de réinitialisation.",
  () => "Aucun compte n'est inscrit avec cet e-mail.",
  // 내 정보·비밀번호·탈퇴·로그인 방법
  () => "Vous devez vous connecter.",
  () => "Impossible d'enregistrer vos informations.",
  () => "Saisissez votre mot de passe actuel.",
  () => "Le mot de passe actuel est incorrect.",
  () => "Choisissez un mot de passe différent de l'actuel.",
  () =>
    "Le mot de passe a déjà été changé ailleurs. Reconnectez-vous avec le nouveau mot de passe.",
  () => "Impossible de changer le mot de passe. Réessayez dans un instant.",
  () => "Impossible de changer le mot de passe.",
  () => "Le mot de passe est incorrect.",
  () => "Impossible de traiter le lien de réinitialisation.",
  () => "Impossible de traiter le lien de confirmation.",
  () => "Ce compte est déjà confirmé et ne peut pas être supprimé avec ce lien.",
  () => "Impossible de supprimer le compte. Réessayez dans un instant.",
  () => "Saisissez 'DELETE' pour confirmer.",
  () => "Impossible de charger les méthodes de connexion.",
  () => "Impossible de lancer la liaison.",
  () => "Impossible de délier.",
  () => "Déjà lié.",
  () => "La liaison est impossible pour l'instant.",
  () =>
    "C'est votre seule méthode de connexion, elle ne peut pas être déliée. Créez d'abord un mot de passe ou liez un autre compte.",
  // Gmail 자동 가져오기
  () => "Cette fonctionnalité n'a pas encore commencé.",
  () => "Impossible de lire l'état de la connexion.",
  () => "Impossible de créer un jeton de connexion.",
  () => "Impossible de lancer la connexion à Gmail.",
  () => "La connexion en un clic n'est pas configurée. Installez le script vous-même.",
  () => "Impossible de lire les abonnements trouvés.",
  () => "Impossible de supprimer les abonnements trouvés.",
  // 구글 캘린더 등록
  () => "La synchronisation Google Agenda n'est pas configurée sur ce serveur.",
  () => "Impossible de lire la liste d'abonnements envoyée.",
  () => "Aucun abonnement à ajouter à l'agenda.",
  () => "Impossible de lancer la synchronisation de l'agenda.",
  // 여러 기기 사용 측정
  () => "Impossible d'ouvrir les réglages d'accès aux données d'utilisation.",
  () => "Impossible d'envoyer les données d'utilisation.",
  () => "Impossible de lire les données d'utilisation.",
  () => "Impossible de lire les données d'utilisation envoyées.",
  () => "Impossible d'enregistrer les données d'utilisation.",
  () => "Impossible de supprimer les données d'utilisation.",
  // 익명 통계
  () => "Vous devez vous connecter pour participer aux statistiques.",
  () => "Impossible de lire le résumé envoyé.",
  () => "Aucune participation enregistrée.",
  () => "Impossible d'envoyer aux statistiques.",
  () => "Le jeton est manquant.",
  () => "Impossible de supprimer l'enregistrement.",
  () => "Impossible de lire les statistiques.",
  // 물어보기·도움말 AI
  () => "Cette fonctionnalité n'est pas encore prête.",
  () => "Impossible de répondre pour l'instant.",
  () => "Impossible de répondre pour l'instant. Reposez la question dans un instant.",
  () => "Saisissez une question.",
  (max) => `La question peut comporter au plus ${max} caractères.`,
  () => "Il y a beaucoup de questions en ce moment. Reposez la question dans un instant.",
  // 계정 저장
  () => "Aucune donnée n'est enregistrée dans le compte.",
  () => "Impossible de lire les données enregistrées dans le compte.",
  () =>
    "Les données sont trop volumineuses pour le compte. Enregistrez plutôt un fichier de sauvegarde.",
  () => "Impossible d'enregistrer dans le compte.",
  () => "Impossible de supprimer les données enregistrées dans le compte.",
  () => "Un autre appareil a modifié les données du compte entre-temps.",
  () =>
    "La base de données n'est pas configurée sur ce serveur : les fonctions de compte sont indisponibles. Votre liste d'abonnements reste dans ce navigateur.",
  // 백업 파일 복원
  () =>
    "Ce n'est pas un fichier JSON. Choisissez un fichier de sauvegarde enregistré depuis SubSlash.",
  () => "Ce n'est pas un fichier de sauvegarde SubSlash.",
  () => "Impossible de déterminer la version du format de la sauvegarde.",
  () =>
    "Cette sauvegarde est dans un format plus récent que l'appli. Rechargez la page et réessayez.",
  () =>
    "Le fichier de sauvegarde doit contenir les listes d'abonnements, de check-ins et de comptes liés.",
  (list, index, field) =>
    `Le champ « ${BACKUP_FIELDS[field] ?? field} » de ${BACKUP_LISTS[list] ?? list} n° ${index} n'est pas valide.`,
  (index) => `L'abonnement n° ${index} a le même ID qu'un autre abonnement.`,
  () => "Le réglage du taux de change n'est pas valide.",
];
