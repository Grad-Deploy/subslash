import type { FAQ_EN } from "./faq-en";

/**
 * 도움말 FAQ의 스페인어. 한국어 원문(`faq.ts`)과 id가 같고
 * 같은 사실만 적는다 — 한국어 답을 고치면 영어·이 파일도 함께 고친다.
 */
export const FAQ_GROUP_TITLES_ES: Record<string, string> = {
  시작하기: "Primeros pasos",
  "기록과 로그인": "Datos e inicio de sesión",
  해지: "Cancelar",
  "알림과 가져오기": "Recordatorios e importación",
  "AI에게 묻기": "Preguntar a la IA",
};

export const FAQ_ES: typeof FAQ_EN = {
  "what-is": {
    q: "¿Qué hace SubSlash?",
    a: "Muestra cuánto cuesta cada suscripción por uso (coste por uso) y te guía a donde puedes cancelar las que no valen la pena. Añade tus suscripciones y registra cuántas veces usaste cada una en los últimos 30 días, y hace el cálculo.",
  },
  "cost-per-use": {
    q: "¿Cómo se calcula el coste por uso?",
    a: "Tu parte mensual se divide entre las veces que la usaste en los últimos 30 días. En las suscripciones compartidas solo cuenta tu parte, y las anuales se pasan primero a un importe mensual. Las suscripciones sin registro no tienen número de usos, así que no inventamos un coste y mostramos «Aún sin registro».",
  },
  "checkin-auto": {
    q: "¿Se pueden rellenar los check-ins sin contar yo mismo?",
    a: "En la app de Android, activa «Conectar el uso del móvil» en Ajustes y, cuando se acumulen 30 días de uso de las apps de suscripción en este móvil, hará el check-in por ti. En la web desde un PC, abre la pantalla de lectura de registros con el enlace de la ventana de check-in de una suscripción a Claude, ChatGPT, Cursor o Google AI, y elige la carpeta de registros de una herramienta de programación con IA o un archivo de exportación de chats de claude.ai: se cuentan los días de uso y se rellenan en la ventana de check-in. Los archivos no se envían a ningún servidor y no se guarda nada hasta que confirmes. En ambos casos solo se cuenta lo que quedó en ese dispositivo o archivo, así que puede ser menos que tu uso real.",
  },
  "where-stored": {
    q: "¿Dónde se guardan mis datos de suscripciones?",
    a: "Por defecto solo en este dispositivo (en el navegador o la app) y no se envían a ningún servidor. Si inicias sesión, también se guardan en tu cuenta y se sincronizan automáticamente con tus otros dispositivos con sesión iniciada.",
  },
  "lose-records": {
    q: "¿Perderé mis datos si cambio de dispositivo o borro los datos del navegador?",
    a: "Si no has iniciado sesión, puede pasar. Inicia sesión antes o guarda un archivo de copia de seguridad en la copia de datos de Ajustes. En el dispositivo nuevo, inicia sesión o carga el archivo de copia.",
  },
  "social-email-taken": {
    q: "Al entrar con Google, Kakao o Naver dice «Ya existe una cuenta».",
    a: "Si una cuenta se creó primero con ese correo, no la unimos automáticamente, para que nadie más pueda entrar con la misma dirección. Inicia sesión con el método con el que te registraste (correo y contraseña, o el primer inicio social que usaste) y vincula el otro en «Métodos de inicio de sesión» de Mi información. Desde entonces ese método abre la misma cuenta. Tus datos quedan en una sola cuenta, sin nada que unir ni borrar.",
  },
  "delete-records": {
    q: "¿Cómo borro mis datos o me doy de baja?",
    a: "Borra las suscripciones de este dispositivo con el restablecimiento total en Ajustes. Borra tu cuenta desde Mi información; los datos de este dispositivo no se borran entonces y quedan como datos sin sesión iniciada.",
  },
  "cancel-in-app": {
    q: "¿Puedo cancelar directamente en SubSlash?",
    a: "No. Se cancela en cada servicio. SubSlash te da el enlace a donde cancelar y la ruta de menús. Cuando termines de cancelar y toques «Ya cancelé», se registra como cancelada — SubSlash no puede comprobar por sí mismo si cancelaste.",
  },
  "cancel-button-color": {
    q: "¿Qué diferencia hay entre un botón de cancelar rojo y uno con borde?",
    a: "El botón rojo es un enlace comprobado que lleva directamente a la página de cancelación. El botón con borde lleva a la página de inicio o de la cuenta, así que después tienes que buscar el menú de cancelación siguiendo la guía de abajo.",
  },
  "store-billing-cancel": {
    q: "¿Dónde cancelo una suscripción pagada por la App Store o Google Play?",
    a: "Cancela donde pagaste. Si pones como método de pago «Compra integrada de Apple App Store» o «Suscripción de Google Play», la guía de cancelación muestra primero esa pantalla de gestión de suscripciones.",
  },
  "billing-reminder": {
    q: "¿Puedo recibir un aviso antes de la fecha de cobro?",
    a: ({ gmailOpen }) =>
      gmailOpen
        ? "En la app, activa «Recordatorios de pago en este dispositivo» en Ajustes y te avisará en este móvil. En la web, añade las fechas de cobro a Google Calendar con el botón de debajo de tu lista de suscripciones: se convierten en eventos y aparecen las notificaciones del calendario. Los recordatorios de pago por correo terminaron."
        : "En la app, activa «Recordatorios de pago en este dispositivo» en Ajustes y te avisará en este móvil. Los recordatorios de pago por correo terminaron.",
  },
  "gmail-unverified": {
    q: "Al conectar Gmail aparece la advertencia «aplicación no verificada».",
    a: "Aparece porque Google aún no ha revisado la aplicación de conexión de SubSlash. Continúa en «Configuración avanzada» y se conecta. Si prefieres no ver la advertencia, instálala en tu propia cuenta con «Instalarlo tú sin advertencia (copiar el script)» en la pantalla de importación.",
  },
  "gmail-stored": {
    q: "¿Se guarda en SubSlash el contenido de mis correos de Gmail?",
    a: "No. De los correos de pago solo guardamos candidatos de suscripción como el nombre del servicio, el importe y la fecha de cobro, y nunca el asunto ni el cuerpo. Puedes desconectar cuando quieras en la pantalla de importación.",
  },
  "gmail-annual-missing": {
    q: "Una suscripción que pago una vez al año no aparece en la importación.",
    a: "Al conectar Gmail revisamos primero los últimos 40 días de correo, y el resto del año en los minutos siguientes. Vuelve a abrirla en un rato. Si sigue sin aparecer, ese correo de pago no se encontró, así que añádela tú.",
  },
  "ai-what-is-sent": {
    q: "¿Qué se envía cuando pregunto a la IA?",
    a: "Solo el texto de tu pregunta va a la empresa de IA. Tu lista de suscripciones y los importes no se envían — la IA solo elige qué cálculo hacer o qué ayuda mostrar, y los números se calculan en este dispositivo. Por eso, no pongas datos personales como tu nombre o contactos en la pregunta.",
  },
  "ai-wrong-answer": {
    q: "La IA muestra una respuesta equivocada.",
    a: "La IA solo elige entre los cálculos y entradas de ayuda que hemos preparado, así que si entiende mal la pregunta puede mostrar otro cálculo u otra entrada. Pregunta de otra forma o toca uno de los botones de pregunta de abajo. Si sigue fallando, escríbenos.",
  },
};
