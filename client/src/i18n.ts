import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  ar: {
    translation: {
      // Navigation
      'nav.dashboard': 'لوحة التحكم',
      'nav.candidates': 'المرشحون',
      'nav.interviews': 'المقابلات',
      'nav.analytics': 'التحليلات',
      'nav.settings': 'الإعدادات',
      'nav.campaigns': 'الحملات',
      'nav.sourcing': 'البحث عن المرشحين',
      'nav.scheduling': 'الجدولة الذكية',
      'nav.communication': 'مركز الاتصالات',
      'nav.compliance': 'الامتثال',
      'nav.logout': 'تسجيل الخروج',

      // Common
      'common.loading': 'جاري التحميل...',
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.view': 'عرض',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.export': 'تصدير',
      'common.import': 'استيراد',
      'common.submit': 'إرسال',
      'common.back': 'رجوع',
      'common.next': 'التالي',
      'common.previous': 'السابق',
      'common.confirm': 'تأكيد',
      'common.success': 'نجح',
      'common.error': 'خطأ',
      'common.warning': 'تحذير',
      'common.info': 'معلومات',

      // Dashboard
      'dashboard.welcome': 'مرحباً بك في نظام التوظيف الذكي',
      'dashboard.totalCandidates': 'إجمالي المرشحين',
      'dashboard.activeInterviews': 'المقابلات النشطة',
      'dashboard.pendingApplications': 'الطلبات المعلقة',
      'dashboard.recentActivity': 'النشاط الأخير',

      // Candidates
      'candidates.title': 'إدارة المرشحين',
      'candidates.addNew': 'إضافة مرشح جديد',
      'candidates.name': 'الاسم',
      'candidates.email': 'البريد الإلكتروني',
      'candidates.phone': 'الهاتف',
      'candidates.status': 'الحالة',
      'candidates.position': 'الوظيفة',
      'candidates.experience': 'الخبرة',
      'candidates.skills': 'المهارات',
      'candidates.resume': 'السيرة الذاتية',
      'candidates.notes': 'ملاحظات',

      // Interviews
      'interviews.title': 'إدارة المقابلات',
      'interviews.schedule': 'جدولة مقابلة',
      'interviews.date': 'التاريخ',
      'interviews.time': 'الوقت',
      'interviews.interviewer': 'المُقابل',
      'interviews.type': 'النوع',
      'interviews.status': 'الحالة',
      'interviews.feedback': 'التقييم',
      'interviews.video': 'مقابلة فيديو',
      'interviews.phone': 'مقابلة هاتفية',
      'interviews.inPerson': 'مقابلة شخصية',

      // Smart Scheduling
      'scheduling.title': 'الجدولة الذكية للمقابلات',
      'scheduling.suggestions': 'الاقتراحات',
      'scheduling.preferences': 'التفضيلات',
      'scheduling.conflicts': 'التعارضات',
      'scheduling.history': 'السجل',
      'scheduling.confidence': 'درجة الثقة',
      'scheduling.accept': 'قبول',
      'scheduling.reject': 'رفض',

      // Communication
      'communication.title': 'مركز الاتصالات',
      'communication.email': 'البريد الإلكتروني',
      'communication.sms': 'رسالة نصية',
      'communication.whatsapp': 'واتساب',
      'communication.send': 'إرسال',
      'communication.template': 'قالب',
      'communication.history': 'السجل',

      // Campaigns
      'campaigns.title': 'الحملات الآلية',
      'campaigns.create': 'إنشاء حملة',
      'campaigns.name': 'اسم الحملة',
      'campaigns.status': 'الحالة',
      'campaigns.performance': 'الأداء',
      'campaigns.analytics': 'التحليلات',

      // Language Switcher
      'language.select': 'اختر اللغة',
      'language.ar': 'العربية',
      'language.en': 'English',
      'language.fr': 'Français',
    },
  },
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.candidates': 'Candidates',
      'nav.interviews': 'Interviews',
      'nav.analytics': 'Analytics',
      'nav.settings': 'Settings',
      'nav.campaigns': 'Campaigns',
      'nav.sourcing': 'Sourcing',
      'nav.scheduling': 'Smart Scheduling',
      'nav.communication': 'Communication Hub',
      'nav.compliance': 'Compliance',
      'nav.logout': 'Logout',

      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.view': 'View',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.import': 'Import',
      'common.submit': 'Submit',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.confirm': 'Confirm',
      'common.success': 'Success',
      'common.error': 'Error',
      'common.warning': 'Warning',
      'common.info': 'Info',

      // Dashboard
      'dashboard.welcome': 'Welcome to Oracle Smart Recruitment',
      'dashboard.totalCandidates': 'Total Candidates',
      'dashboard.activeInterviews': 'Active Interviews',
      'dashboard.pendingApplications': 'Pending Applications',
      'dashboard.recentActivity': 'Recent Activity',

      // Candidates
      'candidates.title': 'Candidate Management',
      'candidates.addNew': 'Add New Candidate',
      'candidates.name': 'Name',
      'candidates.email': 'Email',
      'candidates.phone': 'Phone',
      'candidates.status': 'Status',
      'candidates.position': 'Position',
      'candidates.experience': 'Experience',
      'candidates.skills': 'Skills',
      'candidates.resume': 'Resume',
      'candidates.notes': 'Notes',

      // Interviews
      'interviews.title': 'Interview Management',
      'interviews.schedule': 'Schedule Interview',
      'interviews.date': 'Date',
      'interviews.time': 'Time',
      'interviews.interviewer': 'Interviewer',
      'interviews.type': 'Type',
      'interviews.status': 'Status',
      'interviews.feedback': 'Feedback',
      'interviews.video': 'Video Interview',
      'interviews.phone': 'Phone Interview',
      'interviews.inPerson': 'In-Person Interview',

      // Smart Scheduling
      'scheduling.title': 'Smart Interview Scheduling',
      'scheduling.suggestions': 'Suggestions',
      'scheduling.preferences': 'Preferences',
      'scheduling.conflicts': 'Conflicts',
      'scheduling.history': 'History',
      'scheduling.confidence': 'Confidence Score',
      'scheduling.accept': 'Accept',
      'scheduling.reject': 'Reject',

      // Communication
      'communication.title': 'Communication Hub',
      'communication.email': 'Email',
      'communication.sms': 'SMS',
      'communication.whatsapp': 'WhatsApp',
      'communication.send': 'Send',
      'communication.template': 'Template',
      'communication.history': 'History',

      // Campaigns
      'campaigns.title': 'Automated Campaigns',
      'campaigns.create': 'Create Campaign',
      'campaigns.name': 'Campaign Name',
      'campaigns.status': 'Status',
      'campaigns.performance': 'Performance',
      'campaigns.analytics': 'Analytics',

      // Language Switcher
      'language.select': 'Select Language',
      'language.ar': 'العربية',
      'language.en': 'English',
      'language.fr': 'Français',
    },
  },
  fr: {
    translation: {
      // Navigation
      'nav.dashboard': 'Tableau de bord',
      'nav.candidates': 'Candidats',
      'nav.interviews': 'Entretiens',
      'nav.analytics': 'Analytique',
      'nav.settings': 'Paramètres',
      'nav.campaigns': 'Campagnes',
      'nav.sourcing': 'Sourcing',
      'nav.scheduling': 'Planification intelligente',
      'nav.communication': 'Centre de communication',
      'nav.compliance': 'Conformité',
      'nav.logout': 'Déconnexion',

      // Common
      'common.loading': 'Chargement...',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.view': 'Voir',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.export': 'Exporter',
      'common.import': 'Importer',
      'common.submit': 'Soumettre',
      'common.back': 'Retour',
      'common.next': 'Suivant',
      'common.previous': 'Précédent',
      'common.confirm': 'Confirmer',
      'common.success': 'Succès',
      'common.error': 'Erreur',
      'common.warning': 'Avertissement',
      'common.info': 'Info',

      // Dashboard
      'dashboard.welcome': 'Bienvenue dans Oracle Smart Recruitment',
      'dashboard.totalCandidates': 'Total des candidats',
      'dashboard.activeInterviews': 'Entretiens actifs',
      'dashboard.pendingApplications': 'Candidatures en attente',
      'dashboard.recentActivity': 'Activité récente',

      // Candidates
      'candidates.title': 'Gestion des candidats',
      'candidates.addNew': 'Ajouter un nouveau candidat',
      'candidates.name': 'Nom',
      'candidates.email': 'Email',
      'candidates.phone': 'Téléphone',
      'candidates.status': 'Statut',
      'candidates.position': 'Poste',
      'candidates.experience': 'Expérience',
      'candidates.skills': 'Compétences',
      'candidates.resume': 'CV',
      'candidates.notes': 'Notes',

      // Interviews
      'interviews.title': 'Gestion des entretiens',
      'interviews.schedule': 'Planifier un entretien',
      'interviews.date': 'Date',
      'interviews.time': 'Heure',
      'interviews.interviewer': 'Intervieweur',
      'interviews.type': 'Type',
      'interviews.status': 'Statut',
      'interviews.feedback': 'Feedback',
      'interviews.video': 'Entretien vidéo',
      'interviews.phone': 'Entretien téléphonique',
      'interviews.inPerson': 'Entretien en personne',

      // Smart Scheduling
      'scheduling.title': 'Planification intelligente des entretiens',
      'scheduling.suggestions': 'Suggestions',
      'scheduling.preferences': 'Préférences',
      'scheduling.conflicts': 'Conflits',
      'scheduling.history': 'Historique',
      'scheduling.confidence': 'Score de confiance',
      'scheduling.accept': 'Accepter',
      'scheduling.reject': 'Rejeter',

      // Communication
      'communication.title': 'Centre de communication',
      'communication.email': 'Email',
      'communication.sms': 'SMS',
      'communication.whatsapp': 'WhatsApp',
      'communication.send': 'Envoyer',
      'communication.template': 'Modèle',
      'communication.history': 'Historique',

      // Campaigns
      'campaigns.title': 'Campagnes automatisées',
      'campaigns.create': 'Créer une campagne',
      'campaigns.name': 'Nom de la campagne',
      'campaigns.status': 'Statut',
      'campaigns.performance': 'Performance',
      'campaigns.analytics': 'Analytique',

      // Language Switcher
      'language.select': 'Sélectionner la langue',
      'language.ar': 'العربية',
      'language.en': 'English',
      'language.fr': 'Français',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
