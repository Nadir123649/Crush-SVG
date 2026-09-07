const fs = require('fs');

const path = 'src/app/admin/settings/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Extract sections using regex
const generalMatch = content.match(/\{\/\* General Settings Card \*\/\}\s*<section[\s\S]*?<\/section>/);
const adminMatch = content.match(/\{\/\* Admin Access Card \*\/\}\s*<section[\s\S]*?<\/section>/);
const apiMatch = content.match(/\{\/\* API Keys Card \*\/\}\s*<section[\s\S]*?<\/section>/);
const subMatch = content.match(/\{\/\* Billing & Subscription Card \*\/\}\s*<section[\s\S]*?<\/section>/);
const permMatch = content.match(/\{\/\* Permissions Card \*\/\}\s*<section[\s\S]*?<\/section>/);

if (generalMatch && adminMatch && apiMatch && subMatch && permMatch) {
  let general = generalMatch[0];
  let admin = adminMatch[0];
  let api = apiMatch[0];
  let sub = subMatch[0];
  let perm = permMatch[0];

  // Modify section classes to include col-span and flex layout
  general = general.replace('<section className="bg-white', '<section className="xl:col-span-2 bg-white flex flex-col h-full');
  general = general.replace('<form className="space-y-6"', '<form className="space-y-6 flex-1 flex flex-col"');
  general = general.replace('<div className="flex justify-end">', '<div className="flex justify-end mt-auto pt-6">');

  sub = sub.replace('<section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col">', '<section className="xl:col-span-1 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col h-full">');
  
  admin = admin.replace('<section className="bg-white', '<section className="xl:col-span-2 bg-white flex flex-col h-full');
  admin = admin.replace('<form className="space-y-6"', '<form className="space-y-6 flex-1 flex flex-col"');
  admin = admin.replace('<div className="flex justify-end">', '<div className="flex justify-end mt-auto pt-6">');

  perm = perm.replace('<section className="bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)]">', '<section className="xl:col-span-1 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col h-full">');
  
  api = api.replace('<section className="bg-white', '<section className="xl:col-span-3 bg-white');

  const newGrid = `      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        ${general}
        
        ${sub}
        
        ${admin}
        
        ${perm}
        
        ${api}
        
      </div>
    </div>`;

  // Replace the entire grid layout in the file
  const startGrid = content.indexOf('{/* Bento Grid Layout */}');
  const endGrid = content.lastIndexOf('</div>\n    </div>') + '</div>\n    </div>'.length;
  
  content = content.substring(0, startGrid) + newGrid + content.substring(endGrid);
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Layout updated successfully');
} else {
  console.log('Failed to extract all sections');
}
