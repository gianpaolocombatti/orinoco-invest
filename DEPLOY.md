# Guía de Despliegue: Orinoco Invest en Vercel + Supabase

Esta guía está diseñada para usuarios SIN experiencia técnica. Sigue cada paso exactamente como se describe.

## Resumen: Qué Estamos Haciendo

Vamos a poner tu aplicación en internet de forma GRATUITA usando:
- **Vercel**: Empresa que maneja el hosting (donde vive tu aplicación)
- **Supabase**: Empresa que maneja la base de datos (donde se guardan tus datos)
- **GitHub**: Servicio que guarda el código (necesario para conectar todo)

**Costo total: $0 USD** (Vercel y Supabase tienen planes gratuitos generosos)

---

## Paso 1: Crear Cuenta en Supabase (Base de Datos)

Una base de datos es como un archivo Excel gigante donde se guardan todos los datos de los usuarios, transacciones, etc.

### 1.1. Abre Supabase
Ve a https://supabase.com en tu navegador.

### 1.2. Haz clic en "Sign Up" (arriba a la derecha)
- Selecciona "Sign up with GitHub" (más fácil)
- Si no tienes cuenta GitHub, haz clic en "Create GitHub account" y sigue los pasos
- **Si usas GitHub**: autoriza a Supabase cuando te lo pida

### 1.3. Crea un Proyecto Nuevo
- Haz clic en "New Project" (botón verde)
- **Nombre del proyecto**: `orinoco-invest` (puedes cambiar)
- **Database password**: Escribe una contraseña FUERTE (ejemplo: `MyP@ssw0rd!2024`)
  - GUARDA ESTA CONTRASEÑA EN UN LUGAR SEGURO, la necesitarás más tarde
- **Region**: Selecciona `us-east-1` (Virginia, USA)
- **Pricing Plan**: Asegúrate de que esté en "Free" (Gratuito)
- Haz clic en "Create new project"

**Espera 1-2 minutos** mientras Supabase configura tu proyecto.

### 1.4. Copia las Credenciales de Conexión
Una vez que el proyecto esté listo:

1. Haz clic en "Settings" (abajo a la izquierda)
2. Haz clic en "Database" en el menú
3. Busca la sección "Connection string" 
4. Haz clic en el tab que dice **"URI"**

Verás dos URLs:

**URL CON POOLER** (usa esta para Vercel):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**URL DIRECTA** (usa esta para migraciones):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Copia AMBAS URLs y pégalas en un archivo de texto (Notepad, Word, etc.).

**Reemplaza `[password]` con la contraseña que escribiste en el paso 1.3.**

### 1.5. Ejecuta la Migración de Base de Datos

1. En Supabase, haz clic en "SQL Editor" (en el menú de la izquierda)
2. Haz clic en "New Query"
3. Abre el archivo `supabase/migrations/001_initial.sql` en tu computadora (está en la carpeta del proyecto)
4. Copia TODO el contenido
5. Pégalo en el editor SQL de Supabase
6. Haz clic en el botón "Run" (o presiona Ctrl+Enter)

Si ves un mensaje de éxito, ¡excelente! Tu base de datos está lista.

---

## Paso 2: Crear Cuenta en GitHub (Guardar el Código)

GitHub es una plataforma donde guardaremos el código de tu aplicación. Vercel lo leerá desde aquí para desplegar.

### 2.1. Abre GitHub
Ve a https://github.com en tu navegador.

### 2.2. Haz Clic en "Sign up" (arriba a la derecha)
- Escribe un email, una contraseña y un nombre de usuario
- Completa la verificación que GitHub te pida
- Elige el plan "Free" (Gratuito)

### 2.3. Crea un Repositorio Nuevo
Un repositorio es como una carpeta en la nube donde va tu código.

1. Ve a https://github.com/new
2. **Repository name**: `orinoco-invest`
3. **Description**: "Plataforma de inversión automática para Venezuela"
4. **Visibility**: Selecciona "Public" (público, es más fácil)
5. NO marques "Initialize this repository with..." (queremos subir nuestros archivos)
6. Haz clic en "Create repository"

