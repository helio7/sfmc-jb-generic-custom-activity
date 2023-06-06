import "reflect-metadata"
import { DataSource } from "typeorm"
import { CopiaBroker } from "./entities/copia-broker.entity";

export const dataSource = new DataSource({
  type: 'oracle',
  host: process.env.DATABASE_HOST,
  port: 1521,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  serviceName: process.env.DATABASE_SERVICE_NAME,
  schema: process.env.DATABASE_SCHEMA,
  entities: [CopiaBroker],
  migrations: [],
  subscribers: [],
});
