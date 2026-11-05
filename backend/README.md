# Plataforma de Playtesting para Juegos Indie

Backend de la Fase 1 con Spring Boot, Maven y PostgreSQL local. El frontend React
se encuentra en la carpeta hermana `../frontend`.

## Estructura del repositorio

```text
backend/
├── pom.xml
├── src/
├── uploads/
└── README.md
frontend/
├── package.json
└── src/
```

## Estructura recomendada

```text
src/
├── main/
│   ├── java/com/playtesting/platform/
│   │   ├── config/          # Configuración de Spring y seguridad
│   │   ├── controller/      # Endpoints REST
│   │   ├── dto/             # Objetos de entrada y salida de API
│   │   ├── entity/          # Entidades JPA
│   │   ├── exception/       # Errores y manejador global
│   │   ├── repository/      # Repositorios Spring Data
│   │   ├── service/         # Reglas de negocio
│   │   └── PlaytestingPlatformApplication.java
│   └── resources/
│       ├── db/
│       │   ├── schema.sql   # DDL de PostgreSQL
│       │   └── data_seed.sql
│       └── application.properties
└── test/
    └── java/com/playtesting/platform/
pom.xml
```

## Uso local

1. Crear la base de datos: `CREATE DATABASE playtesting;`.
2. Ajustar `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` si las credenciales locales son distintas.
3. Desde `backend/`, ejecutar el backend con `mvn spring-boot:run`. Spring ejecutará `schema.sql`.
4. Desde `backend/`, cargar datos de demostración con `psql -d playtesting -f src/main/resources/db/data_seed.sql`.

El hash del seed corresponde a una contraseña de demostración; debe reemplazarse antes de cualquier entorno compartido.

## Autenticación

La aplicación expone:

- `POST /api/auth/register`: registra un usuario y devuelve un JWT.
- `POST /api/auth/login`: acepta `identifier` como username o email y devuelve un JWT.

### Registro

```bash
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"ana_creator\",\"email\":\"ana@example.com\",\"password\":\"Password123!\",\"role\":\"CREATOR\"}"
```

Respuesta:

```json
{
  "jwtToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "username": "ana_creator",
  "role": "CREATOR"
}
```

### Login por email

```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"identifier\":\"ana@example.com\",\"password\":\"Password123!\"}"
```

### Consumir un endpoint protegido

```bash
curl http://localhost:8080/api/protected-resource ^
  -H "Authorization: Bearer <jwtToken>"
```

Para desarrollo local se usa un secreto JWT base64 de demostración. En cualquier entorno compartido se debe definir `JWT_SECRET` con una clave base64 propia de al menos 256 bits.

## Prototipos de juegos

Los usuarios con rol `CREATOR` pueden publicar prototipos mediante
`POST /api/games` usando `multipart/form-data`. El campo `game` debe ser una
parte JSON y `file` el ejecutable, proyecto WebGL comprimido o PDF:

```bash
curl -X POST http://localhost:8080/api/games ^
  -H "Authorization: Bearer <JWT_DEL_CREATOR>" ^
  -F "game={\"title\":\"Astro Garden\",\"description\":\"Prototipo inicial\",\"genre\":\"Puzzle\",\"platform\":\"WEBGL\"};type=application/json" ^
  -F "file=@C:\ruta\astro-garden.zip"
```

Los archivos se almacenan localmente en `uploads/games/` con nombres UUID.
El directorio puede cambiarse mediante la variable `GAMES_STORAGE_DIR`.

- `GET /api/games`: lista los prototipos publicados.
- `GET /api/games/{id}`: muestra el detalle de un prototipo.
- `GET /api/games/{id}/download`: descarga su archivo.

## Frontend

Desde `frontend/`, instalar dependencias y ejecutar Vite:

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` y consumirá el backend
en `http://localhost:8080`. Para cambiar esa dirección, definir
`VITE_API_URL` antes de iniciar Vite.
