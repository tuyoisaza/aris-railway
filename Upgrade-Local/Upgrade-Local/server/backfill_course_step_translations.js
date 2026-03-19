/* eslint-disable no-console */
// One-time backfill from courses.syllabus[].content into course_step_translations.
// Use this when historical content exists in courses JSONB but the new localization tables are empty.

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseLang(argv) {
  const arg = argv.find(a => a.startsWith('--lang='));
  const lang = arg ? arg.split('=')[1] : 'es';
  if (!['en', 'es', 'pt'].includes(lang)) {
    throw new Error('Invalid --lang. Use en, es, or pt');
  }
  return lang;
}

async function main() {
  const lang = parseLang(process.argv.slice(2));
  console.log(`Backfilling course_step_translations from courses.syllabus for lang=${lang}`);

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, description, syllabus');

  if (error) throw error;

  let rowsToUpsert = [];
  let totalSteps = 0;
  let totalWithMarkdown = 0;

  for (const course of courses || []) {
    const syllabus = Array.isArray(course.syllabus) ? course.syllabus : [];
    for (let i = 0; i < syllabus.length; i++) {
      totalSteps++;
      const step = syllabus[i] || {};
      const content = step.content || {};
      const markdown = content.markdown_content;
      if (!markdown) continue;

      totalWithMarkdown++;
      rowsToUpsert.push({
        course_id: course.id,
        step_index: i,
        lang,
        title: step.title || null,
        description: step.desc || null,
        markdown_content: markdown,
        resources: content.resources || null,
        estimated_read_time: content.estimated_read_time || null,
        generator_metadata: {
          source: 'backfill_from_courses',
          backfilled_at: new Date().toISOString()
        }
      });
    }
  }

  console.log(`Scanned steps: ${totalSteps}`);
  console.log(`Found steps with markdown_content: ${totalWithMarkdown}`);
  console.log(`Upserting rows: ${rowsToUpsert.length}`);

  // Upsert in batches
  const BATCH = 250;
  let upserted = 0;
  for (let i = 0; i < rowsToUpsert.length; i += BATCH) {
    const batch = rowsToUpsert.slice(i, i + BATCH);
    const { error: upsertError } = await supabase
      .from('course_step_translations')
      .upsert(batch, { onConflict: 'course_id,step_index,lang' });

    if (upsertError) throw upsertError;
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rowsToUpsert.length}`);
  }

  // Also backfill course_translations (title/description) so /courses/:id/content/:lang can localize top-level fields.
  const courseRows = (courses || []).map(c => ({
    course_id: c.id,
    lang,
    title: c.title || null,
    description: c.description || null
  }));

  const { error: courseUpsertError } = await supabase
    .from('course_translations')
    .upsert(courseRows, { onConflict: 'course_id,lang' });

  if (courseUpsertError) throw courseUpsertError;

  console.log('Backfill complete. Refresh /admin/content to see green checks.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