**GitHub te mostrará instrucciones.** Ignóralas por ahora, vamos al siguiente paso.

---

## Paso 3: Sube Tu Código a GitHub

### 3.1. Descargar GitHub Desktop (La Forma Fácil)

No usaremos línea de comando. Usaremos GitHub Desktop, que es más fácil.

1. Ve a https://desktop.github.com
2. Descarga GitHub Desktop para tu sistema operativo (Windows o Mac)
3. Instálalo y abre la aplicación

### 3.2. Inicia Sesión en GitHub Desktop
- Haz clic en "File" > "Options" (Windows) o "GitHub Desktop" > "Preferences" (Mac)
- Haz clic en "Sign in to GitHub.com"
- Usa el mismo email y contraseña que usaste en el Paso 2

### 3.3. Clona Tu Repositorio
- Haz clic en "File" > "Clone repository"
- Busca `orinoco-invest` en la lista
- Selecciona dónde quieres guardar (en tu computadora, ejemplo: `Documents/Proyectos`)
- Haz clic en "Clone"

### 3.4. Copia Los Archivos del Proyecto
La carpeta `acorns-ve` contiene todo el código.

1. Abre la carpeta `acorns-ve` en tu computadora
2. Selecciona TODOS los archivos y carpetas (Ctrl+A o Cmd+A)
3. Cópialo (Ctrl+C o Cmd+C)
4. Ve a la carpeta del repositorio que descargaste (ejemplo: `Documents/Proyectos/orinoco-invest`)
5. Pégalo aquí (Ctrl+V o Cmd+V)

### 3.5. Sube el Código a GitHub
En GitHub Desktop:

1. Verás que aparece una lista de cambios a la izquierda
2. En la caja "Summary", escribe: `Initial commit - Setup Orinoco Invest`
3. Haz clic en "Commit to main"
4. Haz clic en "Push origin" (arriba)

¡Listo! Tu código está en GitHub.

---

## Paso 4: Crear Cuenta en Vercel (Hosting)

Vercel es la empresa que ejecutará tu aplicación 24/7 en internet.

### 4.1. Abre Vercel
Ve a https://vercel.com en tu navegador.

### 4.2. Haz Clic en "Sign Up" (Arriba a la derecha)
- Selecciona "Continue with GitHub"
- Autoriza a Vercel cuando te lo pida

### 4.3. Importa Tu Proyecto
1. Verás una pantalla que dice "Create a new project"
2. Busca el repositorio `orinoco-invest` en la lista
3. Haz clic en "Import"

### 4.4. Configura el Proyecto
Vercel te hará algunas preguntas:

- **Project name**: `orinoco-invest`
- **Framework**: Ya debe decir "Next.js" (está bien)
- **Root directory**: Dejar vacío (está bien)

Haz clic en "Deploy".

**Vercel comenzará a construir tu app. Espera 2-3 minutos.**

---

## Paso 5: Agrega las Variables de Entorno en Vercel

Las variables de entorno son valores secretos que tu aplicación necesita. Son como las contraseñas.

### 5.1. Abre la Configuración del Proyecto en Vercel
El despliegue probablemente falló (esto es normal). Necesitamos agregar las variables.

1. Ve a https://vercel.com/dashboard
2. Haz clic en `orinoco-invest`
3. Haz clic en "Settings" (arriba)
4. Haz clic en "Environment Variables" (en el menú de la izquierda)

### 5.2. Agrega Cada Variable

Necesitas agregar 6 variables. Para cada una:

1. Haz clic en "Add New"
2. Llena "Name" y "Value"
3. Selecciona "Production" (para que esté activa en el servidor)
4. Haz clic en "Save"

**Variables a agregar:**

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | La URL CON POOLER que copiaste de Supabase |
| `DIRECT_URL` | La URL DIRECTA que copiaste de Supabase |
| `JWT_SECRET` | Una contraseña fuerte (ejemplo: `my-super-secret-key-12345678`) |
| `JWT_EXPIRES_IN` | `7d` |
| `NEXT_PUBLIC_APP_URL` | Tu URL de Vercel (verás algo como `https://orinoco-invest.vercel.app`) |
| `NEXT_PUBLIC_APP_NAME` | `Orinoco Invest` |

