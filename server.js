const http = require('http');
const url = require('url');
const parse = require('parse-js');

const books = [
  { id: 1, title: 'The Old Man and the Sea', author: 'Ernest Hemingway' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  { id: 3, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' }
];

const server = http.createServer((req, res) => {
  const { method, url } = req;
  console.log(req.url)
  const { pathname, query } = url.parse(url, true);
  var path = req.url.split('?')[0];


  if (method === 'GET' && pathname === '/books') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(books));
  } else if (method === 'POST' && pathname === '/books') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const book = JSON.parse(body);
      books.push(book);
      res.end(JSON.stringify(book));
    });
  } else if (method === 'PUT' && pathname === '/books') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const book = JSON.parse(body);
      const index = books.findIndex((b) => b.id === book.id);
      books[index] = book;
      res.end(JSON.stringify(book));
    });
  } else if (method === 'DELETE' && pathname === '/books') {
    const id = parseInt(query.id);
    const index = books.findIndex((b) => b.id === id);
    books.splice(index, 1);
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(3000, () => {
  console.log('Listening on port 3000');
});
