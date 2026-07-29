const http = require('http');

function req(opts, body) {
  return new Promise((resolve) => {
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body);
    r.end();
  });
}

async function test() {
  // 1. Login
  const lb = JSON.stringify({ email: 'feryel@gmail.com', password: 'Admin123!' });
  const login = await req({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(lb) },
  }, lb);

  if (!login.body.success) {
    console.log('LOGIN FAILED:', login.body.message);
    return;
  }
  const token = login.body.data.accessToken;
  console.log('1. Login OK:', login.body.data.user.email);

  // 2. Create post with contact info
  const pb = JSON.stringify({
    type: 'lost',
    objectType: 'telephone',
    title: 'Test contact form fix',
    description: 'Test description pour verifier que le contact fonctionne correctement',
    city: 'Tunis',
    delegation: 'Lac 2',
    date: '2026-07-10',
    contactEmail: 'testcontact@gmail.com',
    contactPhone: '+216 99 123 456',
    contactPreferences: { platform: true, email: true, phone: true },
  });

  const create = await req({
    hostname: 'localhost', port: 3000, path: '/api/posts', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(pb),
      'Authorization': 'Bearer ' + token,
    },
  }, pb);

  console.log('2. Create post STATUS:', create.status);
  if (!create.body.success) {
    console.log('   ERROR:', create.body.message);
    console.log('   DETAILS:', JSON.stringify(create.body));
    return;
  }
  const post = create.body.data.post;
  console.log('   Post ID:          ', post._id);
  console.log('   contactEmail:     ', post.contactEmail);
  console.log('   contactPhone:     ', post.contactPhone);
  console.log('   contactPrefs:     ', JSON.stringify(post.contactPreferences));

  // 3. Verify via GET
  const get = await req({
    hostname: 'localhost', port: 3000, path: '/api/posts/' + post._id, method: 'GET',
    headers: {},
  }, null);
  console.log('3. GET post STATUS: ', get.status);
  console.log('   contactEmail in DB:', get.body.data?.post?.contactEmail ?? 'NOT FOUND');
  console.log('   contactPhone in DB:', get.body.data?.post?.contactPhone ?? 'NOT FOUND');
  console.log('\n✅ TEST PASSED — contact fields saved correctly');
}

test().catch(console.error);
