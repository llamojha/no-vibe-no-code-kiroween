# Auditoría de Texto Hardcodeado - Internacionalización

## Resumen

Este documento identifica todos los componentes con texto hardcodeado que necesitan ser traducidos usando el sistema de internacionalización (i18n).

**Fecha de auditoría**: 2024-01-XX
**Estado**: En progreso
**Prioridad**: Media-Alta

---

## Componentes Identificados con Texto Hardcodeado

### 🔴 Alta Prioridad (Componentes Visibles para el Usuario)

#### 1. **LoginForm** (`features/auth/components/LoginForm.tsx`)

**Texto Hardcodeado Encontrado:**
- ✗ "Sign in to Continue"
- ✗ "Enter your email to receive a one-time magic link. No password required."
- ✗ "Email address"
- ✗ "you@example.com" (placeholder)
- ✗ "Sending magic link..."
- ✗ "Send magic link"
- ✗ "Magic link sent! Check your inbox and follow the link to sign in."

**Claves de Traducción Sugeridas:**
```json
{
  "signInTitle": "Sign in to Continue",
  "signInSubtitle": "Enter your email to receive a one-time magic link. No password required.",
  "emailAddressLabel": "Email address",
  "emailPlaceholder": "you@example.com",
  "sendingMagicLink": "Sending magic link...",
  "sendMagicLink": "Send magic link",
  "magicLinkSent": "Magic link sent! Check your inbox and follow the link to sign in."
}
```

---

#### 2. **UserDashboard** (`features/dashboard/components/UserDashboard.tsx`)

**Texto Hardcodeado Encontrado:**
- ✗ "Analyze Startup Idea"
- ✗ "Analyze Kiroween Project"
- ✗ "Your Analyses"
- ✗ "Refreshing…"
- ✗ "Refresh"
- ✗ "Search analyses..." (placeholder)
- ✗ "Search through your analysis titles and summaries" (aria-label)
- ✗ "Sort"
- ✗ "Newest"
- ✗ "Oldest"
- ✗ "A-Z"
- ✗ "Change the order of your analyses" (aria-label)
- ✗ "No analyses yet"
- ✗ "No analyses match your search"
- ✗ "Delete Analysis"
- ✗ "Are you sure you want to delete \"{title}\"? This action cannot be undone."
- ✗ "Cancel"
- ✗ "Delete"

**Claves de Traducción Sugeridas:**
```json
{
  "analyzeStartupIdea": "Analyze Startup Idea",
  "analyzeKiroweenProject": "Analyze Kiroween Project",
  "yourAnalyses": "Your Analyses",
  "refreshing": "Refreshing…",
  "refresh": "Refresh",
  "searchAnalysesPlaceholder": "Search analyses...",
  "searchAnalysesHelp": "Search through your analysis titles and summaries",
  "sort": "Sort",
  "newest": "Newest",
  "oldest": "Oldest",
  "alphabetical": "A-Z",
  "sortHelp": "Change the order of your analyses",
  "noAnalysesYet": "No analyses yet",
  "noAnalysesMatch": "No analyses match your search",
  "deleteAnalysisTitle": "Delete Analysis",
  "deleteAnalysisConfirm": "Are you sure you want to delete \"{title}\"? This action cannot be undone.",
  "cancel": "Cancel",
  "delete": "Delete"
}
```

---

#### 3. **AnalysisCard** (`features/dashboard/components/AnalysisCard.tsx`)

**Texto Hardcodeado Encontrado:**
- ✗ "IDEA"
- ✗ "KIROWEEN"
- ✗ "Startup Idea Analysis" (aria-label)
- ✗ "Kiroween Project Analysis" (aria-label)
- ✗ "READ-ONLY"
- ✗ "This analysis is read-only because the analyzer is disabled" (aria-label)
- ✗ "View"
- ✗ "Edit"
- ✗ "Read-Only"
- ✗ "Delete"
- ✗ "excellent" (score category)
- ✗ "good" (score category)
- ✗ "needs improvement" (score category)
- ✗ "Analysis score: {score} out of 5, rated as {category}" (aria-label)
- ✗ "View analysis: {title}" (aria-label)
- ✗ "Edit analysis: {title}" (aria-label)
- ✗ "Delete analysis: {title}" (aria-label)
- ✗ "The analyzer for this type of analysis is currently disabled, so editing is not available." (aria-label)

