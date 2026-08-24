const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  cloud_name: "ccw1hyn8",
  api_key: "742272686645735",
  api_secret: "MaqrZ6NPvrD37K01fJUwxD88vHI",
});

// Create a simple 1x1 black pixel PNG in memory
const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

async function test() {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "crushsvg_vectorize_test",
          resource_type: "image",
          format: "svg",
          effect: "vectorize:colors:3:detail:1.0",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(pngBuffer);
    });

    console.log("Cloudinary Result:", result.secure_url);

    // Fetch the SVG URL
    const response = await fetch(result.secure_url);
    const text = await response.text();
    console.log("-----------------------------------------");
    console.log("SVG CONTENT:");
    console.log(text.substring(0, 500));
    console.log("-----------------------------------------");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
