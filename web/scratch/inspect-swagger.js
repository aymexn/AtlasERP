const http = require('http');

http.get('http://127.0.0.1:3000/api-json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const spec = JSON.parse(data);
      console.log('Available schemas in Swagger:', Object.keys(spec.components?.schemas || {}));
      
      const customerPath = spec.paths['/customers'];
      console.log('\nPOST /customers details:', JSON.stringify(customerPath?.post, null, 2));
    } catch (e) {
      console.error('Failed to parse Swagger JSON:', e);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching Swagger JSON:', err);
});
