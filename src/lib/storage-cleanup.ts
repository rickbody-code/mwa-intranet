import { Storage } from '@google-cloud/storage';
import { validateObjectStorage } from './startup-validation';

const REPLIT_SIDECAR_ENDPOINT = process.env.REPLIT_SIDECAR_ENDPOINT || '';

// Initialize Google Cloud Storage with Replit authentication
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export async function deleteObjectFromStorage(blobKey: string): Promise<boolean> {
  const storageConfig = validateObjectStorage();
  
  if (!storageConfig.available) {
    console.warn(`Object storage cleanup skipped for ${blobKey}: ${storageConfig.reason}`);
    return false;
  }

  try {
    const bucketName = process.env.PRIVATE_OBJECT_BUCKET || "wiki-attachments";
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(blobKey);

    // Check if file exists before attempting deletion
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`File ${blobKey} does not exist in bucket ${bucketName}`);
      return true; // Consider it "deleted" if it doesn't exist
    }

    // Delete the file
    await file.delete();
    console.log(`Successfully deleted ${blobKey} from bucket ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete blob ${blobKey}:`, error);
    return false;
  }
}

export async function cleanupAttachmentBlobs(blobKeys: string[]): Promise<{ 
  success: number; 
  failed: number; 
  results: Array<{ blobKey: string; success: boolean; error?: string }> 
}> {
  if (blobKeys.length === 0) {
    return { success: 0, failed: 0, results: [] };
  }

  const results = await Promise.allSettled(
    blobKeys.map(async (blobKey) => {
      try {
        const success = await deleteObjectFromStorage(blobKey);
        return { blobKey, success };
      } catch (error) {
        return { 
          blobKey, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    })
  );

  const finalResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        blobKey: blobKeys[index],
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Promise rejected'
      };
    }
  });

  const successCount = finalResults.filter(r => r.success).length;
  const failedCount = finalResults.filter(r => !r.success).length;

  return {
    success: successCount,
    failed: failedCount,
    results: finalResults
  };
}