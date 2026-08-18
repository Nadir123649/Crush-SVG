const fs = require('fs');

function fixFile(path, bgOld, bgNew) {
  let html = fs.readFileSync(path, 'utf-8');
  html = html.replace(new RegExp(bgOld, 'g'), bgNew);
  html = html.replace(/\.svg"/g, '.png"');
  // fix the messed up logo from previous step if it exists
  html = html.replace(
    '<a href="#" style="display: inline-block; text-decoration: none;"><img src="https://res.cloudinary.com/df80crgrw/image/upload/v1786613349/twitter_h4pobn.png" width="30" height="30" alt="Twitter" border="0" style="display: block;"></a>',
    '<a href="https://crush-svg.vercel.app/" target="_blank"><img src="https://res.cloudinary.com/df80crgrw/image/upload/v1786610399/CrushSVG-logo_qsusgx.png" width="26" height="26" alt="CrushSVG" border="0" style="display: block;"></a>'
  );
  fs.writeFileSync(path, html);
}

fixFile(
  'src/emails/email-verification.html',
  'https://res.cloudinary.com/df80crgrw/image/upload/v1786948542/Group_1948755078_1_f5hana.png',
  'https://res.cloudinary.com/df80crgrw/image/upload/v1787030374/Group_1948755078_3_a0sdtu.png'
);

fixFile(
  'src/emails/reset-password.html',
  'https://res.cloudinary.com/df80crgrw/image/upload/v1786948547/Group_1948755078_2_i2meqt.png',
  'https://res.cloudinary.com/df80crgrw/image/upload/v1787030351/Group_1948755079_w3vrsx.png'
);

console.log('Fixed both templates');
