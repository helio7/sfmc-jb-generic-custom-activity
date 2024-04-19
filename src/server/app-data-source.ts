import "reflect-metadata"
import { DataSource } from "typeorm"
import { Pack } from "./entities/pack.entity";

const nodeUrl = process.env.DBCP_RAC8_RACING_NODE_URL;

export const dataSource = new DataSource({
  host: nodeUrl!.split(':')[0],
  port: Number(nodeUrl!.split(':')[1].split('/')[0]),
  type: 'oracle',
  username: process.env.DBCP_RAC8_RACING_NODE_USERNAME,
  password: process.env.DBCP_RAC8_RACING_NODE_PASSWORD,
  schema: process.env.DBCP_RAC8_RACING_NODE_SCHEMA,
  entities: [Pack],
  migrations: [],
  subscribers: [],
  serviceName: nodeUrl!.split('/')[1],
});
