# Plataforma de Playtesting para Juegos Indie

Base inicial de la Fase 1 con Spring Boot, Maven y PostgreSQL local.

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
3. Ejecutar el backend con `mvn spring-boot:run`. Spring ejecutará `schema.sql`.
4. Cargar datos de demostración con `psql -d playtesting -f src/main/resources/db/data_seed.sql`.

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
