# Tienda (Express + MySQL)

Instalación rápida:

```bash
cp .env.example .env
# editar .env con credenciales MySQL
npm install
# crear la base de datos
mysql -u root -p < schema.sql
npm start
```

Endpoints principales:
- `POST /api/auth/register` -> register {nombre,email,password,nivel}
- `POST /api/auth/login` -> login {email,password} -> {token}
- `GET /api/products` -> listar
- `GET /api/products/:codigo` -> ver por código
- `POST /api/products` -> crear (admin, Authorization: Bearer TOKEN)
- `POST /api/cart/add` -> agregar al carrito (Authorization)
- `GET /api/cart/me` -> ver mi carrito (Authorization)
- `POST /api/cart/empty` -> vaciar carrito (Authorization)
