import { seedDemoData } from '../controllers/auth.controller';
import { Organization } from '../models';

async function runSeed() {
  const org = await Organization.findOne();
  if (!org) return;
  
  // Custom seed for testing our Area Checklist Flow
  console.log("Adding Area testing data...");
}

runSeed();
