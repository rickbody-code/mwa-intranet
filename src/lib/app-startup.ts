// Application startup validation
import { validateEnvironment, logValidationResults } from './startup-validation';

let validationRun = false;

export function runStartupValidation() {
  if (validationRun) return; // Only run once
  
  try {
    const result = validateEnvironment();
    logValidationResults(result);
    validationRun = true;
  } catch (error) {
    console.error('🚨 STARTUP VALIDATION FAILED:', error);
    process.exit(1);
  }
}

// Auto-run validation when this module is imported
runStartupValidation();