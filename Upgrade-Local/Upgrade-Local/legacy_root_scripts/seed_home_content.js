const { supabase } = require('./server/db');

const translations = [
    // Problem Section (Conclusion)
    { key: 'problem_conclusion_1', es: 'No es un problema de capacidad. Es un problema de versión.', en: 'It is not a capacity problem. It is a version problem.', pt: 'Não é um problema de capacidade. É um problema de versão.' },
    { key: 'problem_conclusion_2', es: 'Upgrade! existe para cerrar esa brecha.', en: 'Upgrade! exists to close that gap.', pt: 'Upgrade! existe para fechar essa lacuna.' },

    // About Section
    { key: 'about_title', es: 'Qué es Upgrade!', en: 'What is Upgrade!', pt: 'O que é Upgrade!' },
    { key: 'about_desc_1', es: 'Upgrade! no es un curso. No es una certificación. No es motivación. Es un sistema de actualización personal, de liderazgo y de co-creación diseñado para el mundo actual.', en: 'Upgrade! is not a course. It is not a certification. It is not motivation. It is a personal update, leadership, and co-creation system designed for today\'s world.', pt: 'Upgrade! não é um curso. Não é uma certificação. Não é motivação. É um sistema de atualização pessoal, de liderança e de cocriação projetado para o mundo atual.' },
    { key: 'about_feat_1_title', es: 'Pensamiento, no dogma', en: 'Thinking, not dogma', pt: 'Pensamento, não dogma' },
    { key: 'about_feat_1_desc', es: 'No te decimos qué pensar. Te enseñamos a pensar mejor.', en: 'We don\'t tell you what to think. We teach you how to think better.', pt: 'Não dizemos o que pensar. Ensinamos como pensar melhor.' },
    { key: 'about_feat_2_title', es: 'Compatibilidad, no rapidez', en: 'Compatibility, not speed', pt: 'Compatibilidade, não rapidez' },
    { key: 'about_feat_2_desc', es: 'No prometemos rapidez. Prometemos compatibilidad real con el mundo actual.', en: 'We don\'t promise speed. We promise real compatibility with today\'s world.', pt: 'Não prometemos rapidez. Prometemos compatibilidade real com o mundo atual.' },
    { key: 'about_feat_3_title', es: 'Criterio, no fragilidad', en: 'Judgment, not fragility', pt: 'Critério, não fragilidade' },
    { key: 'about_feat_3_desc', es: 'No formamos especialistas frágiles. Formamos personas con criterio duradero.', en: 'We don\'t train fragile specialists. We train people with lasting judgment.', pt: 'Não formamos especialistas frágeis. Formamos pessoas com critério duradouro.' },

    // Upgrade 0 Section
    { key: 'zero_title', es: 'Upgrade! 0', en: 'Upgrade! 0', pt: 'Upgrade! 0' },
    { key: 'zero_subtitle', es: 'Antes de cualquier eje, todas las personas pasan por aquí.', en: 'Before any axis, everyone starts here.', pt: 'Antes de qualquer eixo, todos passam por aqui.' },
    { key: 'zero_feat_title', es: 'Corta e intensa', en: 'Short and intense', pt: 'Curta e intensa' },
    { key: 'zero_feat_desc', es: 'Una experiencia que rompe la mentira fundamental: que puedes seguir operando igual en un mundo que ya cambió.', en: 'An experience that breaks the fundamental lie: that you can keep operating the same way in a world that has already changed.', pt: 'Uma experiência que quebra a mentira fundamental: de que você pode continuar operando da mesma maneira em um mundo que já mudou.' },
    { key: 'zero_footer', es: 'Sin Upgrade! 0, no hay Upgrade!.', en: 'Without Upgrade! 0, there is no Upgrade!.', pt: 'Sem Upgrade! 0, não há Upgrade!.' },

    // Mentors Section
    { key: 'mentors_title', es: 'Nuestros Mentores', en: 'Our Mentors', pt: 'Nossos Mentores' },
    { key: 'mentors_subtitle', es: 'Mentes que han actualizado su propio sistema operativo.', en: 'Minds that have updated their own operating system.', pt: 'Mentes que atualizaram seu próprio sistema operacional.' },
    { key: 'mentor_tuyo_name', es: 'Tuyo Isaza', en: 'Tuyo Isaza', pt: 'Tuyo Isaza' },
    { key: 'mentor_tuyo_role', es: 'Conciencia y Liderazgo', en: 'Consciousness & Leadership', pt: 'Consciência e Liderança' },
    { key: 'mentor_tuyo_desc', es: 'Especialista en productividad mental.', en: 'Specialist in mental productivity.', pt: 'Especialista em produtividade mental.' },
    { key: 'mentor_juan_name', es: 'Juan Alvarez', en: 'Juan Alvarez', pt: 'Juan Alvarez' },
    { key: 'mentor_juan_role', es: 'Modelos Mentales y Cultura', en: 'Mental Models & Culture', pt: 'Modelos Mentais e Cultura' },
    { key: 'mentor_juan_desc', es: 'Experto en creación de mensajes.', en: 'Expert in message creation.', pt: 'Especialista em criação de mensagens.' },
    { key: 'mentor_camilo_name', es: 'Camilo Vera', en: 'Camilo Vera', pt: 'Camilo Vera' },
    { key: 'mentor_camilo_role', es: 'Neuromarketing', en: 'Neuromarketing', pt: 'Neuromarketing' },
    { key: 'mentor_camilo_desc', es: 'Estratega en comportamiento humano.', en: 'Human behavior strategist.', pt: 'Estrategista em comportamento humano.' },
    { key: 'mentor_andres_name', es: 'Andrés Jaramillo', en: 'Andrés Jaramillo', pt: 'Andrés Jaramillo' },
    { key: 'mentor_andres_role', es: 'Marketing Digital', en: 'Digital Marketing', pt: 'Marketing Digital' },
    { key: 'mentor_andres_desc', es: 'Experto en estrategia de crecimiento.', en: 'Growth strategy expert.', pt: 'Especialista em estratégia de crescimento.' },

    // Conversations Section
    { key: 'conversations_title', es: 'Upgrade! en Conversaciones Abiertas', en: 'Upgrade! in Open Conversations', pt: 'Upgrade! em Conversas Abertas' },
    { key: 'conversations_desc', es: 'Ideas, análisis y criterio aplicado a los desafíos reales.', en: 'Ideas, analysis, and judgment applied to real challenges.', pt: 'Ideias, análises e critério aplicado aos desafios reais.' },
    { key: 'conv_1', es: 'Liderazgo moderno', en: 'Modern Leadership', pt: 'Liderança Moderna' },
    { key: 'conv_2', es: 'Co-creación con IA', en: 'Co-creation with AI', pt: 'Cocriação com IA' },
    { key: 'conv_3', es: 'Actualización personal', en: 'Personal Upgrade', pt: 'Atualização Pessoal' },

    // Final CTA
    { key: 'final_cta_title', es: 'El mundo no va a desacelerar.', en: 'The world won\'t slow down.', pt: 'O mundo não vai desacelerar.' },
    { key: 'final_cta_sub', es: 'La pregunta es si tú vas a actualizarte.', en: 'The question is if you will update yourself.', pt: 'A pergunta é se você vai se atualizar.' },
    { key: 'btn_start_upgrade', es: 'Comienza tu Upgrade!', en: 'Start your Upgrade!', pt: 'Comece seu Upgrade!' }
];

async function seed() {
    console.log('Seeding home content...');
    for (const item of translations) {
        const { key, ...langs } = item;
        for (const [lang, value] of Object.entries(langs)) {
            const { error } = await supabase
                .from('translations')
                .upsert({ lang, key, value }, { onConflict: 'lang, key' });
            if (error) console.error(`Error ${lang}.${key}:`, error);
        }
    }
    console.log('Done.');
}

seed();
