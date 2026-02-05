# Binance C2C API — Quick Start (Resumen)

Fuente oficial: https://developers.binance.com/docs/c2c/quick-start

> Nota: Este archivo es un resumen (no es copia literal del doc).

## API Key setup

- Algunos endpoints requieren **API Key**.
- Crear la API key desde Binance UI.
- Recomendado: **IP restriction** para seguridad.
- Nunca compartir `API Key` / `Secret`.

Guía oficial creación API key:
- https://www.binance.com/en/support/articles/360002502072

## API Key restrictions

- Default: **Enable Reading**.
- Para withdrawals vía API: cambiar restricciones manualmente en la UI.

## Enabling accounts

- **Spot**: viene habilitada por defecto.
- **Margin**: habilitar siguiendo guía oficial.
  - https://www.binance.vision/tutorials/binance-margin-trading-guide

## Conectores oficiales

- Python: https://github.com/binance/binance-connector-python
- JS: https://github.com/binance/binance-connector-js
- Ruby: https://github.com/binance/binance-connector-ruby
- .NET: https://github.com/binance/binance-connector-dotnet
- Java: https://github.com/binance/binance-connector-java

## Postman / Swagger

- Postman collections: https://github.com/binance/binance-api-postman
- OpenAPI/Swagger: https://github.com/binance/binance-api-swagger
