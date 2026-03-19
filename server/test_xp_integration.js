import 'dotenv/config';
import { socketServer } from './websocket/socketServer.js';
import { createServer } from 'http';

/**
 * Simple test script to verify XP system integration with WebSocket broadcasting
 */
async function testXPIntegration() {
    console.log('Testing XP Integration with WebSocket Broadcasting...');
    
    // Initialize WebSocket server (normally done by main server)
    const httpServer = createServer();
    socketServer.initialize(httpServer);
    
    // Test data
    const testUserId = 'test-user-123';
    const testFamilyId = 'test-family-123';
    const testXPData = {
        xpAmount: 15,
        skillId: 'test-skill-biology',
        level: 2,
        source: 'conversation',
        topicId: 'test-topic-basics'
    };
    
    // Simulate user connection with family context
    const mockUser = {
        id: testUserId,
        family_id: testFamilyId
    };
    
    console.log('✓ Simulated user connection established');
    console.log(`✓ User: ${testUserId}, Family: ${testFamilyId}`);
    
    // Test XP broadcasting
    try {
        socketServer.broadcastXPGain(testUserId, testXPData);
        console.log('✓ XP broadcast test successful');
        console.log(`  - XP Amount: ${testXPData.xpAmount}`);
        console.log(`  - Skill: ${testXPData.skillId}`);
        console.log(`  - Level: ${testXPData.level}`);
    } catch (error) {
        console.error('✗ XP broadcast test failed:', error.message);
    }
    
    // Test skill progress broadcasting
    try {
        const testSkillData = {
            skillId: testXPData.skillId,
            progress: 75,
            level: testXPData.level
        };
        
        socketServer.broadcastSkillProgress(testUserId, testSkillData);
        console.log('✓ Skill progress broadcast test successful');
    } catch (error) {
        console.error('✗ Skill progress broadcast test failed:', error.message);
    }
    
    // Test family statistics
    try {
        const familyStats = socketServer.getFamilyOnlineUsers(testFamilyId);
        console.log('✓ Family presence stats:', familyStats);
    } catch (error) {
        console.error('✗ Family stats test failed:', error.message);
    }
    
    console.log('\nXP Integration Test Complete!');
    console.log('Note: Full WebSocket testing requires browser client.');
    console.log('Open websocket_test.html in a browser to test real-time connections.');
}

// Run test
testXPIntegration().catch(console.error);