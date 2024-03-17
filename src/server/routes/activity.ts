import https from 'https';
import axios from 'axios';
import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

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

interface InputParamenter {
  cellularNumber?: string;
  channel?: string;
}

interface DecodedBody {
  inArguments?: InputParamenter[];
}

interface DurationTimestampsPair {
  start: number | null;
  end: number | null;
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
  const { env: { JWT_SECRET } } = process;

  if (!body) {
    console.error(new Error('Invalid jwtdata'));
    return res.status(401).end();
  }
  if (!JWT_SECRET) {
    console.error(new Error('jwtSecret not provided'));
    return res.status(401).end();
  }

  verify(
    body.toString('utf8'),
    JWT_SECRET,
    { algorithms: ['HS256'], complete: false },
    async (err: any, decoded?: any) => {
      if (err) {
        console.error(err);
        return res.status(401).end();
      }
      if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
        const { value, expiresAt } = req.app.locals.token;
        let cellularNumber: string | null = null;
        let channel: string | null = null;
        for (const argument of decoded.inArguments) {
          if (argument.cellularNumber) cellularNumber = argument.cellularNumber;
          else if (argument.channel) channel = argument.channel;
          if (channel && cellularNumber) break;
        }
        if (!channel || !cellularNumber) return res.status(400).send('Input parameter is missing.');

        const now = new Date();

        let balanceValidationFailed = false;
        const offersRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };

        const {
          API_URL,
          API_SESSION_ID,
          API_COUNTRY
        } = process.env;

        console.log('Calling offers API...');
        const offersApiResponse: { data: ResponseBody } | null = await axios({
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
                  console.error('Error response from offers API:', status, data);
              }
              console.log('Error when calling the offers API:');
              console.log(err);
              return null;
          });

        offersRequestDurationTimestamps.end = performance.now();

        // Enviar la respuesta de la API como respuesta al cliente
        if (offersApiResponse) {
          console.log('Offers API response:', offersApiResponse.data);
          return res.status(200).json(offersApiResponse.data);
        } else {
          // Manejar el caso donde no hay respuesta de la API
          console.error('No response from offers API');
          return res.status(500).send('Error obteniendo respuesta de la API');
        }
      }
    },
  );
};

const edit = (req: any, res: any) => {
  saveData(req);
  res.status(200).send('Edit'); // Cambiar res.send(200, 'Edit') por res.status(200).send('Edit')
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
