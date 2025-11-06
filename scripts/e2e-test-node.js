const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function createClient() {
  const jar = new tough.CookieJar();
  const client = wrapper(axios.create({
    baseURL: BASE,
    jar,
    withCredentials: true,
    timeout: 20000,
    headers: { 'Accept': 'application/json' }
  }));
  return { client, jar };
}

async function getCsrf(client) {
  const res = await client.get('/auth/csrf');
  return res.data && res.data.csrfToken;
}

async function adminCreateInspection() {
  const { client } = await createClient();
  const csrf = await getCsrf(client);
  console.log('Admin CSRF:', csrf ? '[got]' : '[missing]');

  const loginRes = await client.post('/auth/login', { email: 'admin@empresa.com', password: 'Admin123' }, { headers: { 'x-csrf-token': csrf } });
  console.log('Admin login status:', loginRes.status);

  const csrf2 = await getCsrf(client);
  const today = new Date().toISOString().split('T')[0];

  const payload = {
    title: 'E2E Test Inspeccion',
    inspection: {
      sections: {
        ubicacion: { oficina: 'Oficina E2E', edificio: 'Edificio E2E', piso: '1' },
        observaciones: { observaciones_generales: 'Prueba E2E' }
      },
      images_base64: []
    },
    assignedTo: 'demo@empresa.com',
    date: today
  };

  const createRes = await client.post('/api/inspections', payload, { headers: { 'x-csrf-token': csrf2 } });
  console.log('Create inspection response:', createRes.status, createRes.data);
  return createRes.data && createRes.data.id_tarea;
}

async function demoFlow(taskId) {
  const { client } = await createClient();
  const csrf = await getCsrf(client);
  console.log('Demo CSRF:', csrf ? '[got]' : '[missing]');

  const loginRes = await client.post('/auth/login', { email: 'demo@empresa.com', password: 'Demo123' }, { headers: { 'x-csrf-token': csrf } });
  console.log('Demo login status:', loginRes.status);

  // Attempt to mark as done without photos
  const csrf2 = await getCsrf(client);
  try {
    const putRes = await client.put(`/api/tasks/${taskId}`, { status: 'done' }, { headers: { 'x-csrf-token': csrf2 } });
    console.log('Unexpected success marking done without photo:', putRes.status, putRes.data);
  } catch (err) {
    if (err.response) {
      console.log('Expected rejection when marking done without photo:', err.response.status, err.response.data);
    } else {
      throw err;
    }
  }

  // Upload an image (tiny 1x1 PNG base64)
  const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAf0lPgQAAAABJRU5ErkJggg==';
  const imgPayload = { images: [{ name: 'e2e-test.png', type: 'image/png', data: base64 }] };
  const csrf3 = await getCsrf(client);
  const uploadRes = await client.post(`/api/tasks/${taskId}/images`, imgPayload, { headers: { 'x-csrf-token': csrf3 } });
  console.log('Upload images response:', uploadRes.status, uploadRes.data);

  // Now mark as done
  const csrf4 = await getCsrf(client);
  const finalRes = await client.put(`/api/tasks/${taskId}`, { status: 'done' }, { headers: { 'x-csrf-token': csrf4 } });
  console.log('Final PUT status:', finalRes.status, finalRes.data);

  // Verify filesystem
  const uploadDir = path.join(__dirname, '..', 'uploads', 'tasks', String(taskId));
  const exists = fs.existsSync(uploadDir);
  const files = exists ? fs.readdirSync(uploadDir) : [];
  console.log('Upload dir exists:', exists, 'files:', files);
}

async function run() {
  try {
    console.log('Base URL:', BASE);
    const taskId = await adminCreateInspection();
    if (!taskId) throw new Error('No task ID returned from create inspection');
    console.log('Created task id:', taskId);
    await demoFlow(taskId);
    console.log('E2E script completed.');
  } catch (err) {
    console.error('E2E script error:', err && err.message ? err.message : err);
    if (err.response) {
      console.error('Response data:', err.response.status, err.response.data);
    }
    process.exitCode = 1;
  }
}

run();