**Para encontrar tu URL de Vercel:**
- Ve a https://vercel.com/dashboard
- Haz clic en `orinoco-invest`
- En la sección "Production", verás la URL (algo como `orinoco-invest.vercel.app`)

---

## Paso 6: Redeploy de Tu Aplicación

Ahora que agregaste las variables, necesitas que Vercel intente desplegar de nuevo.

### 6.1. Fuerza un Redeploy
1. En tu proyecto de Vercel, haz clic en "Deployments" (arriba)
2. Busca el despliegue que falló (tiene una X roja)
3. Haz clic en los tres puntos (...)
4. Selecciona "Redeploy"

**Espera 2-3 minutos.**

Si ves un ícono verde con una palomita, ¡tu aplicación se desplegó exitosamente!

---

## Paso 7: Abre Tu Aplicación

Felicidades! Tu aplicación está viva en internet.

1. Ve a https://vercel.com/dashboard
2. Haz clic en `orinoco-invest`
3. En "Production", verás tu URL (algo como `https://orinoco-invest.vercel.app`)
4. Haz clic en esa URL (o cópiala y pégala en tu navegador)

**¡Tu aplicación está funcionando!**

---

## Paso 8: Prueba la Aplicación

### 8.1. Intenta Iniciar Sesión
La aplicación tiene un usuario de prueba:
- **Email**: `demo@acorns.ve`
- **Contraseña**: `test1234` (si usa el usuario de prueba de la BD)

**Nota**: Dependiendo de cómo esté configurada tu app, puede que necesites crear un usuario primero.

### 8.2. Si Algo No Funciona
Si ves errores en pantalla:

1. Abre el navegador (presiona F12 en Windows o Cmd+Option+I en Mac)
2. Ve a la pestaña "Console"
3. Captura una captura de pantalla del error
4. Envíalo a tu equipo técnico (van a necesitar saber qué dice)

---

## Próximos Pasos y Mantenimiento

### Cómo hacer cambios a la app
1. Edita los archivos en la carpeta `acorns-ve`
2. Usa GitHub Desktop para hacer "Commit" (guardar los cambios)
3. Usa GitHub Desktop para hacer "Push" (enviar a GitHub)
4. Vercel automáticamente detectará el cambio y redesplegará

### Cómo acceder a los datos
1. Ve a https://supabase.com
2. Inicia sesión
3. Haz clic en tu proyecto `orinoco-invest`
4. Haz clic en "SQL Editor" para ver todos los datos
5. Haz clic en "Table Editor" para editar datos de forma gráfica

### Plan Gratuito - Límites
- **Vercel**: 100 GB de ancho de banda mensual (muy generoso)
- **Supabase**: 500 MB de almacenamiento, 2 millones de filas, 2GB de ancho de banda

Para 99% de aplicaciones nuevas, esto es más que suficiente.

---

## Solución de Problemas

### Error: "DATABASE_URL no está definido"
- **Solución**: Revisaste que copiaste correctamente las URLs de Supabase? Revisa el Paso 5.

### Error: "Connection refused" o "Cannot connect to database"
- **Solución**: La contraseña de Supabase puede tener caracteres especiales que necesitan escaparse. Intenta usar solo letras y números.

### El despliegue se demora más de 10 minutos
- **Solución**: Algo está mal. Haz clic en "Deployments" y lee el log de errores.

### No puedo acceder a mi app en internet
- **Solución**: El despliegue falló. Ve a Vercel > Deployments y busca un ícono rojo. Haz clic para ver el error.

---

## Contacto y Soporte

Si te atascas:
1. Lee esta guía de nuevo (probablemente falta un paso)
2. Contacta a tu equipo técnico
3. Proporciona:
   - El paso en el que te atascaste
   - El mensaje de error exacto (si hay)
   - Una captura de pantalla

¡Mucho éxito con tu despliegue!
