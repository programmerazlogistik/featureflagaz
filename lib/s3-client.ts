"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
});

export async function readFlagsFromS3(): Promise<Record<string, boolean>> {
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME!;
    const key = process.env.AWS_S3_OBJECT_KEY!;
    const region = process.env.AWS_REGION!;
    
    // Construct S3 public URL
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    
    const response = await fetch(url, {
      cache: 'no-store', // Always get fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flags: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error reading from S3:", error);
    // Return a default if file doesn't exist or other errors
    return { isMaintenance: false };
  }
}

export async function writeFlagsToS3(data: Record<string, boolean>): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: process.env.AWS_S3_OBJECT_KEY!,
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json",
  });
  
  await s3Client.send(command);
}
