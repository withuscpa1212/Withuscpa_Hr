import Koa from 'koa';
import serve from 'koa-static';

const PORT = process.env.PORT || 3000;
const app = new Koa();

app.use(serve('./dist'));

app.listen(PORT);

console.log(`Server is running on http://localhost:${PORT}`);
