# Integración de UPGRADE! con ARIS y KELEDON

## Descripción General

Este documento describe la arquitectura de integración entre los tres proyectos principales:

- **UPGRADE!**: Plataforma central de innovación y crecimiento personal
- **ARIS**: Sistema avanzado de tutoría y mentoría AI
- **KELEDON**: Sistema de atención al cliente y call center

## Arquitectura

La integración se implementa como una arquitectura de microservicios donde UPGRADE! actúa como coordinador de los servicios ARIS y KELEDON.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend                             │
├─────────────────────────────────────────────────────────┤
│              API Gateway (UPGRADE!)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   Usuarios  │ │   Cursos    │ │   Pagos/Stripe  │   │
│  │   Perfiles  │ │   Contenido │ │   Suscripciones │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              Servicio de Integración                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   ARIS API  │ │  KELEDON    │ │   Supabase DB   │   │
│  │(Mentoría AI)│ │(Call Center)│ │   (Compartida?) │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Configuración de Variables de Entorno

Añadir al archivo `.env`:

```env
# Configuración de integración ARIS
ARIX_SERVICE_URL=https://aris-service-url.appspot.com
ARIX_API_KEY=your-aris-api-key
ARIX_TIMEOUT_MS=10000
ARIX_RETRY_ATTEMPTS=3

# Configuración de integración KELEDON
KELEDON_SERVICE_URL=https://kedon-service-url.appspot.com
KELEDON_API_KEY=your-kedon-api-key
KELEDON_TIMEOUT_MS=10000
KELEDON_RETRY_ATTEMPTS=3

# Configuración general de integración
INTEGRATION_FALLBACK_ENABLED=true
INTEGRATION_FALLBACK_DELAY_MS=2000
```

## Endpoints de Integración

### ARIS - Mentoría Avanzada
- `POST /api/integration/aris/mentoring` - Obtener mentoría avanzada de ARIS
- `GET /api/integration/status` - Verificar estado de integración

### KELEDON - Soporte al Cliente
- `POST /api/integration/kedon/support` - Crear ticket de soporte en KELEDON

## Uso del Servicio de Integración

### En Rutas API

```typescript
import { IntegrationService } from '../services/integration/integration.service';

// Ejemplo de uso en un endpoint
const result = await IntegrationService.getAdvancedMentoring(userId, context, conversationId);
if (result.success) {
    // Procesar resultado de ARIS
} else {
    // Usar fallback local
}
```

### En Servicio de IA

El servicio de IA de UPGRADE! ahora puede usar capacidades avanzadas de ARIS cuando se solicita un mentor especializado:

```typescript
// Para mentores avanzados, el sistema automáticamente usa ARIS
await AIService.smartStreamChat('advanced', messages, onChunk, onComplete, onError);
```

## Patrones de Resiliencia

- **Retry con backoff exponencial**: Reintentos automáticos con incremento de espera
- **Fallback**: Si ARIS o KELEDON no responden, el sistema usa capacidades locales
- **Circuit Breaker**: Prevención de fallos en cascada

## Despliegue en Google Cloud Run

Cada servicio (UPGRADE!, ARIS, KELEDON) se puede desplegar independientemente:

1. Configurar variables de entorno en cada instancia
2. Desplegar cada servicio con su Dockerfile correspondiente
3. Configurar networking entre servicios si es necesario
4. Monitorear estado de integración a través de endpoints de health check

## Consideraciones de Seguridad

- Usar claves API seguras para comunicación entre servicios
- Validar todos los inputs provenientes de servicios externos
- Implementar timeouts adecuados para evitar bloqueos
- Registrar adecuadamente las llamadas entre servicios para auditoría