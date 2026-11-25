# CAP Manager 0.2

Versión local para el Comité de Asesores Par de Medicina UAS.

## Inicio en computadora

1. Extrae todo el ZIP. Necesitas Python 3, sin paquetes adicionales.
2. Desde la carpeta extraída, ejecuta `py iniciar.py` en Windows o `python3 iniciar.py` en macOS o Linux.
3. Abre http://localhost:8732/ si el navegador no se abre automáticamente.
4. En Chrome o Edge, cuando aparezca la opción **Instalar**, puedes añadir CAP Manager como aplicación. Tras una primera carga completa, la aplicación puede abrirse sin red en el mismo navegador y perfil.

## Prueba de principio a fin

Crea un evento con nombre, fecha y ponente. Para registrar asistencia, captura el nombre y la matrícula. Usa **Leer imagen QR** si tu navegador lo admite, o escribe el código que aparece debajo del QR. El QR contiene el código del evento. Cada matrícula se registra una sola vez por actividad. En la lista de asistentes, pulsa **Abrir constancia** y elige **Guardar como PDF** en el diálogo de impresión. La constancia del evento de demostración lleva la marca correspondiente.

Los datos se guardan en este navegador y perfil. Esta versión admite un puesto de registro local. El QR no envía registros de los teléfonos de los asistentes a la computadora. Pendientes para uso operativo multiusuario: sincronización, cuentas y permisos, respaldo de registros y formato institucional de constancias.

## Editor de formularios por evento

1. Selecciona un evento y pulsa **Editar formulario**.
2. Agrega las preguntas, elige el tipo de respuesta y marca las que sean obligatorias. En **Selección única** se puede elegir una sola opción. En **Selección múltiple** se pueden marcar varias y exigir opciones concretas, por ejemplo una casilla de confirmación.
3. Pulsa **Guardar formulario**. El formulario del evento se actualiza al momento.
4. Consulta las respuestas desde **Asistentes y constancias → Ver respuestas**. Cada registro conserva el texto de las preguntas y respuestas tal como se guardaron, aunque luego edites el formulario.

Para actualizar desde la versión anterior, sustituye los archivos de la aplicación y abre CAP Manager desde la misma dirección y el mismo perfil del navegador. Recarga la página con el servidor activo para descargar la actualización. Conserva los datos del sitio para mantener los registros existentes.
