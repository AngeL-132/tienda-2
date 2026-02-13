# Deploy en Render

## Pasos para desplegar

### 1. Crear Base de Datos PostgreSQL en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en "New +" → "PostgreSQL"
3. Configura:
   - Name: `tienda-db`
   - Plan: Free
   - Region: Oregon (o la más cercana)
4. Click en "Create Database"
5. Espera a que se aprovisione
6. Una vez creado, click en la base de datos y copia los datos de conexión:
   - Host
   - Port (debería ser 5432)
   - Database
   - Username
   - Password

### 2. Crear Web Service

1. Click en "New +" → "Web Service"
2. Conecta tu repositorio
3. Configura:
   - Name: `tienda`
   - Region: Oregon
   - Branch: main
   - Build Command: `npm install`
   - Start Command: `npm start`

### 3. Configurar Variables de Entorno

En la sección "Environment Variables" del Web Service, agrega:

```
DB_HOST=xxxxx.onrender.com  (copiado de la base de datos)
DB_PORT=5432
DB_USER=xxxxx                (copiado de la base de datos)
DB_PASSWORD=xxxxx            (copiado de la base de datos)
DB_NAME=xxxxx                (nombre de la base de datos, ej: tienda_db)
JWT_SECRET=una-clave-secreta-muy-larga-y-segura
PORT=3000
NODE_ENV=production
```

### 4. Ejecutar el Schema SQL

1. En la página de tu base de datos en Render
2. Click en "Shell"
3. Copia y pega el contenido de `schema.sql` y ejecuta

### 5. Desplegar

1. Click en "Deploy" en tu Web Service
2. Espera a que termine el build
3. Verifica los logs si hay errores

### 6. Verificar

Abre la URL de tu web service y prueba:
- Registrar un usuario
- Iniciar sesión
- Ver productos
