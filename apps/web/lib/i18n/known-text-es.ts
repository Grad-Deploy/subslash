/**
 * `known-text`의 스페인어. 규칙(정규식)은 `known-text`의 영어 표에
 * 한 벌만 있고, 여기는 **같은 순서의** 번역 함수만 둔다 — 순서·개수가 어긋나면 테스트가 잡는다.
 */
type Render = (...groups: string[]) => string;

const BACKUP_LISTS: Record<string, string> = {
  구독: "la suscripción",
  "체크인 기록": "el registro de uso",
  "연동 계정": "la cuenta vinculada",
};
const BACKUP_FIELDS: Record<string, string> = {
  형식: "formato",
  ID: "ID",
  이름: "nombre",
  금액: "importe",
  통화: "moneda",
  결제일: "día de cobro",
  "결제 주기": "frecuencia de cobro",
  "결제 월": "mes de cobro",
  카테고리: "categoría",
  상태: "estado",
  등록일: "fecha de alta",
  해지일: "fecha de cancelación",
  "숨긴 날": "fecha de ocultación",
  "요금 확인일": "fecha de comprobación del precio",
  "함께 쓰는 사람 수": "número de personas que comparten",
  "내 몫": "mi parte",
  "결제 수단": "método de pago",
  "해지 링크": "enlace de cancelación",
  "해지 안내": "guía de cancelación",
  아이콘: "icono",
  "아이콘 색": "color del icono",
  요금제: "plan",
  "요금제 이름": "nombre del plan",
  세금: "impuesto",
  "연동 계정": "cuenta vinculada",
  "연동 계정 이름": "nombre de la cuenta vinculada",
  메모: "nota",
  "무료 요금제로 충분했는지": "si bastaba el plan gratuito",
  "토큰 사용량": "tokens usados",
  "다시 살펴볼 날": "fecha de revisión",
  "해지 기록": "registro de cancelación",
  "주문 메일 근거": "evidencia de correos de pedido",
  "결제 메일 기록": "historial de correos de pago",
  "구독 ID": "ID de suscripción",
  월: "mes",
  "사용 횟수": "número de usos",
  "1회당 비용": "coste por uso",
  위험도: "nivel de riesgo",
  "체크인 시각": "hora del registro",
  "체크인 출처": "origen del registro",
  "체크인 지표": "indicador del registro",
  "로그인 제공자": "proveedor de inicio de sesión",
  칭호: "título",
  "이메일/ID": "correo/ID",
  색: "color",
};
const UNITS: Record<string, string> = { 초: "segundos", 분: "minutos", 시간: "horas" };

