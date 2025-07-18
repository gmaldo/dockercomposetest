# Despliegue de Employee App en Kubernetes

Este documento explica la arquitectura de la aplicación en Express y su base de datos MongoDB en un clúster de Kubernetes, junto con los comandos necesarios para su despliegue y verificación.

## Arquitectura del Despliegue

La solución se divide en dos componentes principales: la base de datos MongoDB y la aplicación Node.js.

### 1. Base de Datos: MongoDB Replica Set

Para asegurar la alta disponibilidad y la replicación de datos, MongoDB no se despliega como un simple pod, sino como un clúster replicado.

- **`StatefulSet` (`mongo-statefulset.yaml`):**
  - **Propósito:** Gestiona el despliegue de la base de datos. A diferencia de un `Deployment`, un `StatefulSet` proporciona garantías sobre el orden y la unicidad de los pods.
  - **Características Clave:**
    - **Identidad Estable:** Los pods se crean con nombres predecibles y persistentes (`mongo-0`, `mongo-1`, `mongo-2`).
    - **Almacenamiento Persistente:** Cada pod obtiene su propio `PersistentVolumeClaim`, asegurando que sus datos sobrevivan a reinicios y fallos.
    - **Replicación:** Se despliegan 3 réplicas para formar un clúster. El comando `--replSet rs0` instruye a cada instancia de MongoDB para que pertenezca a un conjunto de réplicas llamado `rs0`.

- **`Service Headless` (`mongo-headless-service.yaml`):**
  - **Propósito:** Permite que los pods del `StatefulSet` se descubran entre sí para formar el clúster.
  - **Características Clave:**
    - `clusterIP: None`: Al no tener una IP de clúster propia, el servicio devuelve directamente las IPs de los pods (`mongo-0`, `mongo-1`, `mongo-2`) cuando se le hace una consulta DNS. Esto es crucial para que el replica set se pueda inicializar correctamente.

### 2. Aplicación: Employee App

La aplicación Node.js es un servicio sin estado (stateless), por lo que se gestiona con un `Deployment`.

- **`Deployment` (`app-deployment.yaml`):**
  - **Propósito:** Gestiona los pods de la aplicación. Se asegura de que siempre haya 3 réplicas corriendo.
  - **Características Clave:**
    - **Replicas:** Se especifican 3 réplicas para distribuir la carga y proporcionar tolerancia a fallos.
    - **Conexión a la BD:** La variable de entorno `MONGODB_URI` se configura para apuntar a los 3 pods de MongoDB a través de sus nombres de DNS estables, proporcionados por el `StatefulSet` y el `Service Headless`.
      ```
      mongodb://mongo-0.mongo-headless-service:27017,mongo-1.mongo-headless-service:27017,mongo-2.mongo-headless-service:27017/employee_db?replicaSet=rs0
      ```

- **`Service NodePort` (`app-service.yaml`):**
  - **Propósito:** Expone la aplicación fuera del clúster de Kubernetes para que se pueda acceder a ella desde el exterior.
  - **Características Clave:**
    - `type: NodePort`: Kubernetes asigna un puerto estático en cada Nodo del clúster (en un rango de 30000-32767 por defecto). Cualquier tráfico a `IP_DEL_NODO:PUERTO_ASIGNADO` se redirige al puerto `3000` de los pods de la aplicación.

## Comandos para el Despliegue y Verificación

Sigue estos pasos en orden desde la raíz del proyecto.

### Paso 0: Construir la Imagen de Docker (Requisito)
Antes de que Kubernetes pueda desplegar la aplicación, la imagen de Docker debe estar construida y disponible en un registro (como Docker Hub) o en el registro interno del clúster (si usas Minikube, por ejemplo).

```bash
docker build -t gmaldo/employee_app:1.0.1 ./employee_app
```
- `-t gmaldo/employee_app:1.0.1`: Asigna el nombre y la etiqueta a la imagen. Este nombre debe coincidir con el que se usa en `app-deployment.yaml`.
- `./employee_app`: Es la ruta al directorio que contiene el `Dockerfile`.

