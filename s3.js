require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadToS3(file, folder = 'reports') {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const timestamp = Date.now();
    const fileKey = `${folder}/${timestamp}-${file.originalname}`;

    const fileContent = fs.readFileSync(file.path);

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Clean up local file
    fs.unlinkSync(file.path);

    // Return S3 URL
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    return s3Url;
  } catch (error) {
    console.error('✗ S3 upload error:', error.message);
    throw error;
  }
}

module.exports = {
  s3Client,
  uploadToS3,
};
