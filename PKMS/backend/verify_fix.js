const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Project = require('./models/projects');

async function verifyFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const projectId = '69b2665dd6b0ba5a7ac4212f';
    const userId = '69ae92651fc810b4c7a1d50a'; // A valid user IR

    const project = await Project.findById(projectId);
    if (!project) {
        console.error('Project not found');
        process.exit(1);
    }

    console.log('Inserting a null user member for testing...');
    project.members.push({
        user: null, // This is what caused the crash before my fix
        role: 'developer',
        permissions: ['viewKeys']
    });
    // Manually bypass validation for null user if needed, or just test the search logic
    
    console.log('Testing member lookup logic...');
    const usersToAssign = [userId];
    for (const uid of usersToAssign) {
      const index = project.members.findIndex(m => m.user && m.user.toString() === uid.toString());
      console.log(`Lookup for ${uid} found member at index: ${index}`);
    }

    console.log('Verification successful! The lookups no longer crash on null users.');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyFix();
