# DOCUMENTO DE REQUISICIÓN
## Cotizador Inteligente de Aire Acondicionado Comercial

| Campo | Detalle |
|-------|---------|
| **Proyecto** | Demo Cotizador AC - Trybotix Labs |
| **Tipo** | Herramienta de demostración / Lead magnet |
| **Solicitante** | Christian - Trybotix Labs |

---

# 1. Contexto y Objetivo Estratégico

## ¿Qué es Trybotix Labs?

Trybotix Labs construye soluciones de inteligencia artificial personalizadas para empresas. Creamos sistemas que pueden analizar documentos, imágenes y datos para automatizar procesos complejos que normalmente requieren expertos humanos.

## ¿Por qué este proyecto?

Necesitamos una herramienta de demostración que genere conversaciones de venta con empresarios. El objetivo NO es vender aire acondicionado, sino demostrar las capacidades de nuestra tecnología de una forma que cualquier empresario pueda entender y experimentar.

## Audiencia objetivo

Empresarios y ejecutivos de la red de egresados de INCAE Business School. Son tomadores de decisiones con presupuesto, pero no necesariamente técnicos. Vienen de diversas industrias: retail, manufactura, servicios, logística, finanzas, etc.

## El resultado que buscamos

Que al usar la herramienta, el usuario piense: *"Esto está interesante. Puede que haya un proceso en mi empresa que pueda resolver con IA. Voy a preguntarle a Christian a ver cómo sería eso."*

---

# 2. ¿Qué Debe Hacer la Herramienta?

## Concepto central

Un cotizador inteligente de aire acondicionado comercial que recibe una foto del espacio, hace preguntas relevantes, calcula la carga térmica con criterio de ingeniero, y genera una cotización profesional con recomendaciones.

## Capacidades clave a demostrar

- **Análisis visual:** La IA debe "ver" y entender la foto (dimensiones, ventanas, tipo de espacio, materiales visibles)
- **Conocimiento experto:** Aplicar criterios de ingeniería que un empresario común no conoce (BTUs por metro cuadrado, factores de carga térmica, eficiencia de equipos)
- **Cálculo real:** Mostrar las fórmulas y el razonamiento, no solo el resultado
- **Criterio profesional:** Recomendar con justificación, no solo listar opciones
- **Output accionable:** Generar un PDF profesional que el usuario pueda usar o compartir

---

# 3. Experiencia del Usuario

## Dos modos de interacción

La herramienta debe ofrecer dos caminos para el usuario:

| MODO GUIADO | MODO CHAT |
|-------------|-----------|
| Paso a paso estructurado | Conversación libre y natural |
| Aproximadamente 60 segundos | El usuario controla el ritmo |
| Ideal para usuarios que quieren resultado rápido sin pensar mucho | Ideal para casos complejos o usuarios con preguntas |

---

## Flujo del Modo Guiado

### Pantalla 1: Entry Point

- **Titular:** "¿Cuánto cuesta climatizar tu espacio?"
- **Subtítulo:** "Sube una foto. Recibe una cotización real en 60 segundos."
- **Acción:** Botón grande para subir foto o tomar con cámara
- **Importante:** Sin formularios, sin registro, fricción cero

### Pantalla 2: Análisis Visual (El momento mágico)

- La foto aparece con animación de "escaneando"
- La IA superpone sobre la imagen lo que detectó:
  - Contorno del espacio delineado
  - Dimensiones estimadas (ej: "~45 m²")
  - Ventanas marcadas con orientación
  - Tipo de espacio identificado ("Parece oficina open space")
- Debajo: "Detecté esto. ¿Es correcto?" con campos editables para corregir
- **Objetivo:** Que el usuario diga "wow, entendió mi espacio solo con la foto"

### Pantalla 3: Preguntas Rápidas

- Máximo 3-4 preguntas en formato simple (no formulario largo)
- ¿Cuántas personas usualmente? → slider o número
- ¿Equipos que generen calor? → checkboxes (cocina, servidores, maquinaria, ninguno)
- ¿Horario de uso? → Ej: 8am-6pm L-V

### Pantalla 4: Cálculo en Vivo

- Animación mostrando el desglose del cálculo:
  - Área: 45m² × 600 BTU = 27,000 BTU
  - Personas: 8 × 500 BTU = 4,000 BTU
  - Equipos: +3,000 BTU
  - Factor ventanas oeste: +15%
  - Total: 39,100 BTU → 3.25 toneladas
- **Objetivo:** Demostrar que hay ingeniería real, no magia negra

### Pantalla 5: Cotización y Recomendación

- **Recomendación principal:** "2 Mini-splits inverter de 18,000 BTU c/u"
- Tabla comparativa con 3 opciones: Económica, Recomendada, Premium
- Cada opción incluye: equipos, inversión estimada, consumo mensual
- **Insight de valor:** "La opción inverter se paga sola en 18 meses por ahorro eléctrico"
- **Botón primario:** "Descargar cotización PDF"
- **Botón secundario:** "¿Tienes un proceso que podría funcionar así? Conversemos →"

