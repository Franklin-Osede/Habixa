# Estrategia de Estilos en React Native

## 📋 Mejores Prácticas

### 1. **Estilos en el Componente** (Para estilos específicos)
```tsx
// ✅ CORRECTO: Estilos específicos del componente
const styles = StyleSheet.create({
  mySpecificStyle: {
    // Solo para este componente
  }
});
```

### 2. **Estilos Compartidos** (Para reutilización)
```tsx
// ✅ CORRECTO: Importar estilos compartidos
import { buttonStyles, cardStyles } from '@/styles/shared';

<TouchableOpacity style={buttonStyles.primary}>
  <Text style={buttonStyles.primaryText}>Button</Text>
</TouchableOpacity>
```

### 3. **Colores desde Constants** (SIEMPRE)
```tsx
// ✅ CORRECTO
import { Colors } from '@/constants/Colors';
backgroundColor: Colors.primary

// ❌ INCORRECTO
backgroundColor: '#0df259'
```

## 🎯 Estructura Recomendada

```
apps/mobile/
├── constants/
│   └── Colors.ts          # Colores globales (SIEMPRE usar estos)
├── styles/
│   ├── shared.ts           # Estilos reutilizables (botones, cards, etc.)
│   └── README.md           # Esta documentación
└── app/
    └── onboarding/
        └── step1.tsx       # Estilos específicos del componente aquí
```

## 📝 Reglas de Oro

1. **Colores**: SIEMPRE desde `@/constants/Colors`
2. **Estilos compartidos**: En `@/styles/shared.ts`
3. **Estilos específicos**: En el mismo archivo del componente
4. **NO usar className**: Solo `StyleSheet.create()` en React Native
5. **TypeScript**: Usar `as ViewStyle` o `as TextStyle` cuando sea necesario

## 🔄 Cuándo usar cada uno

- **Estilos en componente**: Cuando el estilo es único y específico de ese componente
- **Estilos compartidos**: Cuando se repite en múltiples componentes (botones, cards, inputs)
- **Colores centralizados**: SIEMPRE, para mantener consistencia
