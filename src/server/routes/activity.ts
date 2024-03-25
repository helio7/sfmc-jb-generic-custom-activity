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
  dataExtension: string;
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
  try {
    const { body } = req;
    console.log('Request Body:', body);

    // const cellularNumber = 1121806490;
    // const channel = "PDC";
    // const dataExtension = "TestCA";

    const dataExtension = body.dataExtension;
    const channel = body.channel;
    const cellularNumber = body.cellularNumber; 


    console.log('Cellular Number:', cellularNumber);
    console.log('Data Extension:', dataExtension);
    console.log('Channel:', channel);

    if (!dataExtension || !channel || !cellularNumber) {
      console.error(new Error('Missing input parameters'));
      return res.status(400).send('Missing input parameters');
    }

    const now = Date.now();
    const offersRequestDurationTimestamps = { start: now, end: null as null | number };

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
        cellularNumber: cellularNumber,
        channel: channel
      } as RequestBody,
      headers: {
        Country: API_COUNTRY!,
        'Session-Id': API_SESSION_ID!
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    offersRequestDurationTimestamps.end = Date.now();

    if (packRenovableApiResponse) {
      console.log('Respuesta de API:', packRenovableApiResponse.data);
      // return res.status(200).send(packRenovableApiResponse.data);
      return res.status(200).json(packRenovableApiResponse.data);
    } else {

      console.error('Sin respuesta de la API');
      return res.status(500).send('Error obteniendo respuesta de la API');
    }
  } catch (error) {
    console.error('Error en la ejecución:', error);
    return res.status(500).send('Error en la ejecución');
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
