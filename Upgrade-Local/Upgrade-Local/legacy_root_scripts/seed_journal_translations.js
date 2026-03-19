const { supabase } = require('./server/db');

const translations = [
    // --- Journal Form ---
    { lang: 'es', key: 'title_new_entry', value: 'Nueva Entrada' },
    { lang: 'en', key: 'title_new_entry', value: 'New Entry' },
    { lang: 'pt', key: 'title_new_entry', value: 'Nova Entrada' },

    { lang: 'es', key: 'label_decision', value: 'Decisión' },
    { lang: 'en', key: 'label_decision', value: 'Decision' },
    { lang: 'pt', key: 'label_decision', value: 'Decisão' },

    { lang: 'es', key: 'ph_decision', value: '¿Qué decisión tomaste?' },
    { lang: 'en', key: 'ph_decision', value: 'What decision did you make?' },
    { lang: 'pt', key: 'ph_decision', value: 'Qual decisão você tomou?' },

    // Context label already exists as 'label_context'

    { lang: 'es', key: 'ph_context', value: '¿Cuál era el contexto?' },
    { lang: 'en', key: 'ph_context', value: 'What was the context?' },
    { lang: 'pt', key: 'ph_context', value: 'Qual era o contexto?' },

    { lang: 'es', key: 'label_expected_outcome', value: 'Resultado Esperado' },
    { lang: 'en', key: 'label_expected_outcome', value: 'Expected Outcome' },
    { lang: 'pt', key: 'label_expected_outcome', value: 'Resultado Esperado' },

    { lang: 'es', key: 'ph_outcome', value: '¿Qué resultado esperas?' },
    { lang: 'en', key: 'ph_outcome', value: 'What outcome do you expect?' },
    { lang: 'pt', key: 'ph_outcome', value: 'Que resultado você espera?' },

    { lang: 'es', key: 'label_review_date', value: 'Fecha de Revisión' },
    { lang: 'en', key: 'label_review_date', value: 'Review Date' },
    { lang: 'pt', key: 'label_review_date', value: 'Data de Revisão' },

    { lang: 'es', key: 'btn_save', value: 'Guardar' },
    { lang: 'en', key: 'btn_save', value: 'Save' },
    { lang: 'pt', key: 'btn_save', value: 'Salvar' },

    { lang: 'es', key: 'btn_saving', value: 'Guardando...' },
    { lang: 'en', key: 'btn_saving', value: 'Saving...' },
    { lang: 'pt', key: 'btn_saving', value: 'Salvando...' },

    { lang: 'es', key: 'err_save_entry', value: 'Error al guardar la entrada' },
    { lang: 'en', key: 'err_save_entry', value: 'Error saving entry' },
    { lang: 'pt', key: 'err_save_entry', value: 'Erro ao salvar entrada' },
];

async function seed() {
    console.log('Seeding Journal translations...');

    for (const t of translations) {
        const { error } = await supabase
            .from('translations')
            .upsert(t, { onConflict: 'lang, key' });

        if (error) console.error('Error:', error);
        else console.log(`Inserted: ${t.key} (${t.lang})`);
    }

    console.log('Done!');
}

seed();
