# Rodando com Docker

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto.

## Primeira vez

Na pasta do projeto, rode:

```
docker compose up -d --build
```

Isso vai:
- construir a imagem (instala dependências, gera o Prisma Client, builda o Next.js)
- subir um banco PostgreSQL dentro de um volume Docker (`pg-data`)
- aplicar as migrations automaticamente
- popular as categorias padrão (seed)
- subir o app em http://localhost:3001

O Postgres também fica acessível em `localhost:5433` (mapeado para a porta 5432 do container) caso você queira rodar `npm run dev` fora do Docker.

## Próximas vezes

```
docker compose up -d
```

## Parar o app

```
docker compose down
```

Seus dados continuam salvos no volume `pg-data` (não some ao parar o container).

## Ver logs

```
docker compose logs -f
```

## Atualizar depois de mudar o código

```
docker compose up -d --build
```
