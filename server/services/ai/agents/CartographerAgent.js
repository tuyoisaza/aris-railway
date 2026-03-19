import BaseAgent from './BaseAgent.js';
import { supabaseAdmin } from '../../../db.js';
import crypto from 'crypto';
import ThothAgent from './ThothAgent.js';
import BadgeService from '../../BadgeService.js';
import LibrarianAgent from './LibrarianAgent.js';

class CartographerAgent extends BaseAgent {
    constructor() {
        super('cartographer');
    }

    /**
     * Propose a domain classification for a topic.
     * Does NOT write to DB.
     * @param {string} title - Topic title
     * @param {string} description - Topic description
     * @returns {Promise<object>} - { domain, region, weight }
     */
    async proposeTopicDomain(title, description = 'New topic') {
        const cleanTitle = title.trim();
        console.log(`[Cartographer] 🏁 proposeTopicDomain called for: "${cleanTitle}"`);

        // 1. Classify Topology (Domain + Region + Weight)
        const { domain, region, weight } = await ThothAgent.classifyTopology(cleanTitle, description);
        console.log(`[Cartographer] 🧠 Thoth Classification: Input="${cleanTitle}" -> Domain="${domain}", Region="${region}"`);

        // Return pure analysis (Fact/Hypothesis)
        return {
            originalTitle: cleanTitle,
            domain,
            region,
            weight
        };
    }

    /**
     * Create a topic with AI-classified domain.
     * This is the main entry point for action-based topic creation.
     * @param {string} userId - User ID
     * @param {string} title - Topic title
     * @param {string} context - Context/description for classification
     * @returns {Promise<object>} - The created topic
     */
    async createTopicWithDomain(userId, title, context = 'New topic') {
        console.log(`[Cartographer] 🚀 createTopicWithDomain called for: "${title}" (User: ${userId})`);

        // 1. Get AI classification
        const classification = await this.proposeTopicDomain(title, context);
        console.log(`[Cartographer] Classification result: Domain="${classification.domain}"`);

        // 2. Persist via TopicService
        const TopicService = (await import('../../TopicService.js')).default;
        const topic = await TopicService.createTopic({
            title: classification.originalTitle,
            description: context,
            category: classification.domain,
            userId: userId
        });

        console.log(`[Cartographer] ✅ Topic created: ${topic.id} (${topic.title})`);
        return topic;
    }

    async analyzeConversation(conversationText) {
        console.log(`[Cartographer] Analyzing conversation...`);

        await this.loadSystemPrompt();

        // Force JSON mode for structure extraction
        const config = { ...this.config, jsonMode: true };

        const messages = [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: `Analyze the conversation. Identify the SINGLE most relevant High-Level Academic Domain (e.g., 'Paleontology', 'Quantum Physics', 'European History') that encompasses the discussion. \n\nAvoid creating granular topics for specific details (like 'T-Rex Anatomy'). Instead, group them under the main Domain.\n\nReturn JSON with 'topics' array. Each topic: { title, description (summarizing specific details discussed), relevance }. \n\nConversation:\n${conversationText}` }
        ];

        return await this.provider.chat(messages, config);
    }

