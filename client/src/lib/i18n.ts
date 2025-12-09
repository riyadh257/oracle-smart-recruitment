/**
 * Internationalization (i18n) Configuration
 * Supports Arabic, English, and French with RTL support
 */

export type Language = "en" | "ar" | "fr";

export const languages: Record<Language, { name: string; direction: "ltr" | "rtl" }> = {
  en: { name: "English", direction: "ltr" },
  ar: { name: "العربية", direction: "rtl" },
  fr: { name: "Français", direction: "ltr" },
};

// Translation keys
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "common.welcome": "Welcome",
    "common.dashboard": "Dashboard",
    "common.candidates": "Candidates",
    "common.interviews": "Interviews",
    "common.reports": "Reports",
    "common.settings": "Settings",
    "common.logout": "Logout",
    "common.login": "Login",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.import": "Import",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    
    // Dashboard
    "dashboard.title": "Recruitment Dashboard",
    "dashboard.totalCandidates": "Total Candidates",
    "dashboard.activeInterviews": "Active Interviews",
    "dashboard.pendingReviews": "Pending Reviews",
    "dashboard.recentActivity": "Recent Activity",
    
    // Candidates
    "candidates.title": "Candidates",
    "candidates.addNew": "Add New Candidate",
    "candidates.name": "Name",
    "candidates.email": "Email",
    "candidates.phone": "Phone",
    "candidates.status": "Status",
    "candidates.appliedDate": "Applied Date",
    "candidates.position": "Position",
    
    // Interviews
    "interviews.title": "Interviews",
    "interviews.schedule": "Schedule Interview",
    "interviews.date": "Date",
    "interviews.time": "Time",
    "interviews.interviewer": "Interviewer",
    "interviews.feedback": "Feedback",
    
    // AI Feedback
    "aiFeedback.title": "AI Interview Feedback",
    "aiFeedback.analyze": "Analyze Feedback",
    "aiFeedback.sentiment": "Sentiment",
    "aiFeedback.technicalScore": "Technical Score",
    "aiFeedback.communicationScore": "Communication Score",
    "aiFeedback.recommendation": "Recommendation",
    
    // CRM
    "crm.title": "CRM Dashboard",
    "crm.interactions": "Interactions",
    "crm.campaigns": "Campaigns",
    "crm.engagement": "Engagement",
    "crm.touchpoints": "Touchpoints",
    
    // KSA Saudization & Compliance (CRITICAL DIFFERENTIATOR)
    "compliance.title": "Saudization Compliance",
    "compliance.nitaqat": "Nitaqat Status",
    "compliance.workforce": "Workforce Composition",
    "compliance.saudiEmployees": "Saudi Employees",
    "compliance.expatEmployees": "Expat Employees",
    "compliance.totalEmployees": "Total Employees",
    "compliance.saudizationPercentage": "Saudization Percentage",
    "compliance.nitaqatBand": "Nitaqat Band",
    "compliance.complianceGap": "Compliance Gap",
    "compliance.riskLevel": "Risk Level",
    "compliance.estimatedPenalty": "Estimated Penalty",
    "compliance.forecast": "Compliance Forecast",
    "compliance.whatIf": "What-If Analysis",
    "compliance.scenarioPlanning": "Scenario Planning",
    "compliance.alerts": "Compliance Alerts",
    "compliance.history": "Workforce History",
    "compliance.trend": "Trend Analysis",
    "compliance.projectedDate": "Projected Compliance Date",
    "compliance.requiredPercentage": "Required Percentage",
    "compliance.entitySize": "Entity Size",
    "compliance.activitySector": "Activity Sector",
    
    // Nitaqat Bands
    "band.platinum": "Platinum",
    "band.green": "Green",
    "band.yellow": "Yellow",
    "band.red": "Red",
    
    // Risk Levels
    "risk.low": "Low",
    "risk.medium": "Medium",
    "risk.high": "High",
    "risk.critical": "Critical",
    
    // Entity Sizes
    "entity.small": "Small (1-9 employees)",
    "entity.medium": "Medium (10-49 employees)",
    "entity.large": "Large (50-499 employees)",
    "entity.veryLarge": "Very Large (500+ employees)",
    
    // Sectors
    "sector.manufacturing": "Manufacturing",
    "sector.retail": "Retail",
    "sector.technology": "Technology",
    "sector.hospitality": "Hospitality",
    "sector.healthcare": "Healthcare",
    "sector.construction": "Construction",
    "sector.default": "Other",
    
    // Government Integration
    "gov.mhrsd": "MHRSD Integration",
    "gov.qiwa": "Qiwa Platform",
    "gov.mudad": "Mudad Contracts",
    "gov.absher": "Absher Verification",
    "gov.syncStatus": "Sync Status",
    "gov.lastSync": "Last Sync",
    "gov.syncNow": "Sync Now",
    "gov.reports": "Government Reports",
    "gov.workPermits": "Work Permits",
    "gov.contracts": "Employment Contracts",
  },
  
  ar: {
    // Common
    "common.welcome": "مرحباً",
    "common.dashboard": "لوحة التحكم",
    "common.candidates": "المرشحون",
    "common.interviews": "المقابلات",
    "common.reports": "التقارير",
    "common.settings": "الإعدادات",
    "common.logout": "تسجيل الخروج",
    "common.login": "تسجيل الدخول",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.add": "إضافة",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.export": "تصدير",
    "common.import": "استيراد",
    "common.loading": "جاري التحميل...",
    "common.error": "خطأ",
    "common.success": "نجاح",
    "common.confirm": "تأكيد",
    "common.yes": "نعم",
    "common.no": "لا",
    
    // Dashboard
    "dashboard.title": "لوحة التوظيف",
    "dashboard.totalCandidates": "إجمالي المرشحين",
    "dashboard.activeInterviews": "المقابلات النشطة",
    "dashboard.pendingReviews": "قيد المراجعة",
    "dashboard.recentActivity": "النشاط الأخير",
    
    // Candidates
    "candidates.title": "المرشحون",
    "candidates.addNew": "إضافة مرشح جديد",
    "candidates.name": "الاسم",
    "candidates.email": "البريد الإلكتروني",
    "candidates.phone": "الهاتف",
    "candidates.status": "الحالة",
    "candidates.appliedDate": "تاريخ التقديم",
    "candidates.position": "الوظيفة",
    
    // Interviews
    "interviews.title": "المقابلات",
    "interviews.schedule": "جدولة مقابلة",
    "interviews.date": "التاريخ",
    "interviews.time": "الوقت",
    "interviews.interviewer": "المُقابِل",
    "interviews.feedback": "التقييم",
    
    // AI Feedback
    "aiFeedback.title": "تقييم المقابلات الذكي",
    "aiFeedback.analyze": "تحليل التقييم",
    "aiFeedback.sentiment": "المشاعر",
    "aiFeedback.technicalScore": "الدرجة التقنية",
    "aiFeedback.communicationScore": "درجة التواصل",
    "aiFeedback.recommendation": "التوصية",
    
    // CRM
    "crm.title": "لوحة إدارة العلاقات",
    "crm.interactions": "التفاعلات",
    "crm.campaigns": "الحملات",
    "crm.engagement": "المشاركة",
    "crm.touchpoints": "نقاط الاتصال",
    
    // KSA Saudization & Compliance (ميزة تنافسية حاسمة)
    "compliance.title": "الامتثال للسعودة",
    "compliance.nitaqat": "حالة نطاقات",
    "compliance.workforce": "تكوين القوى العاملة",
    "compliance.saudiEmployees": "الموظفون السعوديون",
    "compliance.expatEmployees": "الموظفون الوافدون",
    "compliance.totalEmployees": "إجمالي الموظفين",
    "compliance.saudizationPercentage": "نسبة السعودة",
    "compliance.nitaqatBand": "نطاق نطاقات",
    "compliance.complianceGap": "فجوة الامتثال",
    "compliance.riskLevel": "مستوى المخاطر",
    "compliance.estimatedPenalty": "الغرامة المقدرة",
    "compliance.forecast": "توقعات الامتثال",
    "compliance.whatIf": "تحليل ماذا لو",
    "compliance.scenarioPlanning": "تخطيط السيناريوهات",
    "compliance.alerts": "تنبيهات الامتثال",
    "compliance.history": "تاريخ القوى العاملة",
    "compliance.trend": "تحليل الاتجاهات",
    "compliance.projectedDate": "تاريخ الامتثال المتوقع",
    "compliance.requiredPercentage": "النسبة المطلوبة",
    "compliance.entitySize": "حجم المنشأة",
    "compliance.activitySector": "قطاع النشاط",
    
    // Nitaqat Bands
    "band.platinum": "بلاتيني",
    "band.green": "أخضر",
    "band.yellow": "أصفر",
    "band.red": "أحمر",
    
    // Risk Levels
    "risk.low": "منخفض",
    "risk.medium": "متوسط",
    "risk.high": "عالي",
    "risk.critical": "حرج",
    
    // Entity Sizes
    "entity.small": "صغيرة (١-٩ موظفين)",
    "entity.medium": "متوسطة (١٠-٤٩ موظف)",
    "entity.large": "كبيرة (٥٠-٤٩٩ موظف)",
    "entity.veryLarge": "كبيرة جداً (٥٠٠+ موظف)",
    
    // Sectors
    "sector.manufacturing": "التصنيع",
    "sector.retail": "التجزئة",
    "sector.technology": "التقنية",
    "sector.hospitality": "الضيافة",
    "sector.healthcare": "الرعاية الصحية",
    "sector.construction": "البناء والتشييد",
    "sector.default": "أخرى",
    
    // Government Integration
    "gov.mhrsd": "تكامل وزارة الموارد البشرية",
    "gov.qiwa": "منصة قوى",
    "gov.mudad": "عقود مداد",
    "gov.absher": "التحقق عبر أبشر",
    "gov.syncStatus": "حالة المزامنة",
    "gov.lastSync": "آخر مزامنة",
    "gov.syncNow": "مزامنة الآن",
    "gov.reports": "التقارير الحكومية",
    "gov.workPermits": "تصاريح العمل",
    "gov.contracts": "عقود العمل",
  },
  
  fr: {
    // Common
    "common.welcome": "Bienvenue",
    "common.dashboard": "Tableau de bord",
    "common.candidates": "Candidats",
    "common.interviews": "Entretiens",
    "common.reports": "Rapports",
    "common.settings": "Paramètres",
    "common.logout": "Déconnexion",
    "common.login": "Connexion",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.add": "Ajouter",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.export": "Exporter",
    "common.import": "Importer",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.confirm": "Confirmer",
    "common.yes": "Oui",
    "common.no": "Non",
    
    // Dashboard
    "dashboard.title": "Tableau de bord de recrutement",
    "dashboard.totalCandidates": "Total des candidats",
    "dashboard.activeInterviews": "Entretiens actifs",
    "dashboard.pendingReviews": "En attente d'examen",
    "dashboard.recentActivity": "Activité récente",
    
    // Candidates
    "candidates.title": "Candidats",
    "candidates.addNew": "Ajouter un nouveau candidat",
    "candidates.name": "Nom",
    "candidates.email": "Email",
    "candidates.phone": "Téléphone",
    "candidates.status": "Statut",
    "candidates.appliedDate": "Date de candidature",
    "candidates.position": "Poste",
    
    // Interviews
    "interviews.title": "Entretiens",
    "interviews.schedule": "Planifier un entretien",
    "interviews.date": "Date",
    "interviews.time": "Heure",
    "interviews.interviewer": "Intervieweur",
    "interviews.feedback": "Retour",
    
    // AI Feedback
    "aiFeedback.title": "Retour d'entretien IA",
    "aiFeedback.analyze": "Analyser le retour",
    "aiFeedback.sentiment": "Sentiment",
    "aiFeedback.technicalScore": "Score technique",
    "aiFeedback.communicationScore": "Score de communication",
    "aiFeedback.recommendation": "Recommandation",
    
    // CRM
    "crm.title": "Tableau de bord CRM",
    "crm.interactions": "Interactions",
    "crm.campaigns": "Campagnes",
    "crm.engagement": "Engagement",
    "crm.touchpoints": "Points de contact",
  },
};

// Get translation
export function t(key: string, lang: Language = "en"): string {
  return translations[lang][key] || key;
}

// Format date based on language
export function formatDate(date: Date, lang: Language = "en"): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  
  const locales: Record<Language, string> = {
    en: "en-US",
    ar: "ar-SA",
    fr: "fr-FR",
  };
  
  return new Intl.DateTimeFormat(locales[lang], options).format(date);
}

// Format number based on language
export function formatNumber(num: number, lang: Language = "en"): string {
  const locales: Record<Language, string> = {
    en: "en-US",
    ar: "ar-SA",
    fr: "fr-FR",
  };
  
  return new Intl.NumberFormat(locales[lang]).format(num);
}
