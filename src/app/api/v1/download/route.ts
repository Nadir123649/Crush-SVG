import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const fileUrl = 'https://raw.githubusercontent.com/jankovicsandras/imagetracerjs/master/imagetracer_v1.2.6.js';
  
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    let data = await response.text();
    const dir = path.join(process.cwd(), 'src', 'lib', 'utils');
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // The library already has module.exports, no need to append it.
    // data += '\nmodule.exports = ImageTracer;\n';
    
    fs.writeFileSync(path.join(dir, 'imagetracer.js'), data);
    return NextResponse.json({ success: true, length: data.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
