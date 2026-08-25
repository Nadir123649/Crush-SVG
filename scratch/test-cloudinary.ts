import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dummy",
  api_key: process.env.CLOUDINARY_API_KEY || "dummy",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy",
});

async function run() {
  try {
    // We will just upload a dummy small image or URL
    const res = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      format: 'svg',
      transformation: [
        { effect: 'vectorize:colors:3:detail:1.0:paths:50' }
      ]
    });
    console.log("Success:", res.secure_url);
  } catch (err) {
    console.error("Cloudinary Error:", err);
  }
}

run();