---

## Flujo del Modo Chat

- **Mensaje inicial de la IA:** "Hola 👋 Ayudo a dimensionar y cotizar aire acondicionado comercial. Puedes mandarme una foto de tu espacio, describirlo, o ambas cosas. Yo te hago las preguntas necesarias."
- La IA acepta fotos en cualquier momento de la conversación
- Hace preguntas de seguimiento inteligentes basadas en lo que falta saber
- Responde dudas técnicas con criterio de experto
- Puede ajustar el cálculo si el usuario corrige información
- Genera el PDF cuando el usuario está listo
- **Tono:** Como un técnico de AC experimentado que te escribe por WhatsApp. Directo, claro, sin formalidades excesivas.

---

# 4. Los Momentos "Wow" (Críticos)

Estos son los momentos que generan el impacto y hacen que el usuario quiera hablar con nosotros:

### Momento 1: "La IA realmente VIO mi espacio"

- Overlays visuales sobre la foto mostrando lo que detectó
- Identificar detalles que el usuario no mencionó (orientación de ventanas, material del techo, equipos visibles)
- **Ejemplo de insight inesperado:** "Veo que las ventanas no tienen película solar. Eso aumenta tu carga térmica un 20%. Con película ahorrarías $18/mes."

### Momento 2: "Hay ingeniería real detrás"

- Mostrar el cálculo completo con justificación de cada factor
- Explicar por qué se usa cada valor (ej: "Usé 500 BTU por persona porque es oficina sedentaria. Si fuera gimnasio usaría 800 BTU")
- Esto diferencia de ChatGPT que solo da respuestas sin mostrar el razonamiento

### Momento 3: "Piensa como un experto"

- No solo dar opciones, sino recomendar con criterio
- Explicar por qué NO recomienda ciertas opciones
- **Ejemplo:** "¿Por qué no uno solo de 48K? Distribución desigual, sin redundancia si falla, menos eficiente por tonelada."

### Momento 4: "Me dio la solución completa"

- Diagrama simple de ubicación recomendada de equipos
- Zonas de cobertura marcadas
- PDF profesional listo para usar o compartir

### Momento 5: "Sabe más de lo que pregunté"

- Easter eggs de inteligencia cuando la foto muestra algo inusual
- Techo muy alto → "Consideré la altura extra (~4m). Eso aumenta el volumen 40%."
- Espacio irregular → "El espacio tiene forma de L, por eso recomiendo 2 equipos."
- Equipo existente visible → "Veo que ya tienes un split. ¿Quieres que calcule si es suficiente?"

---

# 5. El Entregable: PDF de Cotización

El PDF es el asset que el usuario se lleva y potencialmente comparte. Debe incluir:

- Logo de Trybotix Labs
- La foto original con las detecciones marcadas
- Resumen del análisis (área, ocupantes, factores considerados)
- Desglose completo del cálculo de carga térmica
- Tabla comparativa de opciones con inversión y consumo
- Recomendación con justificación
- Diagrama de ubicación sugerida
- Nota: "Cotización generada por IA - valores referenciales de mercado"
- Call to action: "¿Quieres automatizar procesos en tu empresa? Conversemos → [contacto]"

---

# 6. El Puente a Trybotix

Después de entregar el resultado, debe haber un bloque visible pero no invasivo que conecte con nuestros servicios:

- "Esto fue un demo de lo que construimos en Trybotix Labs."
- "La misma lógica puede aplicarse a TU negocio:"
  - Cotizaciones de tu producto/servicio
  - Análisis de documentos técnicos
  - Diagnósticos a partir de fotos
  - Presupuestos automáticos
- "¿Tienes un proceso que podría funcionar así?" → Botón a WhatsApp o calendario de Christian

---

# 7. Criterios de Éxito

La herramienta será exitosa si:

1. Un usuario puede completar una cotización en menos de 2 minutos
2. El análisis visual genera al menos un "insight inesperado" por sesión
3. El cálculo mostrado es verificable y tiene sentido para alguien con conocimiento básico
4. El PDF generado es lo suficientemente profesional para compartir
5. Usuarios sin conocimiento técnico pueden entender el proceso completo
6. La herramienta genera conversaciones de "¿cómo podría aplicar esto a mi negocio?"

---

# 8. Qué NO Es Este Proyecto

- NO es una herramienta para vender aire acondicionado
- NO necesita precios exactos de mercado (son referenciales)
- NO necesita conexión con proveedores reales
- NO requiere cuenta de usuario ni login
- NO es un MVP de producto - es una demostración de capacidades

---

*Documento preparado para el equipo de desarrollo de Trybotix Labs*
