# Api Manager de Empleados

Es una aplicación de gestión de empleados construida con Express.js, MongoDB y Faker.js que permite generar y gestionar datos ficticios de empleados y departamentos de manera sencilla. La misma se encuentra pensada para subir a un contenedor de Docker 🐳.
## 🚀 Descripción de la Aplicación

Esta API REST permite:
- **Generar datos ficticios** de empleados y departamentos usando Faker.js
- **Gestionar empleados** con información completa (personal, laboral, dirección)
- **Administrar departamentos** con presupuestos, managers y ubicaciones
- **Consultar estadísticas** de la organización
- **Filtrar y buscar** empleados por departamento y estado
## 🐳 Dockerfile

La aplicación utiliza una imagen Node.js Alpine:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```
**Características del contenedor:**
- **Imagen base:** Node.js 18 Alpine
- **Puerto expuesto:** 3000
- **Optimización:** Copia primero package.json para aprovechar el cache de Docker
### Construir la imagen manualmente
```bash
docker build -t employee-app .
docker run -e MONGODB_URI=mongodb://172.17.0.2 -p 3000:3000 employee-app
```
donde ```MONGODB_URI``` es la direccion mongo de mongoDB puede ser una instalacion local, un contendedor o MongoAtlas.

La imagen de Dockerfile se la puede encontrar en DockerHub:
```bash
docker pull gmaldo/employee_app:1.0.0
```
Pagina de dockerhub: https://hub.docker.com/r/gmaldo/employee_app

 ## 🐙 Docker Compose

El archivo `docker-compose.yml` orquesta dos servicios principales para no tener que correr MongoDB en otro lado:
### Servicios Configurados

**1. MongoDB (Base de datos):**
```yaml
mongodb:
  image: mongo:7.0
  container_name: employee_mongodb
  ports: "27017:27017"
  volumes: mongodb_data:/data/db
```

**2. Express App (API):**
```yaml
app:
  build: .
  container_name: employee_app  
  ports: "3000:3000"
  depends_on: mongodb
  environment:
    MONGODB_URI: mongodb://mongodb:27017/employee_db
```
### Ejecutar con Docker Compose

```bash
# Ejecutar en primer plano (ver logs en tiempo real)
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build

# Ver logs de la aplicación
docker-compose logs -f app

# Ver logs de MongoDB
docker-compose logs -f mongodb

# Parar todos los servicios
docker-compose down

# Parar y eliminar datos persistentes
docker-compose down -v
```

### Ventajas del Docker Compose
- **Networking automático:** Los contenedores se comunican por nombre
- **Dependencias:** La app espera a que MongoDB esté listo
- **Persistencia:** Los datos de MongoDB se guardan en un volumen

## 📋 Endpoints de la API

### 🏠 Endpoint Principal

#### `GET /`
Información general de la API y endpoints disponibles.

**Respuesta:**
```json
{
  "message": "Employee Management API is running!",
  "endpoints": {
    "generateData": "POST /generateData",
    "employees": "GET /employees", 
    "departments": "GET /departments",
    "clearData": "DELETE /clearData"
  }
}
```

### 🎲 Generación de Datos

#### `POST /generateData`
Genera datos ficticios de empleados y departamentos.

**Body (opcional):**
```json
{
  "employeeCount": 100,
  "departmentCount": 6
}
```

**Respuesta exitosa:**
```json
{
  "message": "Data generated successfully!",
  "data": {
    "employeesCreated": 100,
    "departmentsCreated": 6
  }
}
```

### 👥 Gestión de Empleados

#### `GET /employees`
Obtiene la lista de empleados con filtros opcionales.

**Query Parameters:**
- `department` - Filtrar por departamento (IT, Marketing, Sales, HR, Finance, Operations)
- `status` - Filtrar por estado (active, inactive, terminated)
- `limit` - Límite de resultados (default: 50)

**Ejemplo de respuesta:**
```json
{
  "count": 25,
  "employees": [
    {
      "_id": "...",
      "firstName": "Juan",
      "lastName": "Pérez", 
      "email": "juan.perez@example.com",
      "department": "IT",
      "position": "Software Engineer",
      "salary": 75000,
      "status": "active"
    }
  ]
}
```

### 🏢 Gestión de Departamentos

#### `GET /departments`
Obtiene todos los departamentos ordenados alfabéticamente.

**Respuesta:**
```json
{
  "count": 6,
  "departments": [
    {
      "_id": "...",
      "name": "IT",
      "description": "Information Technology Department",
      "manager": "María García",
      "budget": 1500000,
      "location": "Buenos Aires",
      "employeeCount": 15
    }
  ]
}
```

### 📊 Estadísticas

#### `GET /stats`
Obtiene estadísticas generales de empleados y departamentos.

**Respuesta:**
```json
{
  "totalEmployees": 150,
  "activeEmployees": 142,
  "departmentStats": [
    {
      "_id": "IT",
      "count": 25,
      "avgSalary": 78500
    }
  ]
}
```

### 🗑️ Limpieza de Datos

#### `DELETE /clearData`
Elimina todos los empleados y departamentos de la base de datos.

**Respuesta:**
```json
{
  "message": "All data cleared successfully!"
}
```
## 💻 Ejemplos de Uso con cURL

### 1. Verificar que la API está funcionando
```bash
curl http://localhost:3000/
```

### 2. Generar datos de prueba (con valores por defecto)
```bash
curl -X POST http://localhost:3000/generateData
```

### 3. Generar datos personalizados
```bash
curl -X POST http://localhost:3000/generateData \
  -H "Content-Type: application/json" \
  -d '{"employeeCount": 200, "departmentCount": 8}'
```

### 4. Obtener todos los empleados
```bash
curl http://localhost:3000/employees
```

### 5. Filtrar empleados del departamento IT
```bash
curl "http://localhost:3000/employees?department=IT&limit=10"
```

### 6. Obtener solo empleados activos
```bash
curl "http://localhost:3000/employees?status=active"
```

### 7. Ver todos los departamentos
```bash
curl http://localhost:3000/departments
```

### 8. Consultar estadísticas
```bash
curl http://localhost:3000/stats
```

### 9. Limpiar todos los datos
```bash
curl -X DELETE http://localhost:3000/clearData
```
## 📝 Notas Adicionales

### Persistencia de Datos
- Los datos de MongoDB se almacenan en un volumen Docker
- Los datos persisten entre reinicios del contenedor
- Para eliminar datos: `docker-compose down -v`

## 🚨 Solución de Problemas

### Puerto 3000 ya está en uso
```bash
# Cambiar el puerto en docker-compose.yml
ports:
  - "3001:3000"  # Usar puerto 3001 en lugar de 3000
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```