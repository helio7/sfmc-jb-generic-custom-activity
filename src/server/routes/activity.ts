"use strict";
import https from 'https';
import axios from 'axios';
import { Request, Response } from 'express';

const logExecuteData: {
  body: any;
  headers: any;
  trailers: any;
  method: any;
  url: any;
  params: any;
  query: any;
  route: any;
  cookies: any;
  ip: any;
  path: any;
  host: any;
  fresh: any;
  stale: any;
  protocol: any;
  secure: any;
  originalUrl: any;
}[] = [];

const saveData = (req: any) => {
  // Put data from the request in an array accessible to the main app.
  logExecuteData.push({
    body: req.body,
    headers: req.headers,
    trailers: req.trailers,
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    route: req.route,
    cookies: req.cookies,
    ip: req.ip,
    path: req.path,
    host: req.hostname,
    fresh: req.fresh,
    stale: req.stale,
    protocol: req.protocol,
    secure: req.secure,
    originalUrl: req.originalUrl
  });
}

interface RequestBody {
  cellularNumber: number;
  channel: string;
}

interface ResponseBody {
  responseCode: number;
  responseMessage: string;
  handle: number;
  pack: {
    packId: string;
    description: string;
  }[];
}

const execute = async function (req: Request, res: Response) {
  const { body } = req;

  console.log('Request Body:', body);
  
  // Obtener dataExtension y channel del cuerpo de la solicitud
  const { dataExtension, channel } = body;

  // Obtener cellularNumber de la dataExtension (como lo haces en el frontend)
  // Esto es un ejemplo, asegúrate de ajustarlo según tu estructura de datos
  const cellularNumber = `{{Contact.Attribute."${dataExtension}".cellular_number}}`;

  console.log('Data Extension:', dataExtension);
  console.log('Channel:', channel);
  console.log('Cellular Number:', cellularNumber);

   // Verificar si el cuerpo de la solicitud está en el formato correcto
   if (!body || !body.dataExtension || !body.channel) {
    console.error(new Error('Invalid or missing input parameters'));
    return res.status(400).send('Invalid or missing input parameters');
  }

  if (!cellularNumber || !channel) {
    console.error(new Error('Missing input parameters'));
    return res.status(400).send('Missing input parameters');
  }

  const now = new Date();
  const offersRequestDurationTimestamps = { start: performance.now(), end: null as null | number };

  const {
    API_URL,
    API_SESSION_ID,
    API_COUNTRY
  } = process.env;

  console.log('Llamando a la API...');
  const packRenovableApiResponse: { data: ResponseBody } | null = await axios({
    method: 'post',
    url: API_URL!,
    data: {
      cellularNumber: Number(cellularNumber),
      channel: channel
    } as RequestBody,
    headers: {
      Country: API_COUNTRY!,
      'Session-Id': API_SESSION_ID!
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  })
    .catch((err) => {
      offersRequestDurationTimestamps.end = performance.now();
      if (err.response) {
        const { data, status } = err.response;
        console.error('Error de respuesta de la API:', status, data);
      }
      console.log('Error llamando a la API:');
      console.log(err);
      return null;
    });

  offersRequestDurationTimestamps.end = performance.now();

  // Enviar la respuesta de la API como respuesta al cliente
  if (packRenovableApiResponse) {
    console.log('Respuesta de API:', packRenovableApiResponse.data);
    return res.status(200).json(packRenovableApiResponse.data);
  } else {
    // Manejar el caso donde no hay respuesta de la API
    console.error('Sin respuesta de la API');
    return res.status(500).send('Error obteniendo respuesta de la API');
  }
};

const edit = (req: any, res: any) => {
  saveData(req);
  res.status(200).send('Edit');
};

const save = (req: any, res: any) => {
  saveData(req);
  res.status(200).send('Save'); 
};

const publish = (req: any, res: any) => {
  saveData(req);
  res.status(200).send('Publish');
};

const validate = (req: any, res: any) => {
  saveData(req);
  res.status(200).send('Validate');
};

const stop = (req: any, res: any) => {
  saveData(req);
  res.status(200).send('Stop');
};

export default {
  logExecuteData,
  execute,
  edit,
  save,
  publish,
  validate,
  stop,
};
