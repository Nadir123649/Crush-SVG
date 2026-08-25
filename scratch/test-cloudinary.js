const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dummy",
  api_key: process.env.CLOUDINARY_API_KEY || "dummy",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy",
});

async function run() {
  try {
    const res = await cloudinary.uploader.upload('public/icon-192.png', {
      format: 'svg',
      transformation: [
        { effect: 'vectorize:colors:3:detail:1.0:paths:50' }
      ]
    });
    console.log("Success URL:", res.secure_url);
    
    // Check if the URL actually returns SVG XML
    const fetch = require('node-fetch');
    const svgRes = await fetch(res.secure_url);
    const text = await svgRes.text();
    console.log("First 100 chars of SVG:", text.substring(0, 100));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
