const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mySuperSecretKey12345';   // keep this safe!
const JWT_EXPIRES_IN = '1h';

// Enable CORS for all origins
server.use(cors({ origin: '*' }));
server.use(middlewares);
server.use((req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') {
    bodyParser.json()(req, res, next);
  } else {
    next();
  }
});

// Public root route (you can customize this if you want a landing page)
server.get('/', (req, res) => {
  res.send('JSON Server with JWT auth is up and running');
});

// Custom login endpoint (no auth required)
server.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = router.db; // lowdb instance
  const user = db.get('users').find({ email, password }).value();

  if (!user) {
    return res.status(401).jsonp({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.jsonp({
    accessToken: token,
    user: { id: user.id, email: user.email }
  });
});

// Auth middleware: protect all other routes
server.use((req, res, next) => {
  // Allow public access to root and login
  if (
    (req.method === 'GET' && req.path === '/') || // Allow root access
    (req.method === 'POST' && req.path === '/login') || // Allow login
    (req.method === 'POST' && req.path === '/users') // Allow user registration
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).jsonp({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Optionally attach user info to req
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).jsonp({ error: 'Invalid or expired token' });
  }
});

// Mount JSON Server router (protected)
server.use(router);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`JSON Server with JWT auth is running on port ${port}`);
});