'use strict';
import https from 'https';
import axios from 'axios';
import { Request } from 'express';
import { Response } from 'express';
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
    host: req.host,
    fresh: req.fresh,
    stale: req.stale,
    protocol: req.protocol,
    secure: req.secure,
    originalUrl: req.originalUrl
  });
}

interface InputParamenter {
    dataExtension?: string;
    channel?: string;
  }

interface DecodedBody {
  inArguments?: InputParamenter[];
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
  try{
  const { body } = req;
  const { env: { JWT_SECRET } } = process;

  console.log('1Cellular Number:', body.cellularNumber);
  console.log('1Data Extension:', body.dataExtension);
  console.log('1Channel:', body.channel);

  if (!body) {
    console.error(new Error('invalid jwtdata'));
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

        const now = new Date();
        let ValidationFailed = false;
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        let response;
  
        if (!ValidationFailed) {
            const {
                API_URL,
                API_SESSION_ID,
                API_COUNTRY
              } = process.env;
  
          let dataExtension: string | null = null;
          for (const argument of decoded.inArguments) {
            if (argument.dataExtension) {
                dataExtension = argument.dataExtension;
              break;
            }  
          }
          let channel: string | null = null;
          for (const argument of decoded.inArguments) {
            if (argument.channel) {
                channel = argument.channel;
              break;
            }  
          }

          if (!dataExtension || !channel) return res.status(400).send('Input parameter is missing.');
  
          console.log('LLamando a la API..');

          //---
          console.log('2Cellular Number:', body.cellularNumber);
          console.log('2Data Extension:', dataExtension);
          console.log('2Channel:', channel);

          const packRenovableApiResponse : { data: RequestBody } | null = await axios({
            method: 'post',
            url: API_URL,
            data: {
              cellularNumber: body.cellularNumber,
              channel: body.channel
            } as RequestBody,
            headers: {
              Country: API_COUNTRY!,
              'Session-Id': API_SESSION_ID!
            },
            httpsAgent,
          })
            .then((res: any) => {
              console.log('Response');
              console.log(res.data);
              return res.data;
            })
            .catch((err: any) => {
              console.log('Error:');
              console.log(err);
            });
          if (!packRenovableApiResponse) ValidationFailed = true;
          else response = packRenovableApiResponse.data;
        }

        //----
  
  //       res.status(200).send({
  //           response,
  //         ValidationFailed,
  //       });
  //     } else {
  //       console.error('inArguments invalid.');
  //       return res.status(400).end();
      }
    },
  );
  } catch (error) {
    // console.error('Error en la ejecución:', error);
    // return res.status(500).send('Error en la ejecución');
  }
};

const edit = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Edit');
};

const save = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Save');
};

const publish = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Publish');
};

const validate = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Validate');
};

const stop = (req: any, res: any) => {  
  saveData(req);
  res.send(200, 'Stop');
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