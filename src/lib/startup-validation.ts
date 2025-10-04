// Startup validation for production readiness
export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Production environment checks
  if (process.env.NODE_ENV === "production") {
    // Critical security check
    if (process.env.DEV_AUTH_ENABLED === "true") {
      errors.push("CRITICAL: DEV_AUTH_ENABLED must not be true in production!");
    }

    // Azure AD configuration
    const requiredAzureVars = ["AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET", "AZURE_AD_TENANT_ID"];
    const missingAzureVars = requiredAzureVars.filter(varName => !process.env[varName]);
    
    if (missingAzureVars.length > 0) {
      errors.push(`Missing required Azure AD variables: ${missingAzureVars.join(", ")}`);
    }

    // Database URL
    if (!process.env.DATABASE_URL) {
      errors.push("DATABASE_URL is required in production");
    }
  }

  // Object storage configuration (warn if missing, don't fail)
  const sidecarEndpoint = process.env.REPLIT_SIDECAR_ENDPOINT;
  const objectBucket = process.env.PRIVATE_OBJECT_BUCKET;

  if (!sidecarEndpoint) {
    warnings.push("REPLIT_SIDECAR_ENDPOINT not configured - object storage cleanup disabled");
  }
  
  if (!objectBucket) {
    warnings.push("PRIVATE_OBJECT_BUCKET not configured - using default 'wiki-attachments'");
  }

  // Development auth warning
  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_ENABLED === "true") {
    warnings.push("Development authentication is ENABLED - only use in development!");
  }

  return { errors, warnings };
}

export function logValidationResults(result: ValidationResult, throwOnError: boolean = false): void {
  if (result.warnings.length > 0) {
    console.warn("⚠️  Configuration warnings:");
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (result.errors.length > 0) {
    console.error("🚨 Configuration errors:");
    result.errors.forEach(error => console.error(`   - ${error}`));
    
    // Only throw if explicitly requested (runtime validation, not build-time)
    if (throwOnError) {
      throw new Error(`Configuration validation failed: ${result.errors.join(", ")}`);
    } else {
      console.error("⚠️  Build will continue, but app may not work correctly at runtime");
    }
  }

  // Success message
  if (result.errors.length === 0) {
    if (process.env.NODE_ENV === "production") {
      console.log("✅ Production configuration validated successfully");
    } else {
      console.log("✅ Development configuration validated");
    }
  }
}

export interface ObjectStorageConfig {
  available: boolean;
  reason?: string;
}

export function validateObjectStorage(): ObjectStorageConfig {
  const sidecarEndpoint = process.env.REPLIT_SIDECAR_ENDPOINT;
  const objectBucket = process.env.PRIVATE_OBJECT_BUCKET;

  if (!sidecarEndpoint) {
    return { 
      available: false, 
      reason: "REPLIT_SIDECAR_ENDPOINT not configured" 
    };
  }

  if (!objectBucket) {
    console.warn("Using default bucket 'wiki-attachments' - consider setting PRIVATE_OBJECT_BUCKET");
  }

  return { available: true };
}