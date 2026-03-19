const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Load js/data.js ---
// Since js/data.js is a client-side file with 'const x = ...', we need to parse it or eval it.
// Simplest way for this specific legacy file: read content, eval in a sandbox or just regex extract.
// OR: manually copy the structures here.
// GIVEN the file is simple JS objects, let's just "require" it if we can modify it to export,
// OR (better) just copy the relevant data structures here to assume "Source of Truth" for migration.
// Since I can't easily require a non-module client file without `window` errors, I will extract it via string manipulation or just
// define the data here based on my previous `view_file` of `js/data.js`.

// ... Actually, I have the file content in history. I will paste the extraction logic.

// --- DATA FROM js/data.js ---
const mentorsData = [
    { id: "tuyo", name: "Tuyo Isaza", roleKey: "mentor_tuyo_role", descKey: "mentor_tuyo_desc", img: "img/mentor_tuyo.png" },
    { id: "juan", name: "Juan Alvarez", roleKey: "mentor_juan_role", descKey: "mentor_juan_desc", img: "img/mentor_juan.png" },
    { id: "camilo", name: "Camilo Vera", roleKey: "mentor_camilo_role", descKey: "mentor_camilo_desc", img: "img/mentor_camilo.png" },
    { id: "andres", name: "Andrés Jaramillo", roleKey: "mentor_andres_role", descKey: "mentor_andres_desc", img: "img/mentor_placeholders.png" }
];

const translations = {
    es: {
        nav_home: "Inicio", nav_problem: "Problema", nav_pensum: "Pensum", nav_pricing: "Precios", nav_soon: "SOON!",
        btn_login: "Entrar", btn_profile: "PERFIL", btn_logout: "Salir", register_title: "Crear Cuenta",
        btn_register_submit: "Registrarme", label_name: "Nombre",
        // ... (Truncated for brevity, normally we'd parse the full file. 
        // For this script, I'll rely on the user having the full file or I'll try to read it dynamically).
    }
    // ... en, pt
};
// NOTE: For the sake of this script, I will try to read the file and eval it in a context.
const vm = require('vm');
const dataJsPath = path.join(__dirname, '../js/data.js');
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');

// Mock window/local vars
const sandbox = {
    mentorsData: [],
    translations: {},
    pensum: {},
    _standardSyllabus: () => [],
    localStorage: { getItem: () => { } },
    location: {},
    Config: {},
    document: { addEventListener: () => { } },
    window: {},
    console: console
};

try {
    // Execute js/data.js in sandbox
    // We need to handle `const` redeclaration if we run multiple times, but here it's once.
    // data.js uses `const`.
    vm.createContext(sandbox);
    vm.runInContext(dataJsContent, sandbox);

    console.log("Successfully loaded data from js/data.js");
} catch (e) {
    console.error("Error parsing js/data.js:", e);
    process.exit(1);
}

const { mentorsData: mentors, translations: transData, pensum: pensumData } = sandbox;

async function migrate() {
    console.log("Starting Migration...");

    // 1. Mentors
    console.log("Migrating Mentors...");
    for (const m of mentors) {
        const { error } = await supabase.from('mentors').upsert({
            id: m.id,
            name: m.name,
            role_key: m.roleKey,
            desc_key: m.descKey,
            img_url: m.img
        });
        if (error) console.error(`Error mentor ${m.id}:`, error);
    }

    // 2. Translations
    console.log("Migrating Translations...");
    for (const lang of Object.keys(transData)) {
        const keys = transData[lang];
        const rows = Object.entries(keys).map(([k, v]) => ({
            lang: lang,
            key: k,
            value: v
        }));
        // Batch insert
        const { error } = await supabase.from('translations').upsert(rows);
        if (error) console.error(`Error translations ${lang}:`, error);
    }

    // 3. Pensum (Axes, Categories, Courses)
    console.log("Migrating Pensum...");
    for (const axisKey of Object.keys(pensumData)) {
        const axis = pensumData[axisKey];

        // Upsert Axis
        const { error: errA } = await supabase.from('axes').upsert({
            id: axis.id,
            title_key: axis.title_key,
            desc_key: axis.desc_key
        });
        if (errA) console.error(`Error axis ${axis.id}:`, errA);

        // Categories
        if (axis.categories) {
            for (const cat of axis.categories) {
                const { error: errC } = await supabase.from('categories').upsert({
                    id: cat.id,
                    axis_id: axis.id,
                    title: cat.title
                });
                if (errC) console.error(`Error category ${cat.id}:`, errC);

                // Courses
                if (cat.courses) {
                    for (const course of cat.courses) {
                        const { error: errCo } = await supabase.from('courses').upsert({
                            id: course.id,
                            category_id: cat.id,
                            title: course.title,
                            duration: course.duration,
                            description: course.desc,
                            syllabus: course.syllabus
                        });
                        if (errCo) console.error(`Error course ${course.id}:`, errCo);
                    }
                }
            }
        }
    }

    console.log("Migration Complete.");
}

migrate();
