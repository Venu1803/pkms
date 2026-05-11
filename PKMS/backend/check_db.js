const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Project = require('./models/projects');

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects:`);

    projects.forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProjects();