**Claves de Traducción Sugeridas:**
```json
{
  "categoryIdea": "IDEA",
  "categoryKiroween": "KIROWEEN",
  "startupIdeaAnalysis": "Startup Idea Analysis",
  "kiroweenProjectAnalysis": "Kiroween Project Analysis",
  "readOnly": "READ-ONLY",
  "readOnlyHelp": "This analysis is read-only because the analyzer is disabled",
  "view": "View",
  "edit": "Edit",
  "readOnlyLabel": "Read-Only",
  "delete": "Delete",
  "scoreExcellent": "excellent",
  "scoreGood": "good",
  "scoreNeedsImprovement": "needs improvement",
  "analysisScoreLabel": "Analysis score: {score} out of 5, rated as {category}",
  "viewAnalysisLabel": "View analysis: {title}",
  "editAnalysisLabel": "Edit analysis: {title}",
  "deleteAnalysisLabel": "Delete analysis: {title}",
  "analyzerDisabledHelp": "The analyzer for this type of analysis is currently disabled, so editing is not available."
}
```

---

#### 4. **AnalysisFilter** (`features/dashboard/components/AnalysisFilter.tsx`)

**Texto Hardcodeado Encontrado:**
- ✗ "All Analyses"
- ✗ "Startup Ideas"
- ✗ "Kiroween Projects"
- ✗ "Filter analyses by type" (aria-label)
- ✗ "{label} ({count} analyses)" (aria-label)
- ✗ ", currently selected" (aria-label)

**Claves de Traducción Sugeridas:**
```json
{
  "allAnalyses": "All Analyses",
  "startupIdeas": "Startup Ideas",
  "kiroweenProjects": "Kiroween Projects",
  "filterAnalysesLabel": "Filter analyses by type",
  "filterOptionLabel": "{label} ({count} analyses)",
  "currentlySelected": ", currently selected"
}
```

---

### 🟡 Media Prioridad (Componentes Menos Visibles)

#### 5. **AnalyzerButton** (`features/home/components/AnalyzerButton.tsx`)

**Estado**: ✅ Este componente recibe `title` y `description` como props, por lo que ya está preparado para i18n. No requiere cambios.

---

## Resumen de Estadísticas

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| Componentes con texto hardcodeado | 4 | 🔴 Pendiente |
| Componentes ya preparados para i18n | 1 | ✅ Completo |
| Claves de traducción nuevas requeridas | ~50 | 📝 Por agregar |

---

## Próximos Pasos

### Fase 1: Agregar Claves de Traducción
1. ✅ Identificar componentes con texto hardcodeado
2. ⏳ Agregar claves en `locales/en.json`
3. ⏳ Agregar traducciones en `locales/es.json`

### Fase 2: Actualizar Componentes
1. ⏳ Importar `useTranslation` en cada componente
2. ⏳ Reemplazar texto hardcodeado con `t('key')`
3. ⏳ Verificar que aria-labels también usen traducciones

### Fase 3: Verificación
1. ⏳ Probar cambio de idioma en desarrollo
2. ⏳ Verificar que todos los textos se traduzcan
3. ⏳ Verificar accesibilidad (aria-labels traducidos)

---

## Notas Técnicas

### Patrón de Uso de useTranslation

```typescript
import { useLocale } from "@/features/locale/context/LocaleContext";

const MyComponent = () => {
  const { t } = useLocale();
  
  return (
    <button>{t("myButtonText")}</button>
  );
};
```

### Interpolación de Variables

Para textos con variables dinámicas, usar interpolación:

```typescript
// En el componente
<p>{t("deleteConfirmation", { title: analysis.title })}</p>

// En locales/en.json
{
  "deleteConfirmation": "Are you sure you want to delete \"{title}\"?"
}
```

### Aria-Labels y Accesibilidad

Todos los aria-labels también deben ser traducidos:

```typescript
<button aria-label={t("viewAnalysisLabel", { title: analysis.title })}>
  {t("view")}
</button>
```

---

## Componentes Adicionales a Revisar

Los siguientes componentes aún no han sido auditados y pueden contener texto hardcodeado:

- [ ] `features/analyzer/components/*`
- [ ] `features/kiroween-analyzer/components/*`
- [ ] `features/home/components/*` (excepto AnalyzerButton)
- [ ] `app/` pages y layouts

---

## Referencias

- [Documentación de i18n del proyecto](../features/locale/README.md)
- [Archivos de traducción](../locales/)
- [Context de Locale](../features/locale/context/LocaleContext.tsx)
