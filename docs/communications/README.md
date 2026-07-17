# Communications Platform

The Communications module is the single pipeline responsible for producing
and delivering every outbound message the product sends: transactional
email, admin campaigns, and — in the near future — SMS, push, in-app
notifications and webhooks.

## Layered architecture

```
Template  →  Version  →  Renderer  →  Pipeline  →  Dispatcher  →  Provider  →  Delivery
```

Each layer has a single, well-defined responsibility:

| Layer               | Doc                                       | Location                                                    |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Template + Versions | [template-versions.md](./template-versions.md) | `src/lib/emailTemplates.ts`, `emailTemplateVersions.ts`     |
| Variable Engine     | [variable-engine.md](./variable-engine.md)     | `src/lib/emailVariables.ts`                                 |
| Rendering Engine    | [rendering-engine.md](./rendering-engine.md)   | `src/lib/templateRenderer.ts`                               |
| Pipeline            | [pipeline.md](./pipeline.md)                   | `src/lib/communicationPipeline.ts`                          |
| Dispatcher          | [dispatcher.md](./dispatcher.md)               | `supabase/functions/_shared/dispatcher/index.ts`            |
| Providers           | [providers.md](./providers.md)                 | `supabase/functions/_shared/dispatcher/providers/*.ts`      |

## Cross-cutting utilities

- **Error catalog** — `src/lib/communicationErrors.ts` (+ Deno mirror at
  `supabase/functions/_shared/dispatcher/errors.ts`). All modules should
  surface failures using a `CommErrorCode`.
- **Metrics** — `src/lib/communicationMetrics.ts` (+ Deno mirror). Types
  only; observability wiring is deliberately deferred.

## Diagrams

See [diagrams.md](./diagrams.md).