/**
     * Main Cognitive Loop Entry Point
     */
    async analyzeAndMap(conversationId, userId) {
        console.log(`[Cartographer] Starting analysis for ${conversationId} (User: ${userId})`);
        try {
            // 1. Fetch Context (Last 20 messages)
            const { data: messages, error: msgError } = await supabaseAdmin
                .from('messages')
                .select('role, text, created_at') // 'content' column missing in this env
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (msgError) {
                console.error('[Cartographer] Error fetching messages:', msgError);
                return;
            }

            if (!messages || messages.length === 0) {
                console.log('[Cartographer] No messages found.');
                return;
            }

            // 2. Check for recently processed BRANCH milestones to prevent duplicate topic creation
            const branchMilestoneMessages = messages.filter(msg => 
                msg.role === 'system' && 
                msg.text && 
                msg.text.includes('milestoneType') && 
                msg.text.includes('BRANCH')
            );

            if (branchMilestoneMessages.length > 0) {
                console.log(`[Cartographer] 🚫 Found recent BRANCH milestone, skipping topic extraction to prevent duplicates`);
                return { skipped: 'BRANCH milestone detected' };
            }

            const conversationText = messages.reverse()
                .map(m => `${m.role.toUpperCase()}: ${m.content || m.text}`)
                .join('\n');

// 2. Identify Topics
            const analysisJson = await this.analyzeConversation(conversationText);
            let analysis;
            try {
                analysis = JSON.parse(analysisJson);
            } catch (e) {
                console.error('[Cartographer] JSON Parse Error:', e);
                return;
            }

            if (!analysis.topics) return;

            // 3. Filter out topics that match recent BRANCH milestones to prevent duplicates
            const filteredTopics = [];
            for (const topic of analysis.topics) {
                const branchMilestoneExists = messages.some(msg => 
                    msg.role === 'system' && 
                    msg.text && 
                    msg.text.includes('BRANCH') && 
                    msg.text.includes(topic.title)
                );

                if (!branchMilestoneExists) {
                    console.log(`[Cartographer] Adding topic: ${topic.title}`);
                    filteredTopics.push(topic);
                } else {
                    console.log(`[Cartographer] 🚫 Skipping topic "${topic.title}" due to recent BRANCH milestone`);
                }
            }

// 3. Return Analysis (Service handles persistence)
            // We just return list of filtered topics (excluding BRANCH duplicates)
            const validTopics = [];
            for (const topic of filteredTopics) {
                console.log(`[Cartographer] Valid topic: ${topic.title}`);
                validTopics.push({
                    title: topic.title,
                    description: topic.description,
                    relevance: topic.relevance
                });
            }

            console.log(`[Cartographer] Returning ${validTopics.length} topics (filtered from ${analysis.topics.length})`);

            return {
                conversationId,
                topics: validTopics
            };

        } catch (err) {
            console.error('[Cartographer] Error:', err);
            return { error: err.message };
        }
    }

    /**
     * Agentic: Analyze relationships between a new topic and existing ones.
     */
    async analyzeTopicRelationships(newTopicId) {
        console.log(`[Cartographer] 🔗 analyzeTopicRelationships called for: ${newTopicId}`);
        try {
            // 1. Fetch Data
            const { data: newTopic, error: topicErr } = await supabaseAdmin.from('topics').select('*').eq('id', newTopicId).single();
            if (topicErr) {
                console.error('[Cartographer] Error fetching new topic:', topicErr.message);
                return;
            }
            if (!newTopic) {
                console.log('[Cartographer] No topic found for ID:', newTopicId);
                return;
            }
            console.log(`[Cartographer] New topic found: "${newTopic.title}"`);

            const { data: allTopics } = await supabaseAdmin.from('topics').select('id, title');
            const others = allTopics.filter(t => t.id !== newTopicId);
            console.log(`[Cartographer] Found ${others.length} other topics to connect to`);

            if (others.length === 0) {
                console.log('[Cartographer] No other topics to connect to, skipping');
                return;
            }

            // 2. AI Analysis
            // Load System Prompt & Instructions from DB
            await this.loadSystemPrompt(); // This populates this.systemPrompt and this.instructionText

            // Default fallback if DB is empty (though migration should ensure it's not)
            const fallbackPrompt = "You are a Knowledge Graph Architect. Identify semantic relationships.";
            const fallbackInstr = "Return JSON: { \"edges\": [{ \"target_title\", \"label\", \"rationale\" }] }";

            const finalSystemPrompt = (this.systemPrompt || fallbackPrompt) + "\n\n" + (this.instructionText || fallbackInstr);

            const userPrompt = `New Topic: "${newTopic.title}"\nExisting Topics: ${JSON.stringify(others.map(t => t.title))}\n\nIdentify the top 5 most meaningful connections for the New Topic.`;
            console.log('[Cartographer] User prompt:', userPrompt.substring(0, 150) + '...');

            // Use JSON mode if supported
            const config = { ...this.config, jsonMode: true };
            const messages = [
                { role: 'system', content: finalSystemPrompt },
                { role: 'user', content: userPrompt }
            ];

            console.log('[Cartographer] Calling AI...');
            const responseJson = await this.provider.chat(messages, config);
            console.log('[Cartographer] AI Response:', responseJson);

            let result;
            try {
                result = JSON.parse(responseJson);
            } catch (e) {
                console.error('[Cartographer] JSON Parse Error:', e.message);
                console.error('[Cartographer] Raw response was:', responseJson);
                return;
            }

            if (!result.edges || result.edges.length === 0) {
                console.log('[Cartographer] No edges in AI response');
                return;
            }
            console.log(`[Cartographer] AI returned ${result.edges.length} edges`);

            // 3. Return Edges (Service handles persistence)
            const edgeRows = [];
            for (const edge of result.edges) {
                const target = others.find(t => t.title.toLowerCase() === edge.target_title.toLowerCase());
                if (target) {
                    edgeRows.push({
                        source_topic_id: newTopic.id,
                        target_topic_id: target.id,
                        label: edge.label,
                        rationale: edge.rationale
                    });
                    console.log(`[Cartographer] Edge Found: ${newTopic.title} --[${edge.label}]--> ${target.title}`);
                }
            }

            return edgeRows; // Pure Data

        } catch (err) {
            console.error('[Cartographer] Relationship Error:', err);
            return [];
        }
    }

    /**
     * Propose a unified profile for a set of topics being merged.
     * @param {Array<object>} topicProfiles - [{ title, description, domain, region }]
     * @returns {Promise<object>} - { title, description, domain, region }
     */
    async proposeMergedTopic(topicProfiles) {
        console.log(`[Cartographer] Proposing merge for ${topicProfiles.length} topics...`);

        await this.loadSystemPrompt();

        const config = { ...this.config, jsonMode: true };
        const systemPrompt = "You are a Knowledge Architect. Your task is to unify multiple related topics into a single, cohesive academic identity. Provide a title, description, and high-level domain/region classification. Be concise but accurate.";

        const userPrompt = `Topics to merge:
${JSON.stringify(topicProfiles, null, 2)}

Identify the best common identifier (title) and a refined description that encompasses the essence of all of them. 
Return JSON: { "title", "description", "domain", "region" }`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            const responseJson = await this.provider.chat(messages, config);
            const result = JSON.parse(responseJson);

            console.log(`[Cartographer] Propose merge result: "${result.title}"`);
            return {
                title: result.title || topicProfiles[0].title,
                description: result.description || topicProfiles[0].description,
                domain: result.domain || topicProfiles[0].category,
                region: result.region || topicProfiles[0].region
            };
        } catch (error) {
            console.error('[Cartographer] Merge Proposal Error:', error);
            // Fallback to first topic
            return {
                title: topicProfiles[0].title,
                description: topicProfiles[0].description,
                domain: topicProfiles[0].category,
                region: topicProfiles[0].region
            };
        }
    }

    /**
     * Re-analyze the ENTIRE graph connectivity.
     */
    async remapGraph() {
        console.log(`[Cartographer] Remapping entire graph...`);
        try {
            const { data: topics } = await supabaseAdmin.from('topics').select('id, title');
            if (!topics || topics.length < 2) return;

            // Default prompt (includes instructions)
            // Default prompt (includes instructions)
            let systemPrompt = "You are a Knowledge Graph Architect. Given a list of topics, identify the network of semantic relationships. Return a JSON object with 'edges'. Each edge: { source_title, target_title, label, rationale }. Labels must be single, evocative verbs or nouns. Rationale must be a concise sentence explanation.";
            let overrides = {};

            // Fetch Override
            try {
                const { data: p } = await supabaseAdmin.from('system_prompts').select('prompt_text, model, temperature').eq('agent_id', 'cartographer_rel').single();
                if (p) {
                    if (p.prompt_text) {
                        // Append STRICT formatting instructions to the admin-defined persona
                        systemPrompt = p.prompt_text + " Return a JSON object with 'edges'. Each edge: { source_title, target_title, label, rationale }.";
                    }
                    if (p.model) overrides.model = p.model;
                    if (p.temperature !== null) overrides.temperature = p.temperature;
                }
            } catch (e) {
                // Ignore error, use default
            }

            const userPrompt = `Topics: ${JSON.stringify(topics.map(t => t.title))}\n\nBuild the complete connection graph. Only include meaningful relationships. Cover as many connections as logical.`;

            const config = { ...this.config, ...overrides, jsonMode: true };

            // Log for debugging
            console.log('[Cartographer-DEBUG]', { prompt: systemPrompt, config });

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const responseJson = await this.provider.chat(messages, config);
            console.log('[Cartographer-DEBUG] Response Type:', typeof responseJson);
            console.log('[Cartographer-DEBUG] Response Content:', responseJson);
            let result;
            try {
                result = JSON.parse(responseJson);
            } catch (e) { console.error('JSON Parse Error', e); return; }

            if (!result.edges) return;

            // Map titles back to IDs
            const edgeRows = [];
            for (const edge of result.edges) {
                const source = topics.find(t => t.title.toLowerCase() === edge.source_title.toLowerCase());
                const target = topics.find(t => t.title.toLowerCase() === edge.target_title.toLowerCase());

                if (source && target && source.id !== target.id) {
                    edgeRows.push({
                        source_topic_id: source.id,
                        target_topic_id: target.id,
                        label: edge.label,
                        rationale: edge.rationale
                    });
                }
            }

            let saveError = null;
            if (edgeRows.length > 0) {
                console.log(`[Cartographer] Preparing to save ${edgeRows.length} edges...`);

                // Wipe existing edges first
                const { error: deleteError, count: deleteCount } = await supabaseAdmin
                    .from('topic_edges')
                    .delete()
                    .gte('source_topic_id', '00000000-0000-0000-0000-000000000000'); // Match all UUIDs

                if (deleteError) {
                    console.error('[Cartographer] Delete Error:', deleteError.message);
                } else {
                    console.log(`[Cartographer] Deleted existing edges`);
                }

                // Insert new edges
                const { error: insertError } = await supabaseAdmin
                    .from('topic_edges')
                    .insert(edgeRows);

                if (insertError) {
                    console.error('[Cartographer] Insert Error:', insertError.message);
                    saveError = insertError.message;
                } else {
                    console.log(`[Cartographer] ✅ Graph Remapped. Saved ${edgeRows.length} edges.`);
                }
            } else {
                console.log('[Cartographer] No edges to save');
            }

            return {
                success: !saveError,
                edge_count: edgeRows.length,
                debug: {
                    model: config.model,
                    systemPrompt,
                    userPrompt,
                    responseRaw: responseJson
                }
            };

        } catch (err) {
            console.error('[Cartographer] Remap Error:', err);
            return { success: false, error: err.message };
        }
    }
}

export default new CartographerAgent();
