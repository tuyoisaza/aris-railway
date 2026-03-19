import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    'en-US': {
        translation: {
            greeting: "Hi, I'm Aris, your personal teacher.\nWhat would you like to explore?",
            menu: {
                newChat: "New Chat",
                conversation: "Conversation",
                myFamily: "My Family",
                parentDashboard: "Parent View",
                learningMap: "Learning Map",
                topics: "Topics",
                projects: "Projects",
                folders: "Folders",
                recentChats: "Recent Chats",
                noChats: "No conversations found.",
                settings: "Settings",
                skills: "Skills",
                admin: "Admin",
                logout: "Logout",
                language: "Language"
            },
            parent: {
                welcomeTitle: "Welcome to Parent View",
                welcomeSubtitle: "To start monitoring and managing profiles, please create a family group.",
                createButton: "Create Family Profile",
                logout: "Log Out"
            },
            settings: {
                title: "Settings",
                config: "Configuration options",
                account: "Account",
                manageProfile: "Manage your profile and preferences",
                profile: "Profile",
                subscription: "Subscription",
                export: "Data Export",
                logout: "Logout",
                edit: "Edit",
                save: "Save",
                age: "Age",
                joined: "Joined",
                preferences: "Preferences",
                light: "Light",
                dark: "Dark",
                language: "Language"
            },
            voice: {
                listening: "Listening...",
                thinking: "Thinking...",
                speaking: "Speaking..."
            },
            inputPlaceholder: "Ask Aris anything... (try: '/debug voice' to test speech)",
            // Skills Section
            skills: {
                title: "My Skills",
                subtitle: "Track your practical mastery. Every time you practice a real-world skill, Aris records your progress here.",
                addSkill: "Add Skill",
                addNew: "Add New Skill",
                skillName: "Skill Name",
                placeholder: "e.g. Pottery, Piano, Public Speaking",
                loading: "Loading skills...",
                noSkills: "No Skills Yet",
                noSkillsHint: "Start tracking your progress by telling Aris about what you are practicing (e.g., \"I cooked dinner\", \"I fixed the sink\").",
                addManually: "+ Add Manually",
                deleteSkill: "Delete Skill?",
                deleteConfirm: "Are you sure you want to delete",
                deleteWarning: "All progress, XP, and badges for this skill will be permanently lost.",
                deleteForever: "Delete Forever",
                level: "Lvl",
                xp: "XP",
                adding: "Adding...",
                alreadyTracking: "You are already tracking this skill!",
                failedToAdd: "Failed to add skill. Please try again.",
                failedToDelete: "Failed to delete skill."
            },
            // Projects Section
            projects: {
                title: "My Projects",
                subtitle: "What you're building, creating, and mastering.",
                newProject: "New Project",
                backToChat: "Back to Chat",
                allProjects: "All Projects",
                active: "Active",
                ideas: "Ideas",
                completed: "Completed",
                createProject: "Create Project",
                projectTitle: "Project Title",
                projectIntent: "What do you want to build?",
                whyICare: "Why I Care",
                doneWhen: "Done When",
                cancel: "Cancel",
                create: "Create",
                creating: "Creating...",
                noProjects: "No projects yet",
                startProject: "Start your first project to track your creations."
            },
            // Learning Map Section
            learningMap: {
                title: "Learning Map",
                subtitle: "Explore your intellectual landscape.",
                back: "Back",
                addTopic: "Add Topic",
                grid: "Grid",
                graph: "Graph",
                reCreateConnections: "Re-Create Connections",
                analyzing: "Analyzing...",
                enterTopicName: "Enter topic name:",
                topicExists: "Topic already exists",
                confirmRemap: "This will trigger the AI to re-evaluate and label ALL connections. Continue?",
                noTopics: "No topics yet",
                noTopicsHint: "Start exploring by chatting with Aris about what interests you.",
                xp: "XP",
                level: "Lvl",
                steps: "steps"
            },
            // Auth Section
            auth: {
                login: "Login",
                signup: "Sign Up",
                email: "Email",
                password: "Password",
                confirmPassword: "Confirm Password",
                name: "Name",
                forgotPassword: "Forgot Password?",
                resetPassword: "Reset Password",
                resetInstructions: "Enter your email and we'll send you a link to reset your password.",
                backToLogin: "Back to Login",
                emailAddress: "Email Address",
                sendResetLink: "Send Reset Link",
                sending: "Sending...",
                checkEmail: "Check your email folder (and spam).",
                updatePassword: "Update Password",
                newPassword: "New Password",
                updatePasswordBtn: "Update Password",
                updating: "Updating...",
                passwordUpdated: "Password updated successfully!",
                goToLogin: "Go to Login",
                noAccount: "Don't have an account?",
                haveAccount: "Already have an account?",
                orContinueWith: "Or continue with",
                google: "Google"
            },
            // Topic Page
            topic: {
                back: "Back to Map",
                progress: "Progress",
                resources: "Resources",
                generateContent: "Generate Content",
                generating: "Generating...",
                noResources: "No resources yet",
                askAris: "Ask Aris",
                level: "Level",
                xpToNext: "XP to next level"
            },
            // Common
            common: {
                loading: "Loading...",
                save: "Save",
                cancel: "Cancel",
                delete: "Delete",
                edit: "Edit",
                back: "Back",
                close: "Close",
                confirm: "Confirm",
                error: "Error",
                success: "Success",
                yes: "Yes",
                no: "No",
                ok: "OK",
                search: "Search",
                noResults: "No results found"
            }
        }
    },
    'es-ES': {
        translation: {
            greeting: "Hola, soy Aris, tu profesora personal.\n¿Qué te gustaría explorar?",
            menu: {
                newChat: "Nuevo Chat",
                conversation: "Conversación",
                myFamily: "Mi Familia",
                parentDashboard: "Vista de Padres",
                learningMap: "Mapa de Aprendizaje",
                topics: "Temas",
                projects: "Proyectos",
                folders: "Carpetas",
                recentChats: "Chats Recientes",
                noChats: "No se encontraron conversaciones.",
                settings: "Configuración",
                skills: "Habilidades",
                admin: "Administrador",
                logout: "Cerrar Sesión",
                language: "Idioma"
            },
            parent: {
                welcomeTitle: "Bienvenido a la Vista de Padres",
                welcomeSubtitle: "Para comenzar a monitorear y administrar perfiles, crea un grupo familiar.",
                createButton: "Crear Perfil Familiar",
                logout: "Cerrar Sesión"
            },
            settings: {
                title: "Configuración",
                config: "Opciones de configuración",
                account: "Cuenta",
                manageProfile: "Gestiona tu perfil y preferencias",
                profile: "Perfil",
                subscription: "Suscripción",
                export: "Exportar Datos",
                logout: "Cerrar Sesión",
                edit: "Editar",
                save: "Guardar",
                age: "Edad",
                joined: "Unido",
                preferences: "Preferencias",
                light: "Claro",
                dark: "Oscuro",
                language: "Idioma"
            },
            voice: {
                listening: "Escuchando...",
                thinking: "Pensando...",
                speaking: "Hablando..."
            },
            inputPlaceholder: "Pregúntale lo que sea a Aris...",
            // Skills Section
            skills: {
                title: "Mis Habilidades",
                subtitle: "Rastrea tu dominio práctico. Cada vez que practicas una habilidad real, Aris registra tu progreso aquí.",
                addSkill: "Agregar Habilidad",
                addNew: "Agregar Nueva Habilidad",
                skillName: "Nombre de la Habilidad",
                placeholder: "ej. Cerámica, Piano, Hablar en Público",
                loading: "Cargando habilidades...",
                noSkills: "Sin Habilidades Aún",
                noSkillsHint: "Comienza a rastrear tu progreso diciéndole a Aris lo que estás practicando (ej., \"Cociné la cena\", \"Arreglé el fregadero\").",
                addManually: "+ Agregar Manualmente",
                deleteSkill: "¿Eliminar Habilidad?",
                deleteConfirm: "¿Estás seguro de que quieres eliminar",
                deleteWarning: "Todo el progreso, XP y insignias de esta habilidad se perderán permanentemente.",
                deleteForever: "Eliminar Para Siempre",
                level: "Nvl",
                xp: "XP",
                adding: "Agregando...",
                alreadyTracking: "¡Ya estás rastreando esta habilidad!",
                failedToAdd: "Error al agregar habilidad. Inténtalo de nuevo.",
                failedToDelete: "Error al eliminar habilidad."
            },
            // Projects Section
            projects: {
                title: "Mis Proyectos",
                subtitle: "Lo que estás construyendo, creando y dominando.",
                newProject: "Nuevo Proyecto",
                backToChat: "Volver al Chat",
                allProjects: "Todos los Proyectos",
                active: "Activos",
                ideas: "Ideas",
                completed: "Completados",
                createProject: "Crear Proyecto",
                projectTitle: "Título del Proyecto",
                projectIntent: "¿Qué quieres construir?",
                whyICare: "Por Qué Me Importa",
                doneWhen: "Terminado Cuando",
                cancel: "Cancelar",
                create: "Crear",
                creating: "Creando...",
                noProjects: "Aún no hay proyectos",
                startProject: "Inicia tu primer proyecto para rastrear tus creaciones."
            },
            // Learning Map Section
            learningMap: {
                title: "Mapa de Aprendizaje",
                subtitle: "Explora tu paisaje intelectual.",
                back: "Volver",
                addTopic: "Agregar Tema",
                grid: "Cuadrícula",
                graph: "Gráfico",
                reCreateConnections: "Recrear Conexiones",
                analyzing: "Analizando...",
                enterTopicName: "Ingresa el nombre del tema:",
                topicExists: "El tema ya existe",
                confirmRemap: "Esto activará la IA para reevaluar y etiquetar TODAS las conexiones. ¿Continuar?",
                noTopics: "Aún no hay temas",
                noTopicsHint: "Comienza a explorar chateando con Aris sobre lo que te interesa.",
                xp: "XP",
                level: "Nvl",
                steps: "pasos"
            },
            // Auth Section
            auth: {
                login: "Iniciar Sesión",
                signup: "Registrarse",
                email: "Correo Electrónico",
                password: "Contraseña",
                confirmPassword: "Confirmar Contraseña",
                name: "Nombre",
                forgotPassword: "¿Olvidaste tu Contraseña?",
                resetPassword: "Restablecer Contraseña",
                resetInstructions: "Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.",
                backToLogin: "Volver al Login",
                emailAddress: "Correo Electrónico",
                sendResetLink: "Enviar Enlace",
                sending: "Enviando...",
                checkEmail: "Revisa tu carpeta de correo (y spam).",
                updatePassword: "Actualizar Contraseña",
                newPassword: "Nueva Contraseña",
                updatePasswordBtn: "Actualizar Contraseña",
                updating: "Actualizando...",
                passwordUpdated: "¡Contraseña actualizada exitosamente!",
                goToLogin: "Ir al Login",
                noAccount: "¿No tienes cuenta?",
                haveAccount: "¿Ya tienes cuenta?",
                orContinueWith: "O continúa con",
                google: "Google"
            },
            // Topic Page
            topic: {
                back: "Volver al Mapa",
                progress: "Progreso",
                resources: "Recursos",
                generateContent: "Generar Contenido",
                generating: "Generando...",
                noResources: "Aún no hay recursos",
                askAris: "Preguntarle a Aris",
                level: "Nivel",
                xpToNext: "XP para el siguiente nivel"
            },
            // Common
            common: {
                loading: "Cargando...",
                save: "Guardar",
                cancel: "Cancelar",
                delete: "Eliminar",
                edit: "Editar",
                back: "Volver",
                close: "Cerrar",
                confirm: "Confirmar",
                error: "Error",
                success: "Éxito",
                yes: "Sí",
                no: "No",
                ok: "OK",
                search: "Buscar",
                noResults: "No se encontraron resultados"
            }
        }
    },
    'pt-BR': {
        translation: {
            greeting: "Oi, eu sou Aris, sua professora pessoal.\nO que você gostaria de explorar?",
            menu: {
                newChat: "Nova Conversa",
                conversation: "Conversa",
                myFamily: "Minha Família",
                parentDashboard: "Visão dos Pais",
                learningMap: "Mapa de Aprendizado",
                topics: "Tópicos",
                projects: "Projetos",
                folders: "Pastas",
                recentChats: "Conversas Recentes",
                noChats: "Nenhuma conversa encontrada.",
                settings: "Configurações",
                skills: "Habilidades",
                admin: "Admin",
                logout: "Sair",
                language: "Idioma"
            },
            parent: {
                welcomeTitle: "Bem-vindo à Visão dos Pais",
                welcomeSubtitle: "Para começar a monitorar e gerenciar perfis, crie um grupo familiar.",
                createButton: "Criar Perfil Familiar",
                logout: "Sair"
            },
            settings: {
                title: "Configurações",
                config: "Opções de configuração",
                account: "Conta",
                manageProfile: "Gerencie seu perfil e preferências",
                profile: "Perfil",
                subscription: "Assinatura",
                export: "Exportar Dados",
                logout: "Sair",
                edit: "Editar",
                save: "Salvar",
                age: "Idade",
                joined: "Entrou em",
                preferences: "Preferências",
                light: "Claro",
                dark: "Escuro",
                language: "Idioma"
            },
            voice: {
                listening: "Ouvindo...",
                thinking: "Pensando...",
                speaking: "Falando..."
            },
            inputPlaceholder: "Pergunte qualquer coisa para Aris...",
            // Skills Section
            skills: {
                title: "Minhas Habilidades",
                subtitle: "Acompanhe seu domínio prático. Toda vez que você pratica uma habilidade real, Aris registra seu progresso aqui.",
                addSkill: "Adicionar Habilidade",
                addNew: "Adicionar Nova Habilidade",
                skillName: "Nome da Habilidade",
                placeholder: "ex. Cerâmica, Piano, Falar em Público",
                loading: "Carregando habilidades...",
                noSkills: "Nenhuma Habilidade Ainda",
                noSkillsHint: "Comece a acompanhar seu progresso contando para Aris o que você está praticando (ex., \"Cozinhei o jantar\", \"Consertei a pia\").",
                addManually: "+ Adicionar Manualmente",
                deleteSkill: "Excluir Habilidade?",
                deleteConfirm: "Tem certeza que deseja excluir",
                deleteWarning: "Todo o progresso, XP e medalhas desta habilidade serão permanentemente perdidos.",
                deleteForever: "Excluir Para Sempre",
                level: "Nvl",
                xp: "XP",
                adding: "Adicionando...",
                alreadyTracking: "Você já está acompanhando esta habilidade!",
                failedToAdd: "Falha ao adicionar habilidade. Tente novamente.",
                failedToDelete: "Falha ao excluir habilidade."
            },
            // Projects Section
            projects: {
                title: "Meus Projetos",
                subtitle: "O que você está construindo, criando e dominando.",
                newProject: "Novo Projeto",
                backToChat: "Voltar ao Chat",
                allProjects: "Todos os Projetos",
                active: "Ativos",
                ideas: "Ideias",
                completed: "Concluídos",
                createProject: "Criar Projeto",
                projectTitle: "Título do Projeto",
                projectIntent: "O que você quer construir?",
                whyICare: "Por Que Me Importo",
                doneWhen: "Concluído Quando",
                cancel: "Cancelar",
                create: "Criar",
                creating: "Criando...",
                noProjects: "Nenhum projeto ainda",
                startProject: "Inicie seu primeiro projeto para acompanhar suas criações."
            },
            // Learning Map Section
            learningMap: {
                title: "Mapa de Aprendizado",
                subtitle: "Explore sua paisagem intelectual.",
                back: "Voltar",
                addTopic: "Adicionar Tópico",
                grid: "Grade",
                graph: "Gráfico",
                reCreateConnections: "Recriar Conexões",
                analyzing: "Analisando...",
                enterTopicName: "Digite o nome do tópico:",
                topicExists: "O tópico já existe",
                confirmRemap: "Isso ativará a IA para reavaliar e rotular TODAS as conexões. Continuar?",
                noTopics: "Nenhum tópico ainda",
                noTopicsHint: "Comece a explorar conversando com Aris sobre o que te interessa."
            },
            // Auth Section
            auth: {
                login: "Entrar",
                signup: "Cadastrar",
                email: "E-mail",
                password: "Senha",
                confirmPassword: "Confirmar Senha",
                name: "Nome",
                forgotPassword: "Esqueceu a Senha?",
                resetPassword: "Redefinir Senha",
                resetInstructions: "Digite seu e-mail e enviaremos um link para redefinir sua senha.",
                backToLogin: "Voltar ao Login",
                emailAddress: "Endereço de E-mail",
                sendResetLink: "Enviar Link",
                sending: "Enviando...",
                checkEmail: "Verifique sua pasta de e-mail (e spam).",
                updatePassword: "Atualizar Senha",
                newPassword: "Nova Senha",
                updatePasswordBtn: "Atualizar Senha",
                updating: "Atualizando...",
                passwordUpdated: "Senha atualizada com sucesso!",
                goToLogin: "Ir para o Login",
                noAccount: "Não tem conta?",
                haveAccount: "Já tem conta?",
                orContinueWith: "Ou continue com",
                google: "Google"
            },
            // Topic Page
            topic: {
                back: "Voltar ao Mapa",
                progress: "Progresso",
                resources: "Recursos",
                generateContent: "Gerar Conteúdo",
                generating: "Gerando...",
                noResources: "Nenhum recurso ainda",
                askAris: "Perguntar para Aris",
                level: "Nível",
                xpToNext: "XP para o próximo nível"
            },
            // Common
            common: {
                loading: "Carregando...",
                save: "Salvar",
                cancel: "Cancelar",
                delete: "Excluir",
                edit: "Editar",
                back: "Voltar",
                close: "Fechar",
                confirm: "Confirmar",
                error: "Erro",
                success: "Sucesso",
                yes: "Sim",
                no: "Não",
                ok: "OK",
                search: "Buscar",
                noResults: "Nenhum resultado encontrado"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en-US',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