*Nota: Si no usas un registro público como Docker Hub, asegúrate de que tu clúster de Kubernetes tenga acceso a la imagen. Para Minikube, puedes cargar la imagen directamente en el clúster con `minikube image load gmaldo/employee_app:1.0.1`.*


### Paso 1: Aplicar los Manifiestos
Este comando crea todos los recursos definidos en los archivos `.yaml`.

```bash
kubectl apply -f .
```
*(Nota: Es normal ver un error sobre `docker-compose.yml`, ya que no es un manifiesto de Kubernetes. Puedes ignorarlo).*

### Paso 2: Inicializar el Replica Set de MongoDB
Una vez que los pods de MongoDB están corriendo, hay que configurarlos para que trabajen como un clúster.

```bash
kubectl exec -it mongo-0 -- mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongo-0.mongo-headless-service:27017"}, {_id: 1, host: "mongo-1.mongo-headless-service:27017"}, {_id: 2, host: "mongo-2.mongo-headless-service:27017"}]})'
```
Una salida con `{ "ok": 1 }` confirma que el clúster se ha inicializado.

### Paso 3: Verificar el Estado del Despliegue
Comprueba que todos los pods y servicios estén corriendo correctamente.

```bash
kubectl get pods,svc
```
Busca que todos los pods tengan el estado `Running`.

### Paso 4: Obtener el Puerto y Acceder a la Aplicación

1.  **Encuentra el puerto asignado:** En la salida del comando anterior, localiza la línea del servicio `employee-app-service`.
    ```
    NAME                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
    employee-app-service     NodePort    10.102.71.95   <none>        3000:30898/TCP   5m
    ```
    El puerto asignado es el que aparece después de los dos puntos (en este ejemplo, `30898`).

2.  **Obtén la IP de tu clúster:**
    - Si usas **Minikube**:
      ```bash
      minikube ip
      ```
    - Para otras configuraciones de Kubernetes (como Docker Desktop, etc.):
      ```bash
      kubectl get nodes -o wide
      ```
      Usa la IP que aparece en la columna `INTERNAL-IP`.

3.  **Accede a la aplicación:** Abre la siguiente URL en tu navegador, reemplazando los valores correspondientes:
    ```
    http://<IP-DEL-NODO>:<PUERTO-ASIGNADO>
    ```
    Por ejemplo: `http://192.168.49.2:30898`

### Paso 5 (Opcional): Conexión Directa a las Réplicas de MongoDB
Para inspeccionar el estado del clúster de MongoDB con una herramienta como MongoDB Compass, necesitas reenviar los puertos de los pods a tu máquina local.

Primero, abre **3 terminales separadas** y ejecuta un comando en cada una. Déjalas corriendo mientras usas Compass.

**Terminal 1 (para mongo-0):**
```bash
kubectl port-forward mongo-0 27017:27017
```

**Terminal 2 (para mongo-1):**
```bash
kubectl port-forward mongo-1 27018:27017
```

**Terminal 3 (para mongo-2):**
```bash
kubectl port-forward mongo-2 27019:27017
```


#### Conexión a una Réplica Individual
Si necesitas conectarte a un nodo específico (por ejemplo, para verificar un secundario), puedes hacerlo usando el parámetro `directConnection=true`. Crea una conexión separada en Compass para cada réplica que quieras inspeccionar.

- **Para conectar a `mongo-0`:**
  ```
  mongodb://localhost:27017/employee_db?directConnection=true
  ```
- **Para conectar a `mongo-1`:**
  ```
  mongodb://localhost:27018/employee_db?directConnection=true
  ```
- **Para conectar a `mongo-2`:**
  ```
  mongodb://localhost:27019/employee_db?directConnection=true
  ```
Cuando se conecta puede observar que todas las replicas tienen los mismos datos. (generados por generate data)