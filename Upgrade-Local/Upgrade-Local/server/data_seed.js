const mentorsData = [
    {
        id: "tuyo",
        name: "Tuyo Isaza",
        roleKey: "mentor_tuyo_role",
        descKey: "mentor_tuyo_desc",
        img: "img/mentor_tuyo.png"
    },
    {
        id: "juan",
        name: "Juan Alvarez",
        roleKey: "mentor_juan_role",
        descKey: "mentor_juan_desc",
        img: "img/mentor_juan.png"
    },
    {
        id: "camilo",
        name: "Camilo Vera",
        roleKey: "mentor_camilo_role",
        descKey: "mentor_camilo_desc",
        img: "img/mentor_camilo.png"
    },
    {
        id: "andres",
        name: "Andrés Jaramillo",
        roleKey: "mentor_andres_role",
        descKey: "mentor_andres_desc",
        img: "img/mentor_placeholders.png"
    }
];

const translations = {
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

        // Landing
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
        landing_card_2_desc: "No prometemos rapidez. Prometemos compatibilidad real con el mundo actual.",
        landing_card_3_title: "Criterio, no fragilidad",
        landing_card_3_desc: "No formamos especialistas frágiles. Formamos personas con criterio duradero.",
        landing_upgrade0_badge: "Módulo Base",
        landing_upgrade0_subtitle: "Antes de cualquier eje, todas las personas pasan por aquí.",
        landing_upgrade0_desc: "Una experiencia que rompe la mentira fundamental: que puedes seguir operando igual en un mundo que ya cambió.",
        landing_upgrade0_highlight: "Sin Upgrade! 0, no hay Upgrade!.",
        landing_mentors_title: "Nuestros Mentores",
        landing_cta_title: "¿Listo para actualizar tu versión?",
        landing_cta_subtitle: "El mundo no espera. Tu evolución tampoco debería.",

        // Dashboard
        dashboard_status: "Estado del Sistema",
        dashboard_current_level: "Nivel Actual",
        dashboard_level_in_progress: "En Progreso",
        dashboard_level_uninitiated: "Sin Iniciar",
        dashboard_completed_on: "Completado el",
        dashboard_pending: "Pendiente",
        dashboard_retake: "Retomar Test",
        dashboard_start: "Iniciar Test",

        // Journal
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

        // Shared / Other
        mentors_subtitle: "Mentes que han actualizado su propio sistema operativo.",
        
        // Pensum (Page)
        pensum_title: "El Pensum",
        pensum_subtitle: "Tres ejes de transformación diseñados para actualizar cómo piensas, lideras y co-creas.",
        axis_human: "Upgrade Humano",
        axis_human_desc: "Antes de liderar a otros o co-crear con IA, necesitas gobernarte a ti mismo.",
        axis_leadership: "Upgrade de Liderazgo",
        axis_leadership_desc: "Liderar no es mandar. Es servir, diseñar contexto y dar paz.",
        axis_cocreation: "Upgrade de Co-creación",
        axis_cocreation_desc: "La inteligencia artificial no reemplaza criterio. Lo amplifica.",

        // Courses List Keys
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

        // Auth
        login_title: "Ingresar",
        label_email: "Email",
        label_password: "Contraseña",
        btn_login_submit: "Entrar",
        welcome_user: "Bienvenido, ",

        // Test Feedback
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

        // Landing
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

        // Dashboard
        dashboard_status: "System Status",
        dashboard_current_level: "Current Level",
        dashboard_level_in_progress: "In Progress",
        dashboard_level_uninitiated: "Uninitiated",
        dashboard_completed_on: "Completed on",
        dashboard_pending: "Pending",
        dashboard_retake: "Retake Test",
        dashboard_start: "Start Test",

        // Journal
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

        // Shared
        mentors_subtitle: "Minds that have updated their own operating system.",

        // Pensum
        pensum_title: "The Curriculum",
        pensum_subtitle: "Three axes of transformation designed to update how you think, lead, and co-create.",
        axis_human: "Human Upgrade",
        axis_human_desc: "Before leading others or co-creating with IA, you need to govern yourself.",
        axis_leadership: "Leadership Upgrade",
        axis_leadership_desc: "Leading is not commanding. It is serving, designing context, and giving peace.",
        axis_cocreation: "Co-creation Upgrade",
        axis_cocreation_desc: "Artificial intelligence does not replace criteria. It amplifies it.",

        // Courses List
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

        // Auth
        login_title: "Login",
        label_email: "Email",
        label_password: "Password",
        btn_login_submit: "Enter",
        welcome_user: "Welcome, ",

        // Test Feedback
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

        // Landing
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

        // Dashboard
        dashboard_status: "Status do Sistema",
        dashboard_current_level: "Nível Atual",
        dashboard_level_in_progress: "Em Progresso",
        dashboard_level_uninitiated: "Não Iniciado",
        dashboard_completed_on: "Concluído em",
        dashboard_pending: "Pendente",
        dashboard_retake: "Refazer Teste",
        dashboard_start: "Iniciar Teste",

        // Journal
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

        // Shared
        mentors_subtitle: "Mentes que atualizaram seu próprio sistema operacional.",

        // Pensum
        pensum_title: "O Currículo",
        pensum_subtitle: "Três eixos de transformação projetados para atualizar como você pensa, lidera e co-cria.",
        axis_human: "Upgrade Humano",
        axis_human_desc: "Antes de liderar outros ou co-criar com IA, você precisa governar a si mesmo.",
        axis_leadership: "Upgrade de Liderança",
        axis_leadership_desc: "Liderar não é mandar. É servir, projetar contexto e dar paz.",
        axis_cocreation: "Upgrade de Co-criação",
        axis_cocreation_desc: "A inteligência artificial não substitui critério. Ela o amplifica.",

        // Courses List
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

        // Auth
        login_title: "Entrar",
        label_email: "Email",
        label_password: "Senha",
        btn_login_submit: "Entrar",
        welcome_user: "Bem-vindo, ",

        // Test Feedback
        level_basic: "Nível Básico",
        level_inter: "Nível Intermediário",
        level_adv: "Nível Avanzado",
        level_compat: "Nível Compatível",
        test_intro: "Isto não é um exame. É um diagnóstico. Responda com honestidade radical.",
        btn_next: "Próximo",
        btn_finish: "Finalizar",
    },
};

