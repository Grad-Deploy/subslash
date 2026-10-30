import type { FAQ_EN } from "./faq-en";

/**
 * 도움말 FAQ의 포르투갈어(브라질). 한국어 원문(`faq.ts`)과 id가 같고
 * 같은 사실만 적는다 — 한국어 답을 고치면 영어·이 파일도 함께 고친다.
 */
export const FAQ_GROUP_TITLES_PT: Record<string, string> = {
  시작하기: "Primeiros passos",
  "기록과 로그인": "Dados e login",
  해지: "Cancelamento",
  "알림과 가져오기": "Lembretes e importação",
  "AI에게 묻기": "Perguntar à IA",
};

export const FAQ_PT: typeof FAQ_EN = {
  "what-is": {
    q: "O que o SubSlash faz?",
    a: "Ele mostra quanto cada assinatura custa por uso (custo por uso) e indica onde cancelar as que não valem a pena. Adicione suas assinaturas e registre quantas vezes usou cada uma nos últimos 30 dias, e ele faz a conta.",
  },
  "get-app": {
    q: "Onde baixo o app? Existe app para iPhone?",
    a: "Baixe o app Android procurando “SubSlash” no Google Play ou pelo “Baixe o app no Google Play” no fim das páginas da web. Não há app para iPhone, então no iPhone use pelo navegador. Os check-ins automáticos pelo histórico de uso do celular e os lembretes de pagamento neste aparelho só funcionam no app Android. Entre com a mesma conta na web e no app e seus registros ficam sincronizados.",
  },
  "cost-per-use": {
    q: "Como o custo por uso é calculado?",
    a: "Sua parte mensal é dividida pelo número de usos nos últimos 30 dias. Em assinaturas divididas com outras pessoas só conta a sua parte, e as anuais são primeiro convertidas em valor mensal. Assinaturas sem registro não têm número de usos, então não inventamos um custo e mostramos “Ainda sem registro”.",
  },
  "exchange-rate": {
    q: "Como as assinaturas pagas em dólar são convertidas para won? Posso mudar a taxa de câmbio?",
    a: "As assinaturas em dólar são convertidas para won pela taxa mostrada em “Câmbio” nas Configurações. No automático, ela segue a taxa de referência do BCE (atualizada uma vez por dia útil); se você digitar uma em “Mudar taxa”, esse valor continua sendo usado. Os recibos de assinatura e o resumo do ano, que mostram pagamentos passados, usam a taxa de referência do dia de cada pagamento, e não a de hoje. A taxa de referência não é a que a operadora do cartão cobrou, então os valores podem diferir um pouco da fatura. A seção “Câmbio” só aparece enquanto você tiver uma assinatura em dólar ativa.",
  },
  "checkin-auto": {
    q: "Dá para preencher os check-ins sem contar eu mesmo?",
    a: "No app para Android, ative “Conectar uso do celular” nas Configurações; quando houver 30 dias de uso dos apps de assinatura neste celular, o check-in é feito sozinho. Na web pelo PC, abra a tela de leitura dos registros pelo link na janela de check-in de uma assinatura do Claude, ChatGPT, Cursor ou Google AI e escolha a pasta de registros de uma ferramenta de programação com IA ou um arquivo exportado de conversas do claude.ai: os dias de uso são contados e preenchidos na janela de check-in. Os arquivos não são enviados a nenhum servidor e nada é salvo até você confirmar. Em qualquer caso, só conta o que ficou registrado naquele dispositivo ou arquivo, então pode ser menos que o seu uso real.",
  },
  "where-stored": {
    q: "Onde ficam salvos meus dados de assinaturas?",
    a: "Por padrão, só neste dispositivo (no navegador ou no app), sem envio a servidor. Se você entrar na conta, eles também ficam na sua conta e são sincronizados automaticamente com seus outros dispositivos conectados.",
  },
  "lose-records": {
    q: "Vou perder meus dados se trocar de dispositivo ou limpar os dados do navegador?",
    a: "Sem login, pode acontecer. Entre na conta antes ou salve um arquivo de backup no backup de dados das Configurações. No dispositivo novo, entre na conta ou carregue o arquivo de backup.",
  },
  "social-email-taken": {
    q: "Ao entrar com Google, Kakao ou Naver aparece “Já existe uma conta”.",
    a: "Se uma conta foi criada primeiro com esse e-mail, não juntamos automaticamente, para que ninguém mais entre com o mesmo endereço. Entre com o método usado no cadastro (e-mail e senha, ou o primeiro login social) e vincule o outro em “Métodos de login” em Minhas informações. A partir daí, esse método abre a mesma conta. Seus dados ficam numa só conta, sem nada para juntar ou apagar.",
  },
  "delete-records": {
    q: "Como apago meus dados ou saio do serviço?",
    a: "Apague as assinaturas deste dispositivo com a redefinição completa nas Configurações. Exclua sua conta em Minhas informações; os dados deste dispositivo não são apagados e ficam como dados sem login.",
  },
  "cancel-in-app": {
    q: "Dá para cancelar direto no SubSlash?",
    a: "Não. O cancelamento é feito em cada serviço. O SubSlash dá o link para onde cancelar e o caminho dos menus. Depois de cancelar, toque em “Cancelei” para registrar — o SubSlash não consegue verificar sozinho se você cancelou.",
  },
  "cancel-button-color": {
    q: "Qual a diferença entre o botão de cancelar vermelho e o com contorno?",
    a: "O botão vermelho é um link verificado que leva direto à página de cancelamento. O botão com contorno leva à página inicial ou da conta, e depois é preciso achar o menu de cancelamento seguindo o guia abaixo.",
  },
  "store-billing-cancel": {
    q: "Onde cancelo uma assinatura paga pela App Store ou pelo Google Play?",
    a: "Cancele onde você pagou. Se definir a forma de pagamento como “Compra no app pela Apple App Store” ou “Assinatura do Google Play”, o guia de cancelamento mostra primeiro essa tela de gerenciamento de assinaturas.",
  },
  "billing-reminder": {
    q: "Posso receber um lembrete antes da data de cobrança?",
    a: ({ gmailOpen }) =>
      gmailOpen
        ? "No app, ative “Lembretes de pagamento neste dispositivo” nas Configurações e o celular avisa. Na web, adicione as datas de cobrança ao Google Agenda pelo botão abaixo da sua lista de assinaturas: elas viram eventos e as notificações da agenda aparecem. Os lembretes de pagamento por e-mail foram encerrados."
        : "No app, ative “Lembretes de pagamento neste dispositivo” nas Configurações e o celular avisa. Os lembretes de pagamento por e-mail foram encerrados.",
  },
  "gmail-unverified": {
    q: "Aparece o aviso “app não verificado” ao conectar o Gmail.",
    a: "Ele aparece porque o app de conexão do SubSlash ainda não foi analisado pelo Google. Continue em “Avançado” e a conexão é feita. Se preferir não ver o aviso, instale na sua própria conta com “Instalar você mesmo sem aviso (copiar o script)” na tela de importação.",
  },
  "gmail-stored": {
    q: "O conteúdo dos meus e-mails do Gmail fica guardado no SubSlash?",
    a: "Não. Dos e-mails de pagamento só guardamos candidatos de assinatura, como nome do serviço, valor e data de cobrança, e nunca o assunto ou o corpo. Você pode desconectar quando quiser na tela de importação.",
  },
  "gmail-annual-missing": {
    q: "Uma assinatura que pago uma vez por ano não aparece na importação.",
    a: "Ao conectar o Gmail, verificamos primeiro os últimos 40 dias de e-mail e o resto do ano nos minutos seguintes. Abra de novo daqui a pouco. Se ainda faltar, esse e-mail de pagamento não foi encontrado, então adicione você mesmo.",
  },
  "ai-what-is-sent": {
    q: "O que é enviado quando pergunto à IA?",
    a: "Só o texto da sua pergunta vai para a empresa de IA. Sua lista de assinaturas e os valores não são enviados — a IA só escolhe qual cálculo fazer ou qual ajuda mostrar, e os números são calculados neste dispositivo. Por isso, não coloque dados pessoais como nome ou contatos na pergunta.",
  },
  "ai-wrong-answer": {
    q: "A IA mostra uma resposta errada.",
    a: "A IA só escolhe entre os cálculos e entradas de ajuda que preparamos, então se entender mal a pergunta pode mostrar outro cálculo ou outra entrada. Pergunte de outro jeito ou toque num dos botões de pergunta abaixo. Se continuar errando, mande um e-mail para nós.",
  },
};
