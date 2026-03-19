const { supabase } = require('./server/db');

const questions = [
    // Human Axis
    {
        axis_id: 'human',
        q: "¿Cómo manejas situaciones de alta presión?",
        options: [
            { text: "Me paralizo y no sé qué hacer", points: 1 },
            { text: "Busco ayuda inmediatamente", points: 2 },
            { text: "Tomo un momento para pensar y luego actúo", points: 3 },
            { text: "Me mantengo calmado y priorizo tareas", points: 4 }
        ],
        sort_order: 1
    },
    {
        axis_id: 'human',
        q: "¿Cómo describes tu capacidad de escucha activa?",
        options: [
            { text: "Generalmente estoy pensando en mi respuesta", points: 1 },
            { text: "A veces me distraigo durante conversaciones", points: 2 },
            { text: "Presto atención pero podría mejorar", points: 3 },
            { text: "Escucho atentamente y reformulo para confirmar", points: 4 }
        ],
        sort_order: 2
    },
    // Leadership Axis
    {
        axis_id: 'leadership',
        q: "¿Cómo manejas conflictos en tu equipo?",
        options: [
            { text: "Evito el conflicto a toda costa", points: 1 },
            { text: "Espero a que otros lo resuelvan", points: 2 },
            { text: "Intento mediar cuando es necesario", points: 3 },
            { text: "Facilito diálogos constructivos proactivamente", points: 4 }
        ],
        sort_order: 1
    },
    // Co-creation Axis
    {
        axis_id: 'cocreation',
        q: "¿Cómo es tu relación con la tecnología y la IA?",
        options: [
            { text: "Prefiero evitar la tecnología nueva", points: 1 },
            { text: "La uso cuando es necesario", points: 2 },
            { text: "Me interesa y estoy aprendiendo", points: 3 },
            { text: "La integro activamente en mi trabajo", points: 4 }
        ],
        sort_order: 1
    }
];

async function seed() {
    console.log('Seeding questions...');

    // Clear existing to avoid duplicates in this test
    // await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    // Better to just insert

    for (const q of questions) {
        const { error } = await supabase.from('questions').insert(q);
        if (error) console.error('Error inserting:', error);
        else console.log(`Inserted: ${q.q}`);
    }
    console.log('Done.');
}

seed();
