# Pasos para Configurar y Ejecutar el Pipeline de Jenkins

A continuación se detallan los pasos para configurar y ejecutar el pipeline de Jenkins definido en el `Jenkinsfile` de este repositorio.

## Prerrequisitos

1.  **Tener Jenkins instalado:** Asegúrate de tener una instancia de Jenkins funcional.

2.  **Instalar Plugins de Docker:** Ve a `Manage Jenkins` > `Plugins` > `Available plugins` e instala los siguientes plugins necesarios para la integración con Docker:
    *   Docker API Plugin
    *   Docker Commons Plugin
    *   Docker Pipeline
    *   Docker Plugin
![Plugins docker](https://i.ibb.co/kV14PpYV/Captura-de-pantalla-2025-07-18-a-la-s-8-27-15-p-m.png)

1.  **Permisos de Docker para Jenkins:** El usuario que ejecuta Jenkins debe tener permisos para administrar Docker. Generalmente, esto se logra agregando el usuario `jenkins` al grupo `docker` en el servidor donde se ejecuta Jenkins:
    ```bash
    addgroup docker
    addgroup jenkins docker
    chgrp docker /var/run/docker.sock
    chmod 660 /var/run/docker.sock
    ```
    Después de ejecutar este comando, es necesario reiniciar el servicio de Jenkins.

## Configuración

4.  **Credenciales de Docker Hub:**
    *   En Jenkins, ve a `Manage Jenkins` > `Credentials`.
    *   Selecciona el `(global)` domain y haz clic en `Add Credentials`.
    *   Elige `Username with password` como tipo de credencial.
    *   En `Username`, ingresa tu ID de Docker Hub.
    *   En `Password`, ingresa tu contraseña o un token de acceso de Docker Hub.
    *   En `ID`, ingresa `dockerhub_id`. Este ID es el que se utiliza en el `Jenkinsfile`.
![Credencial dockerhub](https://i.ibb.co/Vc83W6FY/Captura-de-pantalla-2025-07-18-a-la-s-8-28-00-p-m.png)

## Creación y Ejecución del Pipeline

5.  **Crear un Nuevo Pipeline:**
    *   En el panel de Jenkins, haz clic en `New Item`.
    *   Dale un nombre a tu pipeline (por ejemplo, `employee-app-pipeline`).
    *   Selecciona `Pipeline` y haz clic en `OK`.
    *   En la configuración del pipeline, ve a la sección `Pipeline`.
    *   Selecciona `Pipeline script from SCM` en el menú desplegable `Definition`.
    *   En `SCM`, elige `Git`.
    *   En `Repository URL`, pega la siguiente URL: `https://github.com/gmaldo/dockercomposetest.git`.
    *   Asegúrate de que la rama a construir (`Branch Specifier`) sea `*/main` o la que corresponda.
    *   El `Script Path` debe ser `Jenkinsfile`, que es el valor por defecto.
    *   Guarda la configuración.

6.  **Ejecutar el Pipeline:**
    *   Selecciona el pipeline recién creado y haz clic en `Build Now`.
    *   Podrás ver el progreso de la ejecución en el `Build History` y en el `Stage View`.

---

## Descripción del `Jenkinsfile`

El `Jenkinsfile` en este repositorio define un pipeline declarativo para automatizar la construcción y publicación de una imagen de Docker.

### `environment`
Se definen variables de entorno que se utilizarán a lo largo del pipeline:
-   `DOCKER_IMAGE`: El nombre de la imagen de Docker (`gmaldo/employee_app`).
-   `DOCKER_TAG`: La etiqueta para la imagen (`latest`).
-   `DOCKER_CREDENTIALS_ID`: El ID de las credenciales de Docker Hub configuradas en Jenkins (`dockerhub_id`).

### `stages`
El pipeline se divide en las siguientes etapas:

1.  **`Clonar código`**:
    *   Utiliza el paso `checkout scm` para clonar el código fuente del repositorio de Git configurado en el pipeline.

2.  **`Construir imagen Docker`**:
    *   Ejecuta el comando `docker.build` para construir la imagen de Docker.
    *   Utiliza el `Dockerfile` que se encuentra en el directorio `./employee_app`.
    *   La imagen se etiqueta con el nombre y tag definidos en las variables de entorno (`gmaldo/employee_app:latest`).

3.  **`Login en Docker Hub`**:
    *   Utiliza el bloque `docker.withRegistry` para autenticarse en Docker Hub.
    *   Usa las credenciales almacenadas en Jenkins con el ID `dockerhub_id`.

4.  **`Push a Docker Hub`**:
    *   Nuevamente, se autentica en Docker Hub.
    *   Vuelve a construir la imagen para asegurarse de que está disponible para el push.
    *   Utiliza el método `image.push()` para subir la imagen al repositorio de Docker Hub con la etiqueta `latest`.
    *   Adicionalmente, sube la imagen con una etiqueta correspondiente al número de build (`${BUILD_NUMBER}`), permitiendo un versionado de las imágenes.

### `post`
Define acciones que se ejecutan después de que todas las etapas del pipeline han finalizado:
-   **`success`**: Si el pipeline se ejecuta correctamente, imprime un mensaje de éxito indicando la imagen que se ha publicado.
-   **`failure`**: Si el pipeline falla en cualquier etapa, imprime un mensaje de error.