export const KNOWN_TEXT_ES: Render[] = [
  // 아이디
  () => "Escribe un nombre de usuario.",
  (min, max) => `El nombre de usuario debe tener entre ${min} y ${max} caracteres.`,
  () => "El nombre de usuario solo puede tener minúsculas, números y guion bajo (_).",
  () => "Escribe tu nombre de usuario o correo.",
  () => "Ese nombre de usuario ya está en uso.",
  () => "El formato es correcto. La disponibilidad se comprueba al registrarte.",
  // Gmail 가져오기
  () =>
    "No se pudieron leer los correos importados. Vuelve a pulsar el botón en la pantalla de Apps Script.",
  // 서비스 주소
  () => "Revisa la dirección (p. ej. service.com).",
  // 이메일
  () => "Escribe tu dirección de correo.",
  () => "La dirección de correo es demasiado larga.",
  () => "La dirección de correo no es válida (p. ej. you@example.com).",
  () =>
    "La dirección de correo no es válida. Revisa el dominio después de @ (p. ej. gmail.com, naver.com).",
  (s) => `La dirección de correo parece incorrecta. ¿Quisiste decir ${s}?`,
  () =>
    "No puedes registrarte con este correo. Usa una dirección habitual como naver.com, gmail.com o daum.net.",
  () => "El correo es válido. Si ya está en uso se comprueba al registrarte.",
  () => "Ese correo ya está en uso.",
  () => "Ya hay una cuenta con este correo esperando la confirmación.",
  // 비밀번호
  () => "Escribe una contraseña.",
  (more, min) => `Escribe ${more} carácter(es) más (al menos ${min}).`,
  (max) => `La contraseña puede tener como máximo ${max} caracteres.`,
  () => "La contraseña no puede ser un solo carácter repetido.",
  () => "La contraseña es demasiado larga.",
  () => "Vuelve a escribir la contraseña.",
  () => "Las contraseñas no coinciden.",
  () => "Las contraseñas no coinciden.",
  () => "Las contraseñas coinciden.",
  () => "La contraseña es válida.",
  // 나이·성별·만 14세
  () => "Escribe tu edad.",
  () => "Escribe tu edad en números.",
  (age) => `Debes tener al menos ${age} años para usar SubSlash.`,
  () => "Revisa tu edad.",
  () => "Elige tu género.",
  () => "Vuelve a elegir tu género.",
  (age) => `Confirma que tienes al menos ${age} años.`,
  // 서버 응답
  () => "No se pudo entender la solicitud.",
  () => "Revisa los datos introducidos.",
  () => "El nombre de usuario o la contraseña no son correctos.",
  () => "No se pudo iniciar sesión.",
  () => "Algunos datos ya están en uso.",
  () => "No se pudo completar el registro.",
  (m) => `Demasiadas solicitudes. Inténtalo de nuevo en ${m} minuto(s).`,
  () => "Demasiadas solicitudes. Inténtalo de nuevo en un momento.",
  // 확인 메일
  (email) =>
    `Enviamos un correo de confirmación a ${email}. Si no está en la bandeja de entrada, revisa el spam.`,
  (n, unit) =>
    `Se han enviado correos a esta dirección con demasiada frecuencia. Podrás reenviar en ${n} ${UNITS[unit] ?? unit}.`,
  () =>
    "El envío de correos no está configurado en este servidor, así que no se pudo enviar la confirmación.",
  () => "No se pudo enviar el correo de confirmación. Inténtalo de nuevo en un momento.",
  () => "No se pudo enviar el correo de confirmación.",
  // 비밀번호 재설정 메일
  (email, m) =>
    `Enviamos un correo para restablecer la contraseña a ${email}. El enlace solo se puede usar una vez durante ${m} minutos. Si no está en la bandeja de entrada, revisa el spam.`,
  (n, unit) =>
    `Se han enviado correos a esta dirección con demasiada frecuencia. Podrás volver a pedirlo en ${n} ${UNITS[unit] ?? unit}.`,
  () =>
    "El envío de correos no está configurado en este servidor, así que no se pudo enviar el correo de restablecimiento.",
  () => "No se pudo enviar el correo de restablecimiento. Vuelve a pedirlo en un momento.",
  () => "No se pudo enviar el correo de restablecimiento.",
  () => "No hay ninguna cuenta registrada con este correo.",
  // 내 정보·비밀번호·탈퇴·로그인 방법
  () => "Tienes que iniciar sesión.",
  () => "No se pudo guardar tu información.",
  () => "Escribe tu contraseña actual.",
  () => "La contraseña actual no es correcta.",
  () => "Elige una contraseña distinta de la actual.",
  () =>
    "La contraseña ya se cambió en otro sitio. Vuelve a iniciar sesión con la nueva contraseña.",
  () => "No se pudo cambiar la contraseña. Inténtalo de nuevo en un momento.",
  () => "No se pudo cambiar la contraseña.",
  () => "La contraseña no es correcta.",
  () => "No se pudo procesar el enlace de restablecimiento.",
  () => "No se pudo procesar el enlace de confirmación.",
  () => "Esta cuenta ya está confirmada y no se puede borrar con este enlace.",
  () => "No se pudo borrar la cuenta. Inténtalo de nuevo en un momento.",
  () => "Escribe 'DELETE' para confirmar.",
  () => "No se pudieron cargar los métodos de inicio de sesión.",
  () => "No se pudo empezar a vincular.",
  () => "No se pudo desvincular.",
  () => "Ya está vinculado.",
  () => "Ahora no se puede vincular.",
  () =>
    "Es tu único método de inicio de sesión, así que no se puede desvincular. Crea primero una contraseña o vincula otra cuenta.",
  // Gmail 자동 가져오기
  () => "Esta función aún no ha empezado.",
  () => "No se pudo leer el estado de la conexión.",
  () => "No se pudo crear un token de conexión.",
  () => "No se pudo empezar a conectar Gmail.",
  () => "La conexión con un clic no está configurada. Instala el script tú mismo.",
  () => "No se pudieron leer las suscripciones encontradas.",
  () => "No se pudieron borrar las suscripciones encontradas.",
  // 구글 캘린더 등록
  () => "La sincronización con Google Calendar no está configurada en este servidor.",
  () => "No se pudo leer la lista de suscripciones enviada.",
  () => "No hay suscripciones que añadir al calendario.",
  () => "No se pudo empezar a sincronizar el calendario.",
  // 여러 기기 사용 측정
  () => "No se pudieron abrir los ajustes de acceso a los datos de uso.",
  () => "No se pudieron subir los datos de uso.",
  () => "No se pudieron leer los datos de uso.",
  () => "No se pudieron leer los datos de uso enviados.",
  () => "No se pudieron guardar los datos de uso.",
  () => "No se pudieron borrar los datos de uso.",
  // 익명 통계
  () => "Tienes que iniciar sesión para participar en las estadísticas.",
  () => "No se pudo leer el resumen enviado.",
  () => "No hay registro de participación.",
  () => "No se pudo enviar a las estadísticas.",
  () => "Falta el token.",
  () => "No se pudo borrar el registro.",
  () => "No se pudieron leer las estadísticas.",
  // 물어보기·도움말 AI
  () => "Esta función aún no está lista.",
  () => "Ahora no se puede responder.",
  () => "Ahora no se puede responder. Vuelve a preguntar en un momento.",
  () => "Escribe una pregunta.",
  (max) => `La pregunta puede tener como máximo ${max} caracteres.`,
  () => "Hay muchas preguntas ahora mismo. Vuelve a preguntar en un momento.",
  // 계정 저장
  () => "No hay datos guardados en la cuenta.",
  () => "No se pudieron leer los datos guardados en la cuenta.",
  () =>
    "Los datos son demasiado grandes para la cuenta. Guarda un archivo de copia de seguridad en su lugar.",
  () => "No se pudo guardar en la cuenta.",
  () => "No se pudieron borrar los datos guardados en la cuenta.",
  () => "Otro dispositivo cambió antes los datos de la cuenta.",
  () =>
    "La base de datos no está configurada en este servidor, así que las funciones de cuenta no están disponibles. Tu lista de suscripciones sigue en este navegador.",
  // 백업 파일 복원
  () => "No es un archivo JSON. Elige un archivo de copia guardado desde SubSlash.",
  () => "No es un archivo de copia de SubSlash.",
  () => "No se pudo saber la versión del formato de la copia.",
  () => "Esta copia tiene un formato más nuevo que la app. Recarga la página e inténtalo de nuevo.",
  () =>
    "El archivo de copia debe incluir las listas de suscripciones, registros y cuentas vinculadas.",
  (list, index, field) =>
    `El campo «${BACKUP_FIELDS[field] ?? field}» de ${BACKUP_LISTS[list] ?? list} n.º ${index} no es válido.`,
  (index) => `La suscripción n.º ${index} tiene el mismo ID que otra.`,
  () => "El ajuste del tipo de cambio no es válido.",
];
