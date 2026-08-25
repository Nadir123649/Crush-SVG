import { NextResponse } from 'next/server';
import fs from 'fs';
import https from 'https';
import path from 'path';

export async function GET(): Promise<NextResponse> {
  return new Promise<NextResponse>((resolve) => {
    https.get('https://raw.githubusercontent.com/jankovicsandras/imagetracerjs/master/imagetracer_v1.2.6.js', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const dir = path.join(process.cwd(), 'src', 'lib', 'utils');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        // Add export statement at the end of the file so we can import it in Node
        data += '\nmodule.exports = ImageTracer;\n';
        
        fs.writeFileSync(path.join(dir, 'imagetracer.js'), data);
        resolve(NextResponse.json({ success: true, length: data.length }));
      });
    }).on('error', (err) => {
      resolve(NextResponse.json({ success: false, error: err.message }));
    });
  });
}
