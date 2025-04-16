const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');
const cors = require('cors');

// Habilita CORS para todas as origens
server.use(cors({ origin: '*' }));

server.use(middlewares);
server.use(bodyParser.json());

// Custom login endpoint
server.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = router.db; // lowdb instance
  const user = db.get('users').find({ email, password }).value();

  if (user) {
    // Mock token generation
    res.jsonp({
      accessToken: 'mock-token-' + user.id,
      user: { id: user.id, email: user.email }
    });
  } else {
    res.status(401).jsonp({ error: 'Invalid credentials' });
  }
});

server.use(router);
server.listen(process.env.PORT || 3000, () => {
  console.log('JSON Server with auth is running');
});
