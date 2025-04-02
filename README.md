![Cocos Capital Logo](https://yt3.googleusercontent.com/359Au__1e75nzln7o9zoNiRqOq0qzTuykPZDdIVyP28kGNIOVOQ0zCh73BNggsV1gWGSjhle5g=s900-c-k-c0x00ffffff-no-rj)

# Backend Challenge

## Introducción

Challenge para backend dev de [Lautaro López](https://lautarolopez.tech).

## Tecnologías utilizadas

- **Node.js**: Entorno de ejecución para JavaScript en el servidor.
- **Express**: Framework para crear APIs REST de manera rápida y sencilla.
- **Prisma**: ORM utilizado para el manejo de la base de datos y migraciones.
- **PostgreSQL**: Sistema de gestión de bases de datos relacional.
- **Docker & Docker Compose**: Contenerización y orquestación de la aplicación y la base de datos.
- **Jest**: Framework para pruebas unitarias y funcionales.
- **ESLint y Prettier**: Herramientas para el análisis estático y formateo del código.
- **Zod**: Validación e inferencia de tipos.

## Endpoints de la API

### Portfolio

- **GET `/api/users/portfolio`**  
  Devuelve la información de la cuenta del usuario, incluyendo:
  - Valor total de la cuenta.
  - Pesos disponibles para operar.
  - Listado de activos: cantidad de acciones, valor monetario total de la posición y rendimiento total (%).

### Buscar activos

- **GET `/api/instruments?q=`**  
  Permite buscar activos en el mercado. Soporta búsqueda por ticker y/o nombre, devolviendo una lista de activos que se asemejan a la consulta.

### Enviar una orden

- **POST `/api/users/orders`**  
  Envía una orden de compra o venta al mercado. Soporta dos tipos de órdenes:
  - **MARKET**: Se ejecuta inmediatamente utilizando el precio de cierre actual.
  - **LIMIT**: Requiere especificar un precio, y la orden se registra con estado **NEW** para ejecutarse posteriormente.  
    Las órdenes pueden tener estados como:
  - **NEW**: Orden límite enviada al mercado.
  - **FILLED**: Orden ejecutada (las órdenes **MARKET** se ejecutan inmediatamente).
  - **REJECTED**: Orden rechazada por no cumplir los requisitos (por ejemplo, saldo insuficiente o cantidad de acciones insuficiente).
  - **CANCELLED**: Orden cancelada por el usuario (solo se puede cancelar una orden en estado **NEW**).

## Correr la aplicación localmente

### Con Node.js

1. **Clonar el repositorio:**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd cocos-challenge-backend
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo .env en la raíz del proyecto y define:

```env
  DATABASE_URL=postgres://<usuario>:<contraseña>@<host>:<puerto>/<nombre_de_la_base>?schema=public
```

4. **Sincronizar el Schema de Prisma:**

```bash
  npx prisma generate && npx prisma db push
```

4. **Ejecutar la aplicación en modo desarrollo:**

```bash
  npm run dev
```

### Con Docker-Compose

Asegúrate de tener Docker y Docker Compose instalados. Luego, en la raíz del proyecto:

1. **Configura las variables de entorno para la base de datos:**
   Puedes definir en tu entorno o en un archivo .env las variables POSTGRES_USER, POSTGRES_PASSWORD y POSTGRES_DB.

2. **Construye y levanta los contenedores:**

```bash
  docker-compose up --build -d
```

## Posibles mejoras

### Proyecto

- Implementar autenticación y autorización.
- Indexar DBs (ticker y nombre en instruments por ejemplo) para mejorar el rendimiento de las búsquedas.
- Agregar tests de E2E que validen el correcto funcionamiento de los flujos completos, utilizando una DB para test.

### DX (Developer Experience)

- Implementar alias e inferencia de extensiones en los imports.

## Uso de la colección de Postman

El proyecto incluye una colección Postman ubicada en ./api.postman_collection.json. Para utilizarla:

1. Abre Postman.
2. Importa la colección seleccionando el archivo api.postman_collection.json (usa la opción “Import” en Postman).
3. Configura las variables de entorno en Postman (por ejemplo, host y port) para que apunten a tu instancia de la API.
4. Ejecuta las solicitudes de la colección para probar los diferentes endpoints de la API.
