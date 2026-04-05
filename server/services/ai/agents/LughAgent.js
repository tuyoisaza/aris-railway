import BaseAgent from './BaseAgent.js';

class LughAgent extends BaseAgent {
  constructor() {
    super('lugh');
  }

  async generateCurriculum(skillName, context = '') {
    console.log(`[LughAgent] Generating for '${skillName}'. Context Len: ${context?.length}`);
    if (!context) console.warn('[LughAgent] WARNING: Empty context provided!');

    const systemPrompt = `Eres Lugh, el dios celta de las habilidades y artes, experto en generar descripciones estructuradas y accionables de habilidades.
Tu misión es crear una **Skill Page completa** para la habilidad solicitada, organizada en 10 niveles de dominio, con proyectos y resultados concretos.

IMPORTANTE: Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido, con la siguiente estructura:

{
  "skillName": "Nombre de la habilidad (Corregido y Capitalizado)",
  "definition": {
    "coreResult": "Resultado central (output concreto)",
    "importance": "¿Por qué importa en el mundo real?"
  },
  "category": "Hard Skill | Soft Skill | Meta-Skill",
  "levels": [
    {
      "level": 1,
      "name": "Nombre del Nivel (ej. Output de Descubrimiento)",
      "expectedResult": "Resultado esperado (producto/entregable)",
      "description": "Descripción breve del nivel",
      "criteria": "Criterios de evaluación"
    },
    ... (hasta nivel 10)
  ],
  "projects": [
    {
      "level": 1,
      "title": "Título del proyecto",
      "description": "Descripción",
      "deliverable": "Entregable concreto",
      "successIndicators": "Indicadores de éxito"
    },
    ... (hasta nivel 10)
  ],
  "resources": [
    "Recurso 1",
    "Recurso 2",
    "Recurso 3"
  ]
}

Asegúrate de que los 10 niveles sigan esta progresión:
1. Descubrimiento
2. Aplicación Básica
3. Operacional
4. Integración
5. Optimización
6. Eficiencia
7. Innovación
8. Escalamiento
9. Liderazgo de Práctica
10. Transformación Estratégica
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Skill: ${skillName}\nContexto adicional: ${context}` }
    ];

    try {
      const rawResponse = await this.chat(messages, { temperature: 0.7 });
      const result = await this.parse(rawResponse);

      console.log(`[Lugh] ✨ Curriculum generated for ${skillName}`);
      return result;
    } catch (error) {
      console.error('[Lugh] Error generating curriculum:', error);
      return null;
    }
  }
}

export default new LughAgent();
