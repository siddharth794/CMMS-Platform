import { PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3';

export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
    return key;
}

export async function deleteFromS3(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
    }));
}

export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await s3Client.send(new DeleteObjectsCommand({
        Bucket: S3_BUCKET,
        Delete: {
            Objects: keys.map(key => ({ Key: key })),
            Quiet: true,
        },
    }));
}
