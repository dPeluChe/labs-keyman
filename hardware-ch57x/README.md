# Configuración Videyt Mini Keyboard (Mac M1/Silicon)

Este proyecto contiene las herramientas y configuraciones para controlar un teclado macro de 6 teclas (Chip CH57x) en macOS, solucionando el problema donde todas las teclas envían el mismo carácter.

## 📂 Estructura de Archivos
*   **`ch57x-keyboard-tool`**: Herramienta CLI para comunicarse con el chip del teclado.
*   **`config.yaml`**: Configuración **interna** del teclado (Hardware). Define que las teclas envíen `1, 2, 3...`.
*   **`videyt_rules.json`**: Reglas de **Karabiner-Elements** (Software). Define qué acciones complejas ejecutan esas teclas.

---

## 🚀 Guía Rápida

### 1. Nivel Hardware (Si el teclado se resetea)
Si el teclado deja de diferenciar las teclas o vuelve a enviar "c" en todas:

```bash
# Desde esta carpeta
sudo ./ch57x-keyboard-tool upload config.yaml
```
*Esto configura las teclas físicas como 1, 2, 3, 4, 5, 6 y la perilla como volumen.*

### 2. Nivel Software (Cambiar atajos/Apps)
Si quieres cambiar qué Apps se abren o los atajos de Zoom:

1.  Edita el archivo `videyt_rules.json`.
2.  Usa los comandos rápidos de terminal:
    *   **`miniboard_list`**: Muestra en pantalla qué hace cada tecla actualmente (lee tu configuración en vivo).
    *   **`miniboard_update`**: Aplica los cambios que hayas hecho en el archivo JSON a Karabiner.

3.  Solo si agregaste reglas nuevas (no solo editaste), ve a **Karabiner-Elements** > **Complex Modifications** > **Add rule** > **Enable All**.

---

## 🎹 Mapeo Actual (v1.0)

| Tecla | Acción | Detalle Técnico |
| :--- | :--- | :--- |
| **1** | **Arc Browser** | `open -a 'Arc'` |
| **2** | **Ghostty** | `open -a 'Ghostty'` |
| **3** | **Windsurf** | `open -a 'Windsurf'` |
| **4** | **Firefox** | `open -a 'Firefox'` *(Requiere asignar Desktop 9 manual)* |
| **5** | **Mute Mic** | `Cmd + Shift + A` (Zoom Toggle Mute) |
| **6** | **Cámara** | `Cmd + Shift + V` (Zoom Toggle Video) |
| **Perilla** | **Volumen** | Giro: Vol +/- | Click: Mute Audio |

## 🛠 Troubleshooting
*   **Error "Library not loaded" al flashear:** Ejecuta `brew install libusb`.
*   **Permisos:** Si el script de Apps no funciona, verifica en *Ajustes > Privacidad > Automatización* que Karabiner tenga permisos.
*   **Zoom/Teams:** Las teclas 5 y 6 envían atajos de teclado de Zoom. Si usas Meet o Teams, debes editar el JSON para cambiar `a` y `v` por sus equivalentes (`Cmd+D/E` para Meet, `Cmd+Shift+M/O` para Teams).
> Nota: el binario se instala desde el upstream [ch57x-keyboard-tool](https://github.com/kriomant/ch57x-keyboard-tool) — no se vendorea aqui.
