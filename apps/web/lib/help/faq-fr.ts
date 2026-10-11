import type { FAQ_EN } from "./faq-en";

/**
 * 도움말 FAQ의 프랑스어. 원어민 검토 전의 번역이다(LOCALE_INFO.beta). 한국어 원문(`faq.ts`)과 id가 같고
 * 같은 사실만 적는다 — 한국어 답을 고치면 영어·이 파일도 함께 고친다.
 */
export const FAQ_GROUP_TITLES_FR: Record<string, string> = {
  시작하기: "Premiers pas",
  "기록과 로그인": "Données et connexion",
  해지: "Résiliation",
  "알림과 가져오기": "Rappels et import",
  "AI에게 묻기": "Demander à l'IA",
};

export const FAQ_FR: typeof FAQ_EN = {
  "what-is": {
    q: "À quoi sert SubSlash ?",
    a: "Il montre ce que coûte chaque abonnement par utilisation (coût par utilisation) et vous guide vers l'endroit où résilier ceux qui n'en valent pas la peine. Ajoutez vos abonnements et indiquez combien de fois vous avez utilisé chacun ces 30 derniers jours : il fait le calcul.",
  },
  "cost-per-use": {
    q: "Comment le coût par utilisation est-il calculé ?",
    a: "Votre part mensuelle est divisée par le nombre d'utilisations des 30 derniers jours. Pour un abonnement partagé, seule votre part compte, et les abonnements annuels sont d'abord ramenés à un montant mensuel. Sans check-in, il n'y a pas de nombre d'utilisations : nous n'inventons pas de coût et affichons « Pas encore de check-in ».",
  },
  "where-stored": {
    q: "Où sont stockées mes données d'abonnement ?",
    a: "Par défaut, uniquement sur cet appareil (dans le navigateur ou l'appli), sans envoi à un serveur. Si vous vous connectez, elles sont aussi stockées dans votre compte et synchronisées automatiquement avec vos autres appareils connectés.",
  },
  "lose-records": {
    q: "Vais-je perdre mes données en changeant d'appareil ou en effaçant les données du navigateur ?",
    a: "Si vous n'êtes pas connecté, c'est possible. Connectez-vous avant, ou enregistrez un fichier de sauvegarde dans la sauvegarde des données des Réglages. Sur le nouvel appareil, connectez-vous ou chargez le fichier de sauvegarde.",
  },
  "social-email-taken": {
    q: "La connexion avec Google, Kakao ou Naver indique « Un compte existe déjà ».",
    a: "Si un compte a d'abord été créé avec cette adresse, nous ne fusionnons pas automatiquement, pour que personne d'autre ne puisse y entrer avec la même adresse. Connectez-vous avec la méthode utilisée à l'inscription (e-mail et mot de passe, ou la première connexion sociale), puis liez l'autre méthode dans « Méthodes de connexion » de Mes infos. Ensuite, cette méthode ouvre le même compte. Vos données restent dans un seul compte, rien à fusionner ni à supprimer.",
  },
  "delete-records": {
    q: "Comment supprimer mes données ou mon compte ?",
    a: "Supprimez les abonnements de cet appareil avec la réinitialisation complète dans les Réglages. Supprimez votre compte depuis Mes infos ; les données de cet appareil ne sont alors pas supprimées et restent comme données d'un utilisateur déconnecté.",
  },
  "cancel-in-app": {
    q: "Puis-je résilier directement dans SubSlash ?",
    a: "Non. Vous résiliez auprès de chaque service. SubSlash vous donne le lien vers l'endroit où résilier et le chemin dans les menus. Une fois la résiliation faite, touchez « J'ai résilié » pour l'enregistrer — SubSlash ne peut pas vérifier lui-même que vous avez résilié.",
  },
  "cancel-button-color": {
    q: "Quelle différence entre un bouton de résiliation rouge et un bouton à contour ?",
    a: "Le bouton rouge est un lien vérifié qui mène directement à la page de résiliation. Le bouton à contour mène à l'accueil ou à la page du compte : il faut ensuite trouver le menu de résiliation en suivant le guide en dessous.",
  },
  "store-billing-cancel": {
    q: "Où résilier un abonnement payé via l'App Store ou Google Play ?",
    a: "Résiliez là où vous avez payé. Si vous indiquez comme moyen de paiement « Achat intégré Apple App Store » ou « Abonnement Google Play », le guide de résiliation affiche d'abord cet écran de gestion des abonnements.",
  },
  "billing-reminder": {
    q: "Puis-je être prévenu avant la date de prélèvement ?",
    a: ({ gmailOpen }) =>
      gmailOpen
        ? "Dans l'appli, activez « Rappels de paiement sur cet appareil » dans les Réglages pour être prévenu sur ce téléphone. Sur le web, ajoutez les dates de prélèvement à Google Agenda depuis le bouton sous votre liste d'abonnements : elles deviennent des événements et les notifications de l'agenda s'affichent. Les rappels de paiement par e-mail ont pris fin."
        : "Dans l'appli, activez « Rappels de paiement sur cet appareil » dans les Réglages pour être prévenu sur ce téléphone. Les rappels de paiement par e-mail ont pris fin.",
  },
  "gmail-unverified": {
    q: "Un avertissement « application non validée » apparaît quand je connecte Gmail.",
    a: "Il apparaît parce que l'application de connexion de SubSlash n'a pas encore été examinée par Google. Continuez via « Paramètres avancés » et la connexion se fait. Pour éviter l'avertissement, installez-la dans votre propre compte avec « L'installer vous-même sans avertissement (copier le script) » sur l'écran d'import.",
  },
  "gmail-stored": {
    q: "Le contenu de mes e-mails Gmail est-il stocké dans SubSlash ?",
    a: "Non. Des e-mails de paiement, nous ne gardons que des candidats d'abonnement comme le nom du service, le montant et la date de prélèvement, jamais l'objet ni le contenu. Vous pouvez vous déconnecter à tout moment sur l'écran d'import.",
  },
  "gmail-annual-missing": {
    q: "Un abonnement payé une fois par an n'apparaît pas dans l'import.",
    a: "En connectant Gmail, nous vérifions d'abord les 40 derniers jours d'e-mails, puis le reste de l'année dans les minutes qui suivent. Rouvrez l'écran un peu plus tard. S'il manque toujours, cet e-mail de paiement n'a pas été trouvé : ajoutez-le vous-même.",
  },
  "ai-what-is-sent": {
    q: "Qu'est-ce qui est envoyé quand je pose une question à l'IA ?",
    a: "Seul le texte de votre question est envoyé à l'entreprise d'IA. Votre liste d'abonnements et les montants ne sont pas envoyés — l'IA choisit seulement quel calcul lancer ou quelle aide afficher, et les chiffres sont calculés sur cet appareil. N'indiquez donc pas d'informations personnelles comme votre nom ou vos coordonnées.",
  },
  "ai-wrong-answer": {
    q: "L'IA affiche une mauvaise réponse.",
    a: "L'IA choisit seulement parmi les calculs et les entrées d'aide prévus : si elle comprend mal la question, elle peut afficher un autre calcul ou une autre entrée. Reformulez, ou touchez l'un des boutons de question ci-dessous. Si l'erreur persiste, écrivez-nous.",
  },
};
