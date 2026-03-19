import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es' | 'pt';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    loading: boolean;
}

const defaultTranslations = {
    es: {
        nav_home: "Inicio",
        nav_dashboard: "Dashboard",
        nav_pensum: "Pensum",
        nav_manifesto: "Manifiesto",
        nav_problem: "Problema",
        nav_pricing: "Precios",
        nav_soon: "SOON!",
        btn_login: "Entrar",
        btn_profile: "PERFIL",
        btn_logout: "Salir",
        register_title: "Crear Cuenta",
        btn_register_submit: "Registrarme",
        label_name: "Nombre",
        landing_hero_title: "Actualízate como persona, líder y co-creador",
        landing_hero_subtitle: "Deja de operar con una versión mental que ya no es compatible con el mundo actual.",
        landing_cta_button: "Explorar el Upgrade!",
        landing_problem_title: "El desfase no es técnico. Es mental.",
        landing_problem_desc: "Hoy no faltan herramientas. Falta claridad.",
        landing_what_title: "Qué es Upgrade!",
        landing_what_desc: "Upgrade! no es un curso. No es una certificación. No es motivación. Es un sistema de actualización personal, de liderazgo y de co-creación diseñado para el mundo actual.",
        landing_card_1_title: "Pensamiento, no dogma",
        landing_card_1_desc: "No te decimos qué pensar. Te enseñamos a pensar mejor.",
        landing_card_2_title: "Compatibilidad, no rapidez",
        landing_card_2_desc: "No prometemos rapidez. Prometemos compatibilidade real con el mundo actual.",
        landing_card_3_title: "Criterio, no fragilidad",
        landing_card_3_desc: "No formamos especialistas frágiles. Formamos personas con criterio duradero.",
        landing_upgrade0_badge: "Módulo Base",
        landing_upgrade0_subtitle: "Antes de cualquier eje, todas las personas pasan por aquí.",
        landing_upgrade0_desc: "Una experiencia que rompe la mentira fundamental: que puedes seguir operando igual en un mundo que ya cambió.",
        landing_upgrade0_highlight: "Sin Upgrade! 0, no hay Upgrade!.",
        landing_mentors_title: "Nuestros Mentores",
        landing_cta_title: "¿Listo para actualizar tu versión?",
        landing_cta_subtitle: "El mundo no espera. Tu evolución tampoco debería.",
        dashboard_status: "Estado del Sistema",
        dashboard_current_level: "Nivel Actual",
        dashboard_level_in_progress: "En Progreso",
        dashboard_level_uninitiated: "Sin Iniciar",
        dashboard_completed_on: "Completado el",
        dashboard_pending: "Pendiente",
        dashboard_retake: "Retomar Test",
        dashboard_start: "Iniciar Test",
        tab_journal: "Decision Journal",
        journal_title: "Decision Journal",
        journal_new_btn: "Nueva Decisión",
        journal_form_decision: "¿Qué estás decidiendo?",
        journal_form_context: "Contexto (¿Por qué?)",
        journal_form_outcome: "Resultado Esperado",
        journal_form_review: "Fecha de Revisión",
        journal_save: "Guardar Decisión",
        journal_no_entries: "No hay decisiones registradas aún.",
        journal_status_pending: "Pendiente",
        journal_status_reviewed: "Revisado",
        mentors_subtitle: "Mentes que han actualizado su propio sistema operativo.",
        dashboard_self_diagnostics: "Autodiagnóstico",
        dashboard_diagnostic_desc: "Ejecuta este diagnóstico para descubrir tu versión operativa actual en este dominio.",
        dashboard_score: "Puntaje:",
        dashboard_level: "Nivel:",
        dashboard_axis: "Eje",
        journal_log_new: "Registrar Nueva Decisión",
        journal_no_entries_dashboard: "No se encontraron entradas recientes en la memoria local.",
        pensum_title: "El Pensum",
        pensum_subtitle: "Tres ejes de transformación diseñados para actualizar cómo piensas, lideras y co-creas.",
        axis_human: "Upgrade Humano",
        axis_human_desc: "Antes de liderar a otros o co-crear con IA, necesitas gobernarte a ti mismo.",
        axis_leadership: "Upgrade de Liderazgo",
        axis_leadership_desc: "Liderar no es mandar. Es servir, diseñar contexto y dar paz.",
        axis_cocreation: "Upgrade de Co-creación",
        axis_cocreation_desc: "La inteligencia artificial no reemplaza criterio. Lo amplifica.",
        course_h1: "Ser",
        course_h2: "Hacer",
        course_h3: "Tener",
        course_h4: "Transcender",
        course_l1: "Mindset de líder servidor",
        course_l2: "Interacción humana",
        course_l3: "Sistemas y decisiones",
        course_l4: "Desarrollo de personas",
        course_c1: "Mindset de co-creador",
        course_c2: "Lenguaje y dirección",
        course_c3: "Co-creación aplicada",
        course_c4: "Responsabilidad",
        login_title: "Ingresar",
        label_email: "Email",
        label_password: "Contraseña",
        btn_login_submit: "Entrar",
        welcome_user: "Bienvenido, ",
        level_basic: "Nivel Básico",
        level_inter: "Nivel Intermedio",
        level_adv: "Nivel Avanzado",
        level_compat: "Nivel Compatible",
        test_intro: "Este no es un examen. Es un diagnóstico. Responde con honestidad radical.",
        btn_next: "Siguiente",
        btn_finish: "Finalizar",
    },
    en: {
        nav_home: "Home",
        nav_dashboard: "Dashboard",
        nav_pensum: "Curriculum",
        nav_manifesto: "Manifesto",
        nav_problem: "Problem",
        nav_pricing: "Pricing",
        nav_soon: "SOON!",
        btn_login: "Login",
        btn_profile: "PROFILE",
        btn_logout: "Logout",
        register_title: "Create Account",
        btn_register_submit: "Sign Up",
        label_name: "Name",
        landing_hero_title: "Upgrade yourself as a person, leader, and co-creator",
        landing_hero_subtitle: "Stop operating with a mental version that is no longer compatible with the current world.",
        landing_cta_button: "Explore the Upgrade!",
        landing_problem_title: "The gap isn't technical. It's mental.",
        landing_problem_desc: "Today there is no lack of tools. There is a lack of clarity.",
        landing_what_title: "What is Upgrade!",
        landing_what_desc: "Upgrade! is not a course. It's not a certification. It's not motivation. It is a system of personal, leadership, and co-creation updates designed for the current world.",
        landing_card_1_title: "Thinking, not dogma",
        landing_card_1_desc: "We don't tell you what to think. We teach you to think better.",
        landing_card_2_title: "Compatibility, not speed",
        landing_card_2_desc: "We don't promise speed. We promise real compatibility with the current world.",
        landing_card_3_title: "Criteria, not fragility",
        landing_card_3_desc: "We don't train fragile specialists. We train people with lasting criteria.",
        landing_upgrade0_badge: "Base Module",
        landing_upgrade0_subtitle: "Before any axis, everyone passes through here.",
        landing_upgrade0_desc: "An experience that breaks the fundamental lie: that you can keep operating the same in a world that has already changed.",
        landing_upgrade0_highlight: "Without Upgrade! 0, there is no Upgrade!.",
        landing_mentors_title: "Our Mentors",
        landing_cta_title: "The world won't slow down.",
        landing_cta_subtitle: "The question is if you are going to update yourself.",
        dashboard_status: "System Status",
        dashboard_current_level: "Current Level",
        dashboard_level_in_progress: "In Progress",
        dashboard_level_uninitiated: "Uninitiated",
        dashboard_completed_on: "Completed on",
        dashboard_pending: "Pending",
        dashboard_retake: "Retake Test",
        dashboard_start: "Start Test",
        tab_journal: "Decision Journal",
        journal_title: "Decision Journal",
        journal_new_btn: "New Decision",
        journal_form_decision: "What are you deciding?",
        journal_form_context: "Context (Why?)",
        journal_form_outcome: "Expected Outcome",
        journal_form_review: "Review Date",
        journal_save: "Save Decision",
        journal_no_entries: "No decisions recorded yet.",
        journal_status_pending: "Pending",
        journal_status_reviewed: "Reviewed",
        mentors_subtitle: "Minds that have updated their own operating system.",
        dashboard_self_diagnostics: "Self Diagnostics",
        dashboard_diagnostic_desc: "Run this diagnostic to uncover your current operating version in this domain.",
        dashboard_score: "Score:",
        dashboard_level: "Level:",
        dashboard_axis: "Axis",
        journal_log_new: "Log New Decision",
        journal_no_entries_dashboard: "No recent entries found in local memory.",
        pensum_title: "The Curriculum",
        pensum_subtitle: "Three axes of transformation designed to update how you think, lead, and co-create.",
        axis_human: "Human Upgrade",
        axis_human_desc: "Before leading others or co-creating with IA, you need to govern yourself.",
        axis_leadership: "Leadership Upgrade",
        axis_leadership_desc: "Leading is not commanding. It is serving, designing context, and giving peace.",
        axis_cocreation: "Co-creation Upgrade",
        axis_cocreation_desc: "Artificial intelligence does not replace criteria. It amplifies it.",
        course_h1: "Being",
        course_h2: "Doing",
        course_h3: "Having",
        course_h4: "Transcending",
        course_l1: "Servant Leader Mindset",
        course_l2: "Human Interaction",
        course_l3: "Systems and Decisions",
        course_l4: "People Development",
        course_c1: "Co-creator Mindset",
        course_c2: "Language and Direction",
        course_c3: "Applied Co-creation",
        course_c4: "Responsibility",
        login_title: "Login",
        label_email: "Email",
        label_password: "Password",
        btn_login_submit: "Enter",
        welcome_user: "Welcome, ",
        level_basic: "Basic Level",
        level_inter: "Intermediate Level",
        level_adv: "Advanced Level",
        level_compat: "Compatible Level",
        test_intro: "This is not an exam. It is a diagnosis. Answer with radical honesty.",
        btn_next: "Next",
        btn_finish: "Finish",
    },
    pt: {
        nav_home: "Início",
        nav_dashboard: "Dashboard",
        nav_pensum: "Currículo",
        nav_manifesto: "Manifesto",
        nav_problem: "Problema",
        nav_pricing: "Preços",
        nav_soon: "SOON!",
        btn_login: "Entrar",
        btn_profile: "PERFIL",
        btn_logout: "Sair",
        register_title: "Criar Conta",
        btn_register_submit: "Cadastrar",
        label_name: "Nome",
        landing_hero_title: "Atualize-se como pessoa, líder e co-criador",
        landing_hero_subtitle: "Pare de operar com uma versão mental que não é mais compatível com o mundo atual.",
        landing_cta_button: "Explorar o Upgrade!",
        landing_problem_title: "A defasagem não é técnica. É mental.",
        landing_problem_desc: "Hoje não faltam ferramentas. Falta clareza.",
        landing_what_title: "O que é Upgrade!",
        landing_what_desc: "Upgrade! não é um curso. Não é uma certificação. Não é motivação. É um sistema de atualização pessoal, de liderança e de co-criação projetado para o mundo atual.",
        landing_card_1_title: "Pensamento, não dogma",
        landing_card_1_desc: "Não dizemos o que pensar. Ensinamos a pensar melhor.",
        landing_card_2_title: "Compatibilidade, não rapidez",
        landing_card_2_desc: "Não prometemos rapidez. Prometemos compatibilidade real com o mundo atual.",
        landing_card_3_title: "Critério, não fragilidade",
        landing_card_3_desc: "Não formamos especialistas frágeis. Formamos pessoas com critério duradouro.",
        landing_upgrade0_badge: "Módulo Base",
        landing_upgrade0_subtitle: "Antes de qualquer eixo, todas as pessoas passam por aqui.",
        landing_upgrade0_desc: "Uma experiência que quebra a mentira fundamental: que você pode continuar operando igual em um mundo que já mudou.",
        landing_upgrade0_highlight: "Sem Upgrade! 0, não há Upgrade!.",
        landing_mentors_title: "Nossos Mentores",
        landing_cta_title: "O mundo não vai desacelerar.",
        landing_cta_subtitle: "A pergunta é se você vai se atualizar.",
        dashboard_status: "Status do Sistema",
        dashboard_current_level: "Nível Atual",
        dashboard_level_in_progress: "Em Progresso",
        dashboard_level_uninitiated: "Não Iniciado",
        dashboard_completed_on: "Concluído em",
        dashboard_pending: "Pendente",
        dashboard_retake: "Refazer Teste",
        dashboard_start: "Iniciar Teste",
        tab_journal: "Decision Journal",
        journal_title: "Decision Journal",
        journal_new_btn: "Nova Decisão",
        journal_form_decision: "O que você está decidindo?",
        journal_form_context: "Contexto (Por que?)",
        journal_form_outcome: "Resultado Esperado",
        journal_form_review: "Data de Revisão",
        journal_save: "Salvar Decisão",
        journal_no_entries: "Nenhuma decisão registrada ainda.",
        journal_status_pending: "Pendente",
        journal_status_reviewed: "Revisado",
        mentors_subtitle: "Mentes que atualizaram seu próprio sistema operacional.",
        dashboard_self_diagnostics: "Autodiagnóstico",
        dashboard_diagnostic_desc: "Execute este diagnóstico para descobrir sua versão operacional atual neste domínio.",
        dashboard_score: "Pontuação:",
        dashboard_level: "Nível:",
        dashboard_axis: "Eixo",
        journal_log_new: "Registrar Nova Decisão",
        journal_no_entries_dashboard: "Nenhuma entrada recente encontrada na memória local.",
        pensum_title: "O Currículo",
        pensum_subtitle: "Três eixos de transformação projetados para atualizar como você pensa, lidera e co-cria.",
        axis_human: "Upgrade Humano",
        axis_human_desc: "Antes de liderar outros ou co-criar com IA, você precisa governar a si mesmo.",
        axis_leadership: "Upgrade de Liderança",
        axis_leadership_desc: "Liderar não é mandar. É servir, projetar contexto e dar paz.",
        axis_cocreation: "Upgrade de Co-criação",
        axis_cocreation_desc: "A inteligência artificial não substitui critério. Ela o amplifica.",
        course_h1: "Ser",
        course_h2: "Fazer",
        course_h3: "Ter",
        course_h4: "Transcender",
        course_l1: "Mindset de líder servidor",
        course_l2: "Interação humana",
        course_l3: "Sistemas e decisões",
        course_l4: "Desenvolvimento de pessoas",
        course_c1: "Mindset de co-criador",
        course_c2: "Linguagem e direção",
        course_c3: "Co-criação aplicada",
        course_c4: "Responsabilidade",
        login_title: "Entrar",
        label_email: "Email",
        label_password: "Senha",
        btn_login_submit: "Entrar",
        welcome_user: "Bem-vindo, ",
        level_basic: "Nível Básico",
        level_inter: "Nível Intermediário",
        level_adv: "Nível Avanzado",
        level_compat: "Nível Compatível",
        test_intro: "Isto não é um exame. É um diagnóstico. Responda com honestidade radical.",
        btn_next: "Próximo",
        btn_finish: "Finalizar",
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [translations, setTranslations] = useState<Record<string, string>>(defaultTranslations.en);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load saved language or default
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, []);

    useEffect(() => {
        setTranslations(defaultTranslations[language]);
        localStorage.setItem('language', language);
    }, [language]);

    const setLanguage = (lang: Language) => {
        console.log("Setting language to:", lang);
        setLanguageState(lang);
    };

    const t = (key: string) => {
        if (!translations) {
            console.warn("Translations object is undefined");
            return key;
        }
        if (!translations[key]) {
            // Only warn periodically or for unique keys to avoid spam, but for now log it
            // console.warn(`Missing translation for: ${key} in ${language}`);
            return key;
        }
        return translations[key];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
