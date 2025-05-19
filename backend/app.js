require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const addressRoutes = require('./routes/address.routes');
const orderRoutes = require('./routes/order.routes');
const authRoutes = require('./routes/auth.routes');
const recipeRoutes = require('./routes/recipe.routes');
const commentRoutes = require('./routes/comment_recipe.routes');

app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/user', userRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recipe', recipeRoutes);
app.use('/api/comment', commentRoutes);

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API Cakeria</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 50px;
            background-color: #f8f8f8;
          }
          h1 {
            color: #d2691e;
          }
          p {
            color: #555;
          }
          .container {
            padding: 20px;
            background: white;
            display: inline-block;
            border-radius: 10px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🍰 API Cakeria - Confeitaria 🍰</h1>
          <p>Bem-vindo à API da Cakeria! Use as rotas disponíveis para interagir com o sistema.</p>
    
        </div>  
      </body>
    </html>
  `);
});

sequelize
  .sync({ force: false })
  .then(() => {
    // console.log('Conexão com banco de dados estabelecida');
    app.listen(PORT, () => {
      // console.log(`Acesse: http://localhost:${PORT}`);
      // console.log(`Porta recebida do .env: ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco de dados:', err);
  });
