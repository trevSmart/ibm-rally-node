# GitHub Actions Setup

## Configuración de secretos para publicación automática

Para que el workflow de publicación funcione correctamente, necesitas configurar el siguiente secreto en tu repositorio de GitHub:

### NPM_TOKEN

Este token es necesario para publicar el paquete en npm registry.

#### Cómo obtener el token:

1. Ve a [npmjs.com](https://www.npmjs.com) e inicia sesión
2. Haz clic en tu avatar y selecciona "Access Tokens"
3. Haz clic en "Generate New Token"
4. Selecciona "Automation" como tipo de token
5. Copia el token generado

#### Cómo configurar el secreto:

1. Ve a tu repositorio en GitHub
2. Haz clic en "Settings" → "Secrets and variables" → "Actions"
3. Haz clic en "New repository secret"
4. Nombre: `NPM_TOKEN`
5. Valor: pega el token que copiaste
6. Haz clic en "Add secret"

### GITHUB_TOKEN

Este token se configura automáticamente por GitHub Actions y no requiere configuración manual.

## Funcionamiento del workflow

El workflow se ejecuta automáticamente cuando se publica un release y:

1. **Ejecuta las pruebas** para asegurar que el código funciona
2. **Incrementa la versión** basándose en la versión actual en npm
3. **Compila el paquete** usando Babel
4. **Publica a npm** (si NPM_TOKEN está configurado)
5. **Publica a GitHub Packages** usando el token automático

### Publicación a npm

- Cambia temporalmente el nombre del paquete de `@trevsmart/ibm-rally-node` a `ibm-rally-node`
- Elimina la configuración `publishConfig` para evitar conflictos
- Publica con acceso público
- Restaura la configuración original

### Publicación a GitHub Packages

- Restaura la configuración `publishConfig` para GitHub Packages
- Publica usando el scope `@trevsmart`

## Troubleshooting

### Error: "NPM_TOKEN secret is not configured"

Si ves este mensaje, significa que el secreto `NPM_TOKEN` no está configurado. El workflow continuará y solo publicará a GitHub Packages.

### Error: "404 Not Found" al publicar a npm

Esto puede ocurrir si:
- El token de npm no tiene permisos suficientes
- El paquete ya existe con esa versión
- Hay problemas de conectividad

### Error: "need auth" al publicar a npm

Esto indica que el token de npm no es válido o ha expirado. Genera un nuevo token y actualiza el secreto.
