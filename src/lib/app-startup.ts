// Application startup validation
import { validateEnvironment, logValidationResults } from './startup-validation';

let validationRun = false;

export function runStartupValidation(throwOnError: boolean = false) {
  if (validationRun) return; // Only run once
  
  try {
    const result = validateEnvironment();
    logValidationResults(result, throwOnError);
    validationRun = true;
  } catch (error) {
    console.error('🚨 STARTUP VALIDATION FAILED:', error);
    if (throwOnError) {
      process.exit(1);
    }
  }
}

// Auto-run validation when this module is imported, but don't throw errors during build
// This allows the build to complete even if env vars are missing, but logs warnings
runStartupValidation(false);