// Global Data
// Detailed Pensum Curriculum
const pensum = {
    human: {
        id: 'human',
        title_key: 'axis_human',
        desc_key: 'axis_human_desc',
        categories: [
            {
                id: 'cat_h_identity',
                title: "Identidad y Conciencia",
                courses: [
                    { id: 'h_metrics', title: "Identidad sin roles", duration: "60 min", desc: "Quién eres cuando no eres tus roles.", syllabus: _standardSyllabus() },
                    { id: 'h_conscjousness', title: "Conciencia vs. mente", duration: "60 min", desc: "Distinguir el observador del ruido mental.", syllabus: _standardSyllabus() },
                    { id: 'h_observer', title: "El observador interno", duration: "60 min", desc: "Desarrollar la capacidad de auto-observación.", syllabus: _standardSyllabus() },
                    { id: 'h_ego', title: "Ego funcional vs. ego reactivo", duration: "60 min", desc: "Hacer del ego una herramienta, no un amo.", syllabus: _standardSyllabus() },
                    { id: 'h_decider', title: "Quién decide cuando decides", duration: "60 min", desc: "Autonomía real en la toma de decisiones.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_h_body',
                title: "Cuerpo, Mente y Energía",
                courses: [
                    { id: 'h_body_decision', title: "El cuerpo como fuente de decisión", duration: "60 min", desc: "Inteligencia somática aplicada.", syllabus: _standardSyllabus() },
                    { id: 'h_energy_time', title: "Energía vs. tiempo", duration: "60 min", desc: "La verdadera moneda de productividad.", syllabus: _standardSyllabus() },
                    { id: 'h_states', title: "Estados internos y desempeño", duration: "60 min", desc: "Gestión de estados para alto rendimiento.", syllabus: _standardSyllabus() },
                    { id: 'h_selfcare', title: "Autocuidado sin autoindulgencia", duration: "60 min", desc: "Sostenibilidad personal real.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_h_resp',
                title: "Responsabilidad y Autogobierno",
                courses: [
                    { id: 'h_radical_resp', title: "Responsabilidad radical", duration: "60 min", desc: "Dejar de ser víctima de las circunstancias.", syllabus: _standardSyllabus() },
                    { id: 'h_resp_react', title: "Respuesta vs. reacción", duration: "60 min", desc: "Crear espacio entre estímulo y respuesta.", syllabus: _standardSyllabus() },
                    { id: 'h_bounds', title: "Límites personales", duration: "60 min", desc: "Definir qué entra y qué sale de tu vida.", syllabus: _standardSyllabus() },
                    { id: 'h_auth', title: "Autoridad interna", duration: "60 min", desc: "Validación propia vs. validación externa.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_h_design',
                title: "Diseño de Vida (Tener)",
                courses: [
                    { id: 'h_vision', title: "Visión personal", duration: "60 min", desc: "Dirección clara sin rigidez.", syllabus: _standardSyllabus() },
                    { id: 'h_decisions', title: "Decisiones acumulativas", duration: "60 min", desc: "El poder del interés compuesto en decisiones.", syllabus: _standardSyllabus() },
                    { id: 'h_plan', title: "Planificación consciente", duration: "60 min", desc: "Estructura que libera.", syllabus: _standardSyllabus() },
                    { id: 'h_expect', title: "Expectativas realistas", duration: "60 min", desc: "Alineación con la realidad.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_h_meaning',
                title: "Sentido y Trascendencia",
                courses: [
                    { id: 'h_giants', title: "Pensar sobre hombros de gigantes", duration: "60 min", desc: "Aprovechar la sabiduría acumulada.", syllabus: _standardSyllabus() },
                    { id: 'h_ethics', title: "Ética personal aplicada", duration: "60 min", desc: "Coherencia en situaciones difíciles.", syllabus: _standardSyllabus() },
                    { id: 'h_transcend', title: "Trascendencia sin misticismo", duration: "60 min", desc: "Conexión con algo mayor de forma práctica.", syllabus: _standardSyllabus() },
                    { id: 'h_impact', title: "Impacto a largo plazo", duration: "60 min", desc: "Legado y construcción de futuro.", syllabus: _standardSyllabus() }
                ]
            }
        ]
    },
    leadership: {
        id: 'leadership',
        title_key: 'axis_leadership',
        desc_key: 'axis_leadership_desc',
        categories: [
            {
                id: 'cat_l_mindset',
                title: "Mindset de Líder Servidor",
                courses: [
                    { id: 'l_serve', title: "Liderar es servir", duration: "60 min", desc: "El cambio de paradigma fundamental.", syllabus: _standardSyllabus() },
                    { id: 'l_auth_control', title: "Autoridad sin control", duration: "60 min", desc: "Influencia vs. imposición.", syllabus: _standardSyllabus() },
                    { id: 'l_ego_press', title: "Ego bajo presión", duration: "60 min", desc: "Gestión del ego en crisis.", syllabus: _standardSyllabus() },
                    { id: 'l_humility', title: "Humildad operativa", duration: "60 min", desc: "Aprender de todos, siempre.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_l_conv',
                title: "Conversaciones y Relación Humana",
                courses: [
                    { id: 'l_hard_conv', title: "Conversaciones difíciles", duration: "60 min", desc: "Navegar el conflicto con gracia.", syllabus: _standardSyllabus() },
                    { id: 'l_active_listen', title: "Escucha activa", duration: "60 min", desc: "Escuchar para entender, no para responder.", syllabus: _standardSyllabus() },
                    { id: 'l_conflict', title: "Conflicto productivo", duration: "60 min", desc: "Diferencias como motor de innovación.", syllabus: _standardSyllabus() },
                    { id: 'l_feedback', title: "Dar y recibir feedback", duration: "60 min", desc: "El desayuno de los campeones.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_l_peace',
                title: "Paz Operativa y Contexto Seguro",
                courses: [
                    { id: 'l_peace', title: "Dar paz como líder", duration: "60 min", desc: "El líder como termostato emocional.", syllabus: _standardSyllabus() },
                    { id: 'l_safety', title: "Seguridad psicológica", duration: "60 min", desc: "Crear un entorno seguro para fallar y aprender.", syllabus: _standardSyllabus() },
                    { id: 'l_noise', title: "Ruido vs. foco", duration: "60 min", desc: "Eliminar distracciones sistémicas.", syllabus: _standardSyllabus() },
                    { id: 'l_clarity', title: "Claridad de expectativas", duration: "60 min", desc: "La base de la ejecución impecable.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_l_systems',
                title: "Diseño de Sistemas y Decisiones",
                courses: [
                    { id: 'l_roles', title: "Diseño de roles", duration: "60 min", desc: "Definir quién hace qué con claridad.", syllabus: _standardSyllabus() },
                    { id: 'l_decisions', title: "Toma de decisiones bajo incertidumbre", duration: "60 min", desc: "Avanzar sin tener toda la información.", syllabus: _standardSyllabus() },
                    { id: 'l_processes', title: "Procesos mínimos efectivos", duration: "60 min", desc: "Burocracia cero, orden máximo.", syllabus: _standardSyllabus() },
                    { id: 'l_delegate', title: "Delegar sin abandonar", duration: "60 min", desc: "Empoderamiento real con soporte.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_l_people',
                title: "Desarrollo de Personas",
                courses: [
                    { id: 'l_accompany', title: "Acompañar sin rescatar", duration: "60 min", desc: "Desarrollar autonomía en otros.", syllabus: _standardSyllabus() },
                    { id: 'l_talent', title: "Desarrollo de talento", duration: "60 min", desc: "Identificar y potenciar fortalezas.", syllabus: _standardSyllabus() },
                    { id: 'l_eval', title: "Evaluación justa", duration: "60 min", desc: "Medir lo que importa.", syllabus: _standardSyllabus() },
                    { id: 'l_exit', title: "Salidas sanas", duration: "60 min", desc: "Desvincular con humanidad y respeto.", syllabus: _standardSyllabus() }
                ]
            }
        ]
    },
    cocreation: {
        id: 'cocreation',
        title_key: 'axis_cocreation',
        desc_key: 'axis_cocreation_desc',
        categories: [
            {
                id: 'cat_c_mindset',
                title: "Mindset de Co-creador",
                courses: [
                    { id: 'c_magic', title: "IA no es magia", duration: "60 min", desc: "Desmitificar la tecnología.", syllabus: _standardSyllabus() },
                    { id: 'c_orch', title: "Usuario vs. orquestador", duration: "60 min", desc: "Cambio de rol fundamental.", syllabus: _standardSyllabus() },
                    { id: 'c_systems', title: "Pensar con sistemas", duration: "60 min", desc: "Ver flujos y conexiones.", syllabus: _standardSyllabus() },
                    { id: 'c_resp', title: "Responsabilidad ampliada", duration: "60 min", desc: "El impacto de lo que creas.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_c_lang',
                title: "Lenguaje y Dirección Cognitiva",
                courses: [
                    { id: 'c_intent', title: "Intención clara", duration: "60 min", desc: "Saber qué quieres antes de pedir.", syllabus: _standardSyllabus() },
                    { id: 'c_context', title: "Contexto y restricciones", duration: "60 min", desc: "Guiar a la IA con precisión.", syllabus: _standardSyllabus() },
                    { id: 'c_prompt', title: "Preguntar mejor", duration: "60 min", desc: "La calidad de la pregunta define la respuesta.", syllabus: _standardSyllabus() },
                    { id: 'c_eval', title: "Evaluar outputs", duration: "60 min", desc: "Criterio humano sobre resultado artificial.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_c_applied',
                title: "Co-creación Aplicada a Negocio",
                courses: [
                    { id: 'c_text', title: "Texto estratégico", duration: "60 min", desc: "Escribir para impactar.", syllabus: _standardSyllabus() },
                    { id: 'c_image', title: "Imagen con intención", duration: "60 min", desc: "Visualizar conceptos abstractos.", syllabus: _standardSyllabus() },
                    { id: 'c_struct', title: "Estructuras y procesos", duration: "60 min", desc: "Organizar el caos.", syllabus: _standardSyllabus() },
                    { id: 'c_auto', title: "Automatización consciente", duration: "60 min", desc: "Eficiencia con propósito.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_c_risks',
                title: "Riesgos, Sesgos y Límites",
                courses: [
                    { id: 'c_bias', title: "Sesgos algorítmicos", duration: "60 min", desc: "Entender las fallas del modelo.", syllabus: _standardSyllabus() },
                    { id: 'c_depend', title: "Dependencia cognitiva", duration: "60 min", desc: "No perder la capacidad de pensar.", syllabus: _standardSyllabus() },
                    { id: 'c_ethics', title: "Riesgos éticos", duration: "60 min", desc: "Impacto no deseado.", syllabus: _standardSyllabus() },
                    { id: 'c_human', title: "Decisión humana final", duration: "60 min", desc: "El 'human in the loop'.", syllabus: _standardSyllabus() }
                ]
            },
            {
                id: 'cat_c_hybrid',
                title: "Diseño de Sistemas Humano–IA",
                courses: [
                    { id: 'c_hybrid', title: "Sistemas híbridos", duration: "60 min", desc: "Lo mejor de ambos mundos.", syllabus: _standardSyllabus() },
                    { id: 'c_roles', title: "Roles humano–IA", duration: "60 min", desc: "Quién hace qué.", syllabus: _standardSyllabus() },
                    { id: 'c_gov', title: "Gobernanza", duration: "60 min", desc: "Reglas de juego claras.", syllabus: _standardSyllabus() },
                    { id: 'c_scale', title: "Escalabilidad con criterio", duration: "60 min", desc: "Crecer sin romper.", syllabus: _standardSyllabus() }
                ]
            }
        ]
    }
};

function _standardSyllabus() {
    return [
        { title: "Propósito del Upgrade", duration: "3 min", desc: "Definición clara de lo que se busca actualizar." },
        { title: "Contexto", duration: "6 min", desc: "Entender el escenario actual y por qué esto es relevante." },
        { title: "Concepto Central", duration: "10 min", desc: "El núcleo teórico o marco mental del módulo." },
        { title: "Vocabulario Clave", duration: "5 min", desc: "Términos esenciales para operar con este nuevo concepto." },
        { title: "Mnemotecnia / Framework", duration: "6 min", desc: "Herramienta cognitiva para recordar y aplicar." },
        { title: "Comportamientos Actualizados", duration: "6 min", desc: "Acciones observables que cambian después del upgrade." },
        { title: "Workshop / Práctica Guiada", duration: "12 min", desc: "Ejercicio práctico para internalizar el aprendizaje." },
        { title: "Aplicación por Contexto", duration: "5 min", desc: "Cómo se ve esto en diferentes áreas de la vida." },
        { title: "Verificación de Upgrade", duration: "4 min", desc: "Checklist para confirmar la integración." },
        { title: "Cierre y Siguiente Paso", duration: "3 min", desc: "Conexión con el siguiente módulo y síntesis." }
    ];
}

// The NEW Leveling Test
// Replacing the old axis-specific tests with this master diagnostic
const levelingTest = [
    {
        q: "Cuando algo deja de funcionar en tu vida o trabajo, ¿qué sueles revisar primero?",
        options: [
            { text: "El contexto externo", points: 0 },
            { text: "A las otras personas", points: 1 },
            { text: "La forma en que estás pensando y actuando", points: 2 },
            { text: "Tu modelo mental y decisiones", points: 3 }
        ]
    },
    {
        q: "¿Qué tan cómodo te sientes aceptando que un modelo mental previo puede estar obsoleto?",
        options: [
            { text: "Muy incómodo", points: 0 },
            { text: "Algo incómodo", points: 1 },
            { text: "Cómodo", points: 2 },
            { text: "Natural, es parte del proceso", points: 3 }
        ]
    },
    {
        q: "Frente a un cambio grande en el entorno, tiendes a:",
        options: [
            { text: "Resistirte", points: 0 },
            { text: "Esperar", points: 1 },
            { text: "Adaptarte mínimamente", points: 2 },
            { text: "Rediseñar tu forma de operar", points: 3 }
        ]
    },
    {
        q: "¿Con qué frecuencia cuestionas si tu forma de decidir sigue siendo válida hoy?",
        options: [
            { text: "Casi nunca", points: 0 },
            { text: "Solo cuando falla", points: 1 },
            { text: "Regularmente", points: 2 },
            { text: "De forma consciente y constante", points: 3 }
        ]
    },
    {
        q: "Cuando una idea nueva contradice la tuya, tu reacción inicial es:",
        options: [
            { text: "Defenderte", points: 0 },
            { text: "Ignorarla", points: 1 },
            { text: "Escuchar con cautela", points: 2 },
            { text: "Explorarla con curiosidad", points: 3 }
        ]
    },
    {
        q: "¿Quién es responsable principal de tu actualización personal?",
        options: [
            { text: "El sistema", points: 0 },
            { text: "La empresa", points: 1 },
            { text: "El contexto", points: 2 },
            { text: "Tú mismo", points: 3 }
        ]
    },
    {
        q: "Cuando algo no funciona, sueles pensar que el problema está en:",
        options: [
            { text: "Las personas", points: 0 },
            { text: "El sistema", points: 1 },
            { text: "Las circunstancias", points: 2 },
            { text: "La forma de pensar dentro del sistema", points: 3 }
        ]
    },
    {
        q: "¿Qué tan dispuesto estás a decir “no sé”?",
        options: [
            { text: "Muy poco", points: 0 },
            { text: "A veces", points: 1 },
            { text: "Bastante", points: 2 },
            { text: "Totalmente", points: 3 }
        ]
    },
    {
        q: "Frente a la incertidumbre, buscas primero:",
        options: [
            { text: "Respuestas rápidas", points: 0 },
            { text: "Seguridad externa", points: 1 },
            { text: "Opiniones", points: 2 },
            { text: "Mejores preguntas", points: 3 }
        ]
    },
    {
        q: "Hoy te consideras principalmente en:",
        options: [
            { text: "Mantenimiento", points: 0 },
            { text: "Optimización", points: 1 },
            { text: "Aprendizaje ocasional", points: 2 },
            { text: "Aprendizaje continuo", points: 3 }
        ]
    }
];

// Mapping for consistency with dashboard code
const tests = {
    // We will use the same test for all axes for now, or just one master test.
    // Let's map 'human' to this test as the primary entry point.
    human: levelingTest,
    // Leadership and Co-creation could have their own later, or use this one.
    // For the prototype 'Polish' request, we'll assign it to all to ensure it works everywhere.
    leadership: levelingTest,
    cocreation: levelingTest
};

module.exports = { mentorsData, translations, pensum, levelingTest, tests };
