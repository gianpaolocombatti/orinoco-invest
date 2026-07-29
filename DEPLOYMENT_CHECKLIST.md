# Checklist de Despliegue - Orinoco Invest

Esta es una lista rápida de verificación. Para instrucciones detalladas, lee `DEPLOY.md`.

## Configuración Completada (Hecho por el Equipo)

- [x] `vercel.json` - Configuración de Vercel
- [x] `supabase/migrations/001_initial.sql` - Schema de base de datos
- [x] `.env.example` - Variables de entorno con formato Supabase
- [x] `prisma/schema.prisma` - Configuración de conexión con pooling
- [x] `package.json` - Scripts de build optimizados
- [x] `DEPLOY.md` - Guía paso a paso

**No necesitas hacer nada más en la configuración técnica. Está lista.**

---

## Lo Que DEBES Hacer Ahora

### 1. Supabase (Base de Datos)
- [ ] Ir a https://supabase.com
- [ ] Crear cuenta (con GitHub es más fácil)
- [ ] Crear proyecto nuevo
- [ ] **COPIAR y GUARDAR** la contraseña de la base de datos
- [ ] Copiar las URLs de conexión (DATABASE_URL y DIRECT_URL)
- [ ] Ejecutar la migración SQL desde `supabase/migrations/001_initial.sql`

### 2. GitHub (Guardar el Código)
- [ ] Ir a https://github.com
- [ ] Crear cuenta (si no tienes)
- [ ] Crear repositorio `orinoco-invest`
- [ ] Descargar GitHub Desktop
- [ ] Subir los archivos del proyecto a GitHub

### 3. Vercel (Hosting)
- [ ] Ir a https://vercel.com
- [ ] Crear cuenta (con GitHub)
- [ ] Importar el repositorio `orinoco-invest` desde GitHub
- [ ] Agregar variables de entorno:
  - [ ] DATABASE_URL (de Supabase)
  - [ ] DIRECT_URL (de Supabase)
  - [ ] JWT_SECRET (una contraseña fuerte)
  - [ ] JWT_EXPIRES_IN = `7d`
  - [ ] NEXT_PUBLIC_APP_URL (tu URL de Vercel)
  - [ ] NEXT_PUBLIC_APP_NAME = `Orinoco Invest`
- [ ] Redeploy del proyecto
- [ ] Verificar que el deploy sea exitoso (ícono verde)

### 4. Pruebas
- [ ] Abrir la URL de tu app en Vercel
- [ ] Intentar iniciar sesión
- [ ] Verificar que todo funciona

---

## Costos

| Servicio | Costo | Límite Gratuito |
|----------|-------|-----------------|
| Vercel | **GRATIS** | 100 GB ancho de banda/mes |
| Supabase | **GRATIS** | 500 MB almacenamiento |
| GitHub | **GRATIS** | Repositorios ilimitados |
| **TOTAL** | **$0/mes** | Suficiente para la mayoría de apps |

**Cumple tu requisito de presupuesto < $25/mes: COSTO TOTAL = $0**

---

## Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `vercel.json` | Configuración de despliegue en Vercel |
| `DEPLOY.md` | Guía paso a paso completa (LEE ESTO) |
| `supabase/migrations/001_initial.sql` | Copia el contenido en Supabase SQL Editor |
| `.env.example` | Muestra el formato de variables de entorno |
| `prisma/schema.prisma` | Modelo de datos (no cambiar) |

---

## Preguntas Frecuentes

**¿Necesito instalar algo en mi computadora?**
Solo GitHub Desktop. Todo lo demás es en la web.

**¿Qué hago si recibo un error?**
Revisa la sección "Solución de Problemas" en `DEPLOY.md`.

**¿Puedo cambiar la aplicación después de desplegar?**
Sí. Edita los archivos, sube a GitHub con GitHub Desktop, y Vercel redesplegará automáticamente.

**¿Cuánto tiempo tarda el despliegue?**
Normalmente 2-3 minutos. Si tarda más de 10, hay un error (revisa el log en Vercel).

**¿Y si necesito ayuda técnica?**
Contacta a tu equipo de desarrollo. Proporciona:
- Paso en el que te atascaste
- Mensaje de error exacto
- Captura de pantalla

---

## Próximos Pasos Después del Despliegue

1. **Cambiar el usuario de prueba** - La app tiene `demo@acorns.ve` de prueba. Cámbialo o crea usuarios reales.
2. **Configurar Alpaca API** - Si quieres trading real, necesitas integrar Alpaca Markets.
3. **Añadir email** - Considera SendGrid para confirmaciones por email.
4. **Monitoreo** - Vercel tiene estadísticas de uso integradas.

---

Sigue `DEPLOY.md` paso a paso. ¡Estará online en 15-20 minutos!
