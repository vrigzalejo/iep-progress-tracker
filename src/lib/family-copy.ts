import type { FamilyLocale } from "@/lib/family-locale";

const COPY = {
  en: {
    portalEyebrow: "Family portal",
    progressTitle: (name: string) => `${name}’s progress`,
    portalIntro:
      "You can see goals the school has shared, recent progress in everyday language, reports, and messages with the team. You cannot see other families’ students.",
    noStudent: "No student is linked to this account",
    noStudentBody:
      "Ask your school’s special education office to connect this family account to a student profile.",
    openReport: "Open progress report",
    meetingPacket: "Meeting packet",
    privacyConsent: "Privacy and consent",
    homeCards: "Home practice cards",
    weeklyEmail: "Weekly email",
    weeklyEmailBody: (name: string) =>
      `Optional Friday update for ${name}: shared goals, last week’s scores, and staff-written home carryover. Off by default. The subject line is only a name—no scores. Each mail includes who can see it and an unsubscribe link. The product does not rewrite this with a model.`,
    weeklyOptIn: "Send me the weekly update for this student",
    saveEmail: "Save email preference",
    weeklySaved: "Weekly email preference saved",
    weeklySavedBody:
      "The school will only send this update if you opted in. It uses scores and home-carryover notes already on file.",
    officialGoal: "Official goal",
    latestUpdate: (date: string, score: string) => `Latest update ${date}: ${score}.`,
    noScore: "The team has not posted a score yet.",
    tryAtHome: "To try at home:",
    seeChart: "See the chart",
    messages: "Messages with the team",
    writeTeam: "Write to the team",
    send: "Send",
    language: "Language",
    english: "English",
    spanish: "Español",
    reportHeader: "report",
    reportDisclaimer:
      "Everyday-language summary of progress the school logged. This is not a legal IEP document and does not recommend services.",
    digestOpener: (name: string, week: string) => `This is a weekly update for ${name} (${week}).`,
    digestDisclaimer:
      "It uses scores and home-carryover notes the school already wrote. It does not suggest services or placement.",
    digestEmpty: "No shared goals are on this update.",
    digestScores: "Last week’s scores:",
    digestWho: (name: string) => `Who can see this: guardians linked to ${name} who opted in.`,
    digestReadMore: "Read more in the family portal:",
    digestUnsub: "Unsubscribe:",
    digestNoLabels: (product: string) =>
      `${product} does not include disability labels or official IEP wording in this email.`,
    noPresent: "No present session this week.",
    digestSubject: (name: string) => `Weekly update for ${name}`,
    digestSubjectEs: (name: string) => `Actualización semanal de ${name}`,
  },
  es: {
    portalEyebrow: "Portal familiar",
    progressTitle: (name: string) => `Progreso de ${name}`,
    portalIntro:
      "Puede ver las metas que la escuela compartió, el progreso en lenguaje cotidiano, los informes y los mensajes con el equipo. No puede ver estudiantes de otras familias.",
    noStudent: "No hay un estudiante vinculado a esta cuenta",
    noStudentBody:
      "Pida a la oficina de educación especial de la escuela que vincule esta cuenta familiar con un perfil de estudiante.",
    openReport: "Abrir informe de progreso",
    meetingPacket: "Paquete de reunión",
    privacyConsent: "Privacidad y consentimiento",
    homeCards: "Tarjetas para practicar en casa",
    weeklyEmail: "Correo semanal",
    weeklyEmailBody: (name: string) =>
      `Actualización opcional del viernes para ${name}: metas compartidas, puntajes de la semana y prácticas en casa escritas por el personal. Está apagada por defecto. El asunto solo tiene un nombre, sin puntajes. Cada correo dice quién puede verlo e incluye un enlace para cancelar. El producto no reescribe esto con un modelo.`,
    weeklyOptIn: "Envíenme la actualización semanal de este estudiante",
    saveEmail: "Guardar preferencia de correo",
    weeklySaved: "Preferencia de correo semanal guardada",
    weeklySavedBody:
      "La escuela solo envía esta actualización si usted la pidió. Usa puntajes y notas de práctica en casa que ya están en el expediente.",
    officialGoal: "Meta oficial",
    latestUpdate: (date: string, score: string) => `Última actualización ${date}: ${score}.`,
    noScore: "El equipo todavía no publicó un puntaje.",
    tryAtHome: "Para practicar en casa:",
    seeChart: "Ver la gráfica",
    messages: "Mensajes con el equipo",
    writeTeam: "Escribir al equipo",
    send: "Enviar",
    language: "Idioma",
    english: "English",
    spanish: "Español",
    reportHeader: "informe",
    reportDisclaimer:
      "Resumen en lenguaje cotidiano del progreso que la escuela registró. No es un documento legal del IEP y no recomienda servicios.",
    digestOpener: (name: string, week: string) => `Esta es una actualización semanal de ${name} (${week}).`,
    digestDisclaimer:
      "Usa puntajes y notas de práctica en casa que la escuela ya escribió. No sugiere servicios ni colocación.",
    digestEmpty: "No hay metas compartidas en esta actualización.",
    digestScores: "Puntajes de la semana:",
    digestWho: (name: string) => `Quién puede ver esto: tutores vinculados a ${name} que lo pidieron.`,
    digestReadMore: "Leer más en el portal familiar:",
    digestUnsub: "Cancelar suscripción:",
    digestNoLabels: (product: string) =>
      `${product} no incluye etiquetas de discapacidad ni el texto oficial del IEP en este correo.`,
    noPresent: "No hubo sesión presente esta semana.",
    digestSubject: (name: string) => `Weekly update for ${name}`,
    digestSubjectEs: (name: string) => `Actualización semanal de ${name}`,
  },
} as const;

export function familyCopy(locale: FamilyLocale) {
  return COPY[locale];
}
