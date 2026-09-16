# Juego de preguntas para GitHub Pages

## Cómo publicarlo

1. Creá un repositorio nuevo en GitHub.
2. Subí `index.html`, `style.css` y `script.js` a la rama `main`.
3. Entrá en **Settings → Pages**.
4. En **Build and deployment**, elegí:
   - Source: **Deploy from a branch**
   - Branch: **main** / **root**
5. Guardá y esperá a que GitHub Pages publique el sitio.

## Cómo agregar o cambiar preguntas

Editá el arreglo `questions` al comienzo de `script.js`.

### Opción múltiple

```js
{
  type: "multiple",
  question: "¿Cuánto es 2 + 2?",
  answers: ["3", "4", "5"],
  correct: "4"
}
```

### Verdadero o falso

```js
{
  type: "true-false",
  question: "La Tierra es un planeta.",
  correct: true
}
```

Las respuestas se mezclan automáticamente cada vez que comienza una partida. También se mezclan las preguntas.

El juego no necesita backend: funciona con HTML, CSS y JavaScript. El progreso se guarda solamente en el navegador mediante `localStorage`.
