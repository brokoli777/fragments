// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

const { Fragment } = require('../../src/model/fragment');
const sharp = require('sharp');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // Test for getting a fragment by id
  test('authenticated users can get a fragment by id', async () => {
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    const res = await request(app)
      .get(`/v1/fragments/${postRequest.body.fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('hello world');
  });

  test('authenticated users can get a fragment by id with .txt extension', async () => {
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('test 123'));

    const res = await request(app)
      .get(`/v1/fragments/${postRequest.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="fragment.txt"');
    expect(res.text).toBe('test 123');
  });

  test('error when fragment cannot be converted to invalid conversion type', async () => {
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hihihi'));

    const res = await request(app)
      .get(`/v1/fragments/${postRequest.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Not allowed to convert to specified format');
  });

  test('Convert Markdown to HTML', async () => {
    const markdownContent = '## Hey there\n\nHello, **Yooo**!';

    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'text/markdown',
    });

    await fragment.save();

    // Set data for the fragment
    await fragment.setData(Buffer.from(markdownContent));

    // get the fragment as HTML
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(getRes.text).toContain('<h2>Hey there</h2>\n<p>Hello, <strong>Yooo</strong>!</p>\n');
  });

  test('Error on unsupported conversion type', async () => {
    const markdownContent = '## Unsupported';

    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'text/markdown',
    });

    await fragment.setData(Buffer.from(markdownContent));
    await fragment.save();
    
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.xml`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Not allowed to convert to specified format');
  });


  test('Convert HTML to Text', async () => {
    const htmlContent = '<p>Hello World</p>';
  
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'text/html',
    });
  
    await fragment.save();
    await fragment.setData(Buffer.from(htmlContent));
  
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.txt`)
      .auth('user1@email.com', 'password1');
  
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(getRes.text).toContain('Hello World');
  });
  
  test('Convert CSV to JSON', async () => {
    const csvContent = 'name,age\nJohn,30\nDoe,40';
  
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'text/csv',
    });
  
    await fragment.save();
    await fragment.setData(Buffer.from(csvContent));
  
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.json`)
      .auth('user1@email.com', 'password1');
  
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(getRes.body).toEqual([{ name: 'John', age: '30' }, { name: 'Doe', age: '40' }]);
  });
  
  test('Convert JSON to YAML', async () => {
    const jsonContent = JSON.stringify({ name: 'John', age: 30 });
  
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'application/json',
    });
  
    await fragment.save();
    await fragment.setData(Buffer.from(jsonContent));
  
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.yaml`)
      .auth('user1@email.com', 'password1');
  
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('application/yaml; charset=utf-8');
    expect(getRes.text).toContain('name: John\nage: 30\n');
  });
  
  test('Convert PNG to JPEG', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    }).png().toBuffer();
  
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'image/png',
    });
  
    await fragment.save();
    await fragment.setData(imageBuffer);
  
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.jpg`)
      .auth('user1@email.com', 'password1');
  
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('image/jpeg');
  });

  test('Getting image file type as the same format', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    }).png().toBuffer();
  
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'image/png',
    });
  
    await fragment.save();
    await fragment.setData(imageBuffer);
  
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('image/png');
  });
  
  
  test('Convert WebP to GIF', async () => {
    const webpBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    }).webp().toBuffer();
  
    const fragment = new Fragment({
      ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
      type: 'image/webp',
    });
  
    await fragment.save();
    await fragment.setData(webpBuffer);
  
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}.gif`)
      .auth('user1@email.com', 'password1');
  
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('image/gif');
  });
  
  
});
