const fs = require('fs');
const path = require('path');

const files = [
  'src/routes/backups.ts',
  'src/routes/databases.ts',
  'src/routes/panel-deploy.ts',
  'src/routes/projects.ts',
  'src/routes/sftp.ts',
  'src/routes/wordpress.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Substituir req.params.X por (req.params.X as string)
  content = content.replace(/req\.params\.(\w+)(?!\s+as\s+string)/g, '(req.params.$1 as string)');
  
  // Substituir req.user?._id! por req.user?._id!.toString()
  content = content.replace(/req\.user\?\.\_id!(?!\.toString\(\))/g, 'req.user?._id!.toString()');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Corrigido: ${file}`);
});

console.log('\n✅ Todos os arquivos foram corrigidos!');